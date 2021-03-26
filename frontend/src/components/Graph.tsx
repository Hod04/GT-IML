import React from "react";
import _ from "lodash";
import ForceGraph, {
  ForceGraphMethods,
  NodeObject,
} from "react-force-graph-2d";
import { convexHull } from "../helpers/algorithms/grahamScan";
import { SharedTypes } from "../shared/sharedTypes";
import { pointInPolygon } from "../helpers/algorithms/rayCasting";
import { pointInArc } from "../helpers/algorithms/pointInArc";
import {
  CANVAS_ARC_ANTICLOCKWISE,
  CANVAS_ARC_END_ANGLE,
  CANVAS_ARC_RADIUS,
  CANVAS_ARC_START_ANGLE,
  CLUSTER_COMPACTNESS,
  FORCE_CHARGE_MAX_DISTANCE,
  FORCE_GRAPH_WARM_UP_TICKS,
  FORCE_LINK_DIFFERENT_CLUSTER_DISTANCE,
  FORCE_LINK_DIFFERENT_CLUSTER_DISTANCE_CLOSER_DISTANCE,
  FORCE_LINK_DIFFERENT_CLUSTER_DISTANCE_FARTHER_DISTANCE,
  FORCE_LINK_SAME_CLUSTER_DISTANCE,
  FORCE_LINK_SAME_CLUSTER_DISTANCE_MORE_COMPACT,
  FORCE_LINK_SAME_CLUSTER_DISTANCE_LESS_COMPACT,
  PAIRWISE_CLUSTER_DISTANCE,
  ZOOM_TO_FIT_DURATION,
  ZOOM_TO_FIT_PADDING,
  KELLY_COLOR_PALETTE,
} from "../helpers/constants";
import {
  generateLinks,
  getArcCenterForClustersWithAtMostTwoElements,
  getClusterNodeCoordinations,
} from "../helpers/graphHelpers/graphHelpers";
import { getColorAccordingToPairwiseDistance } from "../helpers/nodeDrawerHelpers/nodeDrawersHelpers";
import {
  calculateDistanceMatrix,
  euclideanDistance,
  getDistanceRange,
  mDistance,
} from "../helpers/algorithms/calculateDistanceMatrix";
import { embeddings } from "../helpers/embeddings";
import { kmedoids } from "../helpers/algorithms/kmedoids";

class Graph extends React.Component<
  SharedTypes.Graph.IGraphProps,
  SharedTypes.Graph.IGraphState
> {
  constructor(props: SharedTypes.Graph.IGraphProps) {
    super(props);
    this.state = {
      data: {} as SharedTypes.Graph.IData,
      attributeWeightArray: _.fill(new Array(200), 1),

      nodeClusters: {},
      numberOfNodesInCluster: {},
      clusterConvexHullCoordinations: {},
      clusterColorObject: {},

      distanceRange: {} as { min: number; max: number },
      distanceMatrix: [],

      renderCounter: 0,
    };
  }

  private graphRef: React.MutableRefObject<ForceGraphMethods> = React.createRef() as React.MutableRefObject<ForceGraphMethods>;

  public async componentDidMount(): Promise<void> {
    const dataRes: Response = await fetch("data/data.json");
    const data: SharedTypes.Graph.IData = await dataRes.json();
    this.constructGraph(data, true);
  }

  public componentDidUpdate(
    prevProps: SharedTypes.Graph.IGraphProps,
    prevState: SharedTypes.Graph.IGraphState
  ): void {
    if (this.state.nodeWithNewlyAssignedCluster != null) {
      this.handleNodeClusterMembershipChange();
    }

    if (
      !_.isEqual(prevProps.clusterCompactness, this.props.clusterCompactness) ||
      !_.isEqual(
        prevProps.pairwiseClusterDistance,
        this.props.pairwiseClusterDistance
      ) ||
      !_.isEqual(prevProps.dynamicGraph, this.props.dynamicGraph)
    ) {
      this.graphRef.current.d3ReheatSimulation();
    }

    if (!_.isEqual(prevProps.k, this.props.k)) {
      this.constructGraph(this.state.data, false);
    }

    if (
      !_.isEqual(
        prevState.attributeWeightArray,
        this.state.attributeWeightArray
      )
    ) {
      this.constructGraph(this.state.data, false);
    }
  }

  private constructGraph = (
    data: SharedTypes.Graph.IData,
    mounted: boolean
  ): void => {
    const distanceMatrix: number[][] = this.assignDistanceMatrix();
    const distanceRange: {
      min: number;
      max: number;
    } = getDistanceRange(distanceMatrix);

    this.assignDistanceObjectsForNodes(data.nodes, distanceMatrix);

    // const _nodeDiffObject: {
    //   [nodeId: number]: SharedTypes.Graph.INode;
    // } =
    // if (mounted)
    this.assignClusterObjects(data.nodes, this.props.k, distanceMatrix);

    const {
      nodeClusters,
      numberOfNodesInCluster,
    } = this.getNodeClustersStateProperties(data.nodes);

    const clusterColorObject: {
      [clusterId: number]: string;
    } = this.getClusterColorObject(
      data.nodes,
      nodeClusters,
      // mounted ? {} : nodeDiffObject
      {}
    );

    this.setState(
      {
        data: {
          nodes: data.nodes,
          links: generateLinks(data.nodes),
        },
        distanceMatrix,
        distanceRange,
        nodeClusters,
        numberOfNodesInCluster,
        clusterColorObject,
      },
      () =>
        // update App.tsx
        this.props.assignNodes(this.state.data.nodes)
    );
  };

  private handleNodeClusterMembershipChange = (): void => {
    let dataClone: SharedTypes.Graph.IData = _.clone(this.state.data);
    const newlyAssignedClusterId: number = this.state
      .nodeWithNewlyAssignedCluster!.newClusterId;
    const newlyAssignedNode: SharedTypes.Graph.INode | undefined = _.find(
      dataClone.nodes,
      (node) => node.id === this.state.nodeWithNewlyAssignedCluster!.node.id
    );

    if (newlyAssignedNode != null) {
      let attributeDistancesFromSourceClusterMedoid: number[] = [];
      let attributeDistancesFromDestinationClusterMedoid: number[] = [];

      const sourceClusterMedoidIndex: number = _.findIndex(
        this.state.data.nodes,
        (node) =>
          node.clusterId === newlyAssignedNode.clusterId &&
          node.distanceFromClusterMedoid === 0
      );

      const destinationClusterMedoidIndex: number = _.findIndex(
        this.state.data.nodes,
        (node) =>
          node.clusterId === newlyAssignedClusterId &&
          node.distanceFromClusterMedoid === 0
      );

      const newlyAssignedEmbeddingsRow: number[] =
        embeddings[newlyAssignedNode.index];
      const sourceClusterMedoidEmbeddingsRow: number[] =
        embeddings[sourceClusterMedoidIndex];
      const destinationClusterMedoidEmbeddingsRow: number[] =
        embeddings[destinationClusterMedoidIndex];

      if (
        newlyAssignedEmbeddingsRow == null ||
        sourceClusterMedoidEmbeddingsRow == null ||
        destinationClusterMedoidEmbeddingsRow == null
      ) {
        return;
      }

      for (let i: number = 0; i < newlyAssignedEmbeddingsRow.length; i++) {
        attributeDistancesFromSourceClusterMedoid[i] = mDistance(
          newlyAssignedEmbeddingsRow[i],
          sourceClusterMedoidEmbeddingsRow[i]
        );
        attributeDistancesFromDestinationClusterMedoid[i] = mDistance(
          newlyAssignedEmbeddingsRow[i],
          destinationClusterMedoidEmbeddingsRow[i]
        );
      }

      const destinationMedoidAttributeSimilarityArray: {
        value: number;
        index: number;
      }[] = _.map(
        attributeDistancesFromDestinationClusterMedoid,
        (attribute, index) => {
          return {
            value: attribute,
            index,
          };
        }
      );

      const sourceMedoidAttributeSimilarityArray: {
        value: number;
        index: number;
      }[] = _.map(
        attributeDistancesFromSourceClusterMedoid,
        (attribute, index) => {
          return {
            value: attribute,
            index,
          };
        }
      );

      const sortedDestinationMedoidAttributeSimilarityArray = destinationMedoidAttributeSimilarityArray.sort(
        (a, b) => a.value - b.value
      );
      const sortedSourceMedoidAttributeSimilarityArray = sourceMedoidAttributeSimilarityArray.sort(
        (a, b) => a.value - b.value
      );

      let adjustedAttributeWeightArray: number[] = _.clone(
        this.state.attributeWeightArray
      );

      _.each(
        sortedSourceMedoidAttributeSimilarityArray,
        (elem, itereeIndex: number) => {
          // dragged node === source medoid
          if (elem.value === 0) {
            return;
          }
          let adjustedWeightValue: number = 0;
          if (itereeIndex < 100) {
            adjustedWeightValue = (100 - itereeIndex) / 200;
          } else {
            adjustedWeightValue = -(itereeIndex + 1) / 400;
          }

          if (
            adjustedAttributeWeightArray[elem.index] + adjustedWeightValue >
            0
          ) {
            adjustedAttributeWeightArray[elem.index] += adjustedWeightValue;
          } else {
            adjustedAttributeWeightArray[elem.index] = 0.001;
          }
        }
      );

      _.each(
        sortedDestinationMedoidAttributeSimilarityArray,
        (elem, itereeIndex: number) => {
          let adjustedWeightValue: number = 0;
          if (itereeIndex < 100) {
            adjustedWeightValue = (100 - itereeIndex) / 200;
          } else {
            adjustedWeightValue = -(itereeIndex + 1) / 400;
          }

          if (
            adjustedAttributeWeightArray[elem.index] + adjustedWeightValue >
            0
          ) {
            adjustedAttributeWeightArray[elem.index] += adjustedWeightValue;
          } else {
            adjustedAttributeWeightArray[elem.index] = 0.001;
          }
        }
      );

      this.setState({
        renderCounter: 0,
        nodeWithNewlyAssignedCluster: undefined,
        attributeWeightArray: adjustedAttributeWeightArray,
      });
    }
  };

  private assignDistanceMatrix = (): number[][] =>
    calculateDistanceMatrix(
      embeddings,
      euclideanDistance,
      this.state.attributeWeightArray,
      1
    );

  private assignDistanceObjectsForNodes = (
    nodes: SharedTypes.Graph.INode[],
    distanceMatrix: number[][]
  ): void => {
    let nodeIds: number[] = [];
    _.each(nodes, (node) => {
      nodeIds.push(node.id);
    });

    _.each(nodes, (node, index) => {
      let distanceObj: {
        [nodeId: number]: number;
      } = {};
      _.each(nodeIds, (nodeId, nodeIdIndex) => {
        if (nodeId !== node.id) {
          distanceObj[nodeId] = distanceMatrix[index][nodeIdIndex];
        }
      });
      node.distances = distanceObj;
    });
  };

  // and return node diff
  private assignClusterObjects = (
    nodes: SharedTypes.Graph.INode[],
    k: number,
    distanceMatrix: number[][]
  ): { [nodeId: number]: SharedTypes.Graph.INode } => {
    const {
      nodeMedoidInfoObjects,
      medoidObject,
    }: {
      nodeMedoidInfoObjects: {
        [nodeId: number]: {
          medoid: number;
          distanceFromMedoid: number;
        };
      };
      medoidObject: { [medoid: number]: number };
    } = kmedoids(distanceMatrix, nodes, k);
    let nodeDiffObject: { [nodeId: number]: SharedTypes.Graph.INode } = {};
    _.each(nodes, (node) => {
      const { medoid, distanceFromMedoid } = nodeMedoidInfoObjects[node.id];
      if (
        node.clusterId !== medoid &&
        node.distanceFromClusterMedoid !== distanceFromMedoid &&
        node.medoidNodeIndex !== medoidObject[node.clusterId]
      ) {
        nodeDiffObject[node.id] = node;
      }
      node.clusterId = medoid;
      node.distanceFromClusterMedoid = distanceFromMedoid;
      node.medoidNodeIndex = medoidObject[node.clusterId];
    });

    return nodeDiffObject;
  };

  private getClusterColorObject = (
    nodes: SharedTypes.Graph.INode[],
    nodeClusters: { [clusterId: number]: number },
    nodeDiffObject: { [nodeId: number]: SharedTypes.Graph.INode }
  ): { [clusterId: number]: string } => {
    let clusterColorObject: { [clusterId: number]: string } = {};

    _.each(nodes, (node) => {
      const clusterId: number = node.clusterId;
      const clusterIndex: number = Object.values(nodeClusters).indexOf(
        clusterId
      );
      const nodeColor: string = KELLY_COLOR_PALETTE[clusterIndex];

      node.color = nodeColor;

      if (!(node.clusterId in clusterColorObject)) {
        clusterColorObject[clusterId] = nodeColor;
      }

      if (node.id in nodeDiffObject) {
        node.color = "pink";
      }
    });

    return clusterColorObject;
  };

  private getNodeClustersStateProperties = (
    nodes: SharedTypes.Graph.INode[]
  ): {
    nodeClusters: { [clusterId: number]: number };
    numberOfNodesInCluster: { [clusterId: number]: number };
  } => {
    let nodeClusters: { [clusterId: number]: number } = {};
    let numberOfNodesInCluster: { [clusterId: number]: number } = {};

    _.each(nodes, (node: SharedTypes.Graph.INode) => {
      const nodeCluster: number = node.clusterId;
      if (!(node.clusterId in nodeClusters)) {
        nodeClusters[node.clusterId] = nodeCluster;
      }
      if (!(nodeCluster in numberOfNodesInCluster)) {
        numberOfNodesInCluster[nodeCluster] = 1;
      } else {
        numberOfNodesInCluster[nodeCluster] += 1;
      }
    });
    return { nodeClusters, numberOfNodesInCluster };
  };

  private getClusterConvexHullCoordinations = (): SharedTypes.Graph.IClusterConvexHullCoordinations => {
    const { nodes } = this.state.data;
    const clusterNodesCoordinations: SharedTypes.Graph.IClusterNodeCoordinations = getClusterNodeCoordinations(
      nodes
    );

    let clusterConvexHullCoordinations: SharedTypes.Graph.IClusterConvexHullCoordinations = {};

    _.each(_.keys(clusterNodesCoordinations), (medoid) => {
      const clusterId: number = parseInt(medoid);
      let x: number[] = clusterNodesCoordinations[clusterId].x;
      let y: number[] = clusterNodesCoordinations[clusterId].y;
      const clusterCoordinations: number[][] = x.map((xElem, index) => [
        xElem,
        y[index],
      ]);

      if (clusterCoordinations.length <= 2) {
        const arcCenter: {
          x: number;
          y: number;
        } = getArcCenterForClustersWithAtMostTwoElements(clusterCoordinations);
        clusterConvexHullCoordinations[clusterId] = [
          [arcCenter.x, arcCenter.y],
        ];
      } else {
        clusterConvexHullCoordinations[clusterId] = convexHull(
          clusterCoordinations
        );
      }
    });

    this.setState({
      clusterConvexHullCoordinations: clusterConvexHullCoordinations,
    });
    return clusterConvexHullCoordinations;
  };

  private getPairwiseClusterDistance = (): number => {
    let pairwiseClusterDistance: number = FORCE_LINK_DIFFERENT_CLUSTER_DISTANCE;
    if (
      this.props.pairwiseClusterDistance === PAIRWISE_CLUSTER_DISTANCE.Closer
    ) {
      pairwiseClusterDistance = FORCE_LINK_DIFFERENT_CLUSTER_DISTANCE_CLOSER_DISTANCE;
    } else if (
      this.props.pairwiseClusterDistance === PAIRWISE_CLUSTER_DISTANCE.Farther
    ) {
      pairwiseClusterDistance = FORCE_LINK_DIFFERENT_CLUSTER_DISTANCE_FARTHER_DISTANCE;
    }
    return pairwiseClusterDistance;
  };

  private getClusterCompactnessValue = (): number => {
    let clusterCompactnessValue: number = FORCE_LINK_SAME_CLUSTER_DISTANCE;
    if (this.props.clusterCompactness === CLUSTER_COMPACTNESS.LessCompact) {
      clusterCompactnessValue = FORCE_LINK_SAME_CLUSTER_DISTANCE_LESS_COMPACT;
    } else if (
      this.props.clusterCompactness === CLUSTER_COMPACTNESS.MoreCompact
    ) {
      clusterCompactnessValue = FORCE_LINK_SAME_CLUSTER_DISTANCE_MORE_COMPACT;
    }
    return clusterCompactnessValue;
  };

  private assignPairwiseDistances = (d3Graph: ForceGraphMethods): void => {
    const forceFn: SharedTypes.Graph.IForceFn | undefined = d3Graph.d3Force(
      "link"
    ) as SharedTypes.Graph.IForceFn;

    forceFn?.distance((link: SharedTypes.Graph.ILink) => {
      const sourceNode: SharedTypes.Graph.INode = link.source;
      const targetNode: SharedTypes.Graph.INode = link.target;
      if (sourceNode?.clusterId !== targetNode?.clusterId) {
        let pairwiseClusterDistance: number = this.getPairwiseClusterDistance();
        return (
          pairwiseClusterDistance * sourceNode.distances[targetNode.id] * 1.5
        );
      } else {
        let clusterCompactnessValue: number = this.getClusterCompactnessValue();
        return (
          clusterCompactnessValue * sourceNode.distances[targetNode.id] * 5
        );
      }
    });

    const chargeFn: SharedTypes.Graph.IForceFn | undefined = d3Graph.d3Force(
      "charge"
    ) as SharedTypes.Graph.IForceFn;
    chargeFn?.distanceMax(FORCE_CHARGE_MAX_DISTANCE);
  };

  private drawArcForClustersWithAtMostTwoElements = (
    ctx: CanvasRenderingContext2D,
    clusterConvexHullCoordinations: SharedTypes.Graph.IClusterConvexHullCoordinations,
    clusterId: number
  ): void => {
    const clusterCoordinations: number[][] =
      clusterConvexHullCoordinations[clusterId];

    const arcCenter: {
      x: number;
      y: number;
    } = { x: clusterCoordinations[0][0], y: clusterCoordinations[0][1] };

    ctx.arc(
      arcCenter.x,
      arcCenter.y,
      CANVAS_ARC_RADIUS,
      CANVAS_ARC_START_ANGLE,
      CANVAS_ARC_END_ANGLE,
      CANVAS_ARC_ANTICLOCKWISE
    );
  };

  private drawClusterHulls = (ctx: CanvasRenderingContext2D): void => {
    let clusterConvexHullCoordinations: SharedTypes.Graph.IClusterConvexHullCoordinations = {};

    let newConvexHulls: boolean = false;
    // draw the convex hulls when component mounts and upon change in cluster membership
    if (
      !this.props.dynamicGraph &&
      _.isEqual(
        _.keys(this.state.clusterConvexHullCoordinations),
        _.keys(this.state.nodeClusters)
      ) &&
      this.state.renderCounter > 5
    ) {
      clusterConvexHullCoordinations = this.state
        .clusterConvexHullCoordinations;
    } else {
      clusterConvexHullCoordinations = this.getClusterConvexHullCoordinations();
      newConvexHulls = true;
      if (!this.props.dynamicGraph) {
        this.setState({ renderCounter: this.state.renderCounter + 1 });
      }
    }

    _.each(_.values(this.state.nodeClusters), (clusterId) => {
      if (
        clusterConvexHullCoordinations != null &&
        clusterConvexHullCoordinations[clusterId] != null &&
        clusterConvexHullCoordinations[clusterId].length > 0
      ) {
        ctx.strokeStyle = this.state.clusterColorObject[clusterId];
        ctx.beginPath();

        _.each(clusterConvexHullCoordinations[clusterId], (cluster, index) => {
          if (cluster == null || cluster.length < 2) {
            return;
          }

          if (clusterConvexHullCoordinations[clusterId].length <= 2) {
            this.drawArcForClustersWithAtMostTwoElements(
              ctx,
              clusterConvexHullCoordinations,
              clusterId
            );
            return;
          }

          ctx.lineTo(cluster[0], cluster[1]);

          // draw a line from the last to the first element of the cluster
          if (index === clusterConvexHullCoordinations[clusterId].length - 1) {
            ctx.lineTo(
              clusterConvexHullCoordinations[clusterId][0][0],
              clusterConvexHullCoordinations[clusterId][0][1]
            );
          }
        });

        ctx.stroke();
      }

      // adjust the camera's view in case new convex hulls were created
      if (newConvexHulls && !this.props.dynamicGraph) {
        this.graphRef.current?.zoomToFit(
          ZOOM_TO_FIT_DURATION,
          ZOOM_TO_FIT_PADDING
        );
      }
    });
  };

  private assignNewlyAssignedClusterToNode(
    canvasNode: SharedTypes.Graph.INode
  ): void {
    const newlyAssginedCluster: number[][] | undefined = _.find(
      this.state.clusterConvexHullCoordinations,
      (convexHull, clusterId) => {
        if (
          convexHull.length === 1 &&
          canvasNode.clusterId !== parseInt(clusterId)
        ) {
          return pointInArc(
            canvasNode.x,
            canvasNode.y,
            convexHull[0][0],
            convexHull[0][1],
            CANVAS_ARC_RADIUS
          );
        }
        return pointInPolygon([canvasNode.x, canvasNode.y], convexHull);
      }
    );

    if (newlyAssginedCluster == null) {
      return;
    }

    const cId: string | undefined = _.findKey(
      this.state.clusterConvexHullCoordinations,
      (convexHull) => convexHull === newlyAssginedCluster
    );

    if (cId == null) {
      return;
    }

    const newlyAssignedClusterId: number = parseInt(cId);

    if (newlyAssignedClusterId !== canvasNode.clusterId) {
      this.setState({
        nodeWithNewlyAssignedCluster: {
          node: canvasNode,
          newClusterId: newlyAssignedClusterId,
        },
      });
    }
  }

  render() {
    return (
      <>
        {!_.isEmpty(this.state.data) && (
          <ForceGraph
            ref={this.graphRef}
            graphData={this.state.data}
            linkColor={(link) => {
              const linkObject: SharedTypes.Graph.ILink = link as SharedTypes.Graph.ILink;
              return getColorAccordingToPairwiseDistance(
                linkObject.pairwiseDistance
              );
            }}
            onNodeDragEnd={(node) => {
              const graphNode: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
              this.assignNewlyAssignedClusterToNode(graphNode);
            }}
            linkVisibility={this.props.showEdges}
            warmupTicks={
              this.props.dynamicGraph ? undefined : FORCE_GRAPH_WARM_UP_TICKS
            }
            cooldownTicks={this.props.dynamicGraph ? Infinity : 0}
            onRenderFramePre={(ctx) => {
              if (this.graphRef.current != null) {
                this.assignPairwiseDistances(this.graphRef.current);
              }
              this.drawClusterHulls(ctx);
            }}
            nodeCanvasObjectMode={() => "before"}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const graphNode: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
              const label: string = graphNode.nodeLabel;
              const fontSize: number = 15 / globalScale;
              const textWidth: number = ctx.measureText(label).width;
              const bckgDimensions: number[] = _.map(
                [textWidth, fontSize],
                (n) => n + fontSize * 0.2
              );

              ctx.fillStyle = "transparent";
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.fillRect(
                graphNode.x - bckgDimensions[0] / 2,
                graphNode.y - bckgDimensions[1] / 2,
                bckgDimensions[0],
                bckgDimensions[1]
              );
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = graphNode.color;
              ctx.fillText(label, graphNode.x, graphNode.y + 10);

              graphNode.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
            }}
            nodePointerAreaPaint={(node, color, ctx) => {
              const graphNode: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
              ctx.fillStyle = color;
              const bckgDimensions: number[] = graphNode.__bckgDimensions;
              bckgDimensions &&
                ctx.fillRect(
                  graphNode.x - bckgDimensions[0] / 2,
                  graphNode.y - bckgDimensions[1] / 2,
                  bckgDimensions[0],
                  bckgDimensions[1] + 10
                );
            }}
            onNodeClick={(node: NodeObject) => {
              const graphNode: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
              if (!this.props.isNodeDrawerOpen) {
                this.props.toggleNodeDrawer();
                this.props.assignNodeDrawerContent(graphNode);
              } else {
                this.props.assignNodeDrawerContent(graphNode);
              }
            }}
            onBackgroundClick={() => {
              if (this.props.isNodeDrawerOpen) {
                this.props.toggleNodeDrawer();
              }
            }}
          />
        )}
      </>
    );
  }
}

export default Graph;
