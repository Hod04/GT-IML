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
  getClusterColor,
  getClusterNodeCoordinations,
} from "../helpers/graphHelpers/graphHelpers";
import { getColorAccordingToPairwiseDistance } from "../helpers/nodeDrawerHelpers/nodeDrawersHelpers";
import {
  calculateDistanceMatrix,
  euclideanDistance,
  getDistanceRange,
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
      renderCounter: 0,
      data: {} as SharedTypes.Graph.IData,
      nodeClusters: {},
      numberOfNodesInCluster: {},
      clusterConvexHullCoordinations: {},
      distanceRange: {} as { min: number; max: number },
      distanceMatrix: [],
    };
  }

  private graphRef: React.MutableRefObject<ForceGraphMethods> = React.createRef() as React.MutableRefObject<ForceGraphMethods>;

  public async componentDidMount(): Promise<void> {
    const dataRes: Response = await fetch("data/data.json");
    const data: SharedTypes.Graph.IData = await dataRes.json();

    this.assignDistanceMatrix();

    this.assignDistanceRange();

    this.assignDistanceObjectsForNodes(data.nodes);

    this.assignClusterObjects(data.nodes, this.props.k);

    this.assignNodeClustersStateProperties(data.nodes);

    this.assignNodeColors(data.nodes);

    this.props.assignNodes(data.nodes);

    this.setState({
      data: {
        nodes: data.nodes,
        links: generateLinks(data.nodes),
      },
    });
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
      const { nodes } = this.state.data;
      this.assignClusterObjects(nodes, this.props.k);

      this.assignNodeClustersStateProperties(nodes);

      this.assignNodeColors(nodes);

      this.props.assignNodes(nodes);

      this.setState({
        data: {
          nodes,
          links: generateLinks(nodes),
        },
      });
    }
  }

  private handleNodeClusterMembershipChange = (): void => {
    let dataClone: SharedTypes.Graph.IData = _.clone(this.state.data);
    const newlyAssignedNode: SharedTypes.Graph.INode | undefined = _.find(
      dataClone.nodes,
      (node) => node.id === this.state.nodeWithNewlyAssignedCluster!.node.id
    );

    if (newlyAssignedNode != null) {
      // assign the newly assigned node its new cluster & corresponding color
      newlyAssignedNode.color = getClusterColor(
        this.state.data.nodes,
        this.state.nodeWithNewlyAssignedCluster!.newClusterId
      );
      newlyAssignedNode.clusterId = this.state.nodeWithNewlyAssignedCluster!.newClusterId;

      dataClone.nodes.splice(newlyAssignedNode.index, 1, newlyAssignedNode);

      dataClone.links = generateLinks(dataClone.nodes);

      this.setState(
        {
          renderCounter: 0,
          nodeWithNewlyAssignedCluster: undefined,
          clusterConvexHullCoordinations: {},
          nodeClusters: {},
          data: dataClone,
        },
        () => {
          const { nodes } = this.state.data;
          this.assignNodeClustersStateProperties(nodes);
        }
      );
    }
  };

  private assignDistanceMatrix = (): void => {
    const distanceMatrix: number[][] = calculateDistanceMatrix(
      embeddings,
      euclideanDistance,
      1,
      1
    );
    this.setState({ distanceMatrix });
  };

  private assignDistanceObjectsForNodes = (
    nodes: SharedTypes.Graph.INode[]
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
          distanceObj[nodeId] = this.state.distanceMatrix[index][nodeIdIndex];
        }
      });
      node.distances = distanceObj;
    });
  };

  private assignClusterObjects = (
    nodes: SharedTypes.Graph.INode[],
    k: number
  ): void => {
    const nodeMedoidInfoObjects: {
      [nodeId: number]: {
        medoid: number;
        distanceFromMedoid: number;
      };
    } = kmedoids(this.state.distanceMatrix, nodes, k);
    _.each(nodes, (node) => {
      const { medoid, distanceFromMedoid } = nodeMedoidInfoObjects[node.id];
      node.clusterId = medoid;
      node.distanceFromClusterMedoid = distanceFromMedoid;
    });
  };

  private assignDistanceRange = (): void => {
    const distanceRange: { min: number; max: number } = getDistanceRange(
      this.state.distanceMatrix
    );
    this.setState({ distanceRange });
  };

  private assignNodeColors = (nodes: SharedTypes.Graph.INode[]): void => {
    _.each(nodes, (node) => {
      const clusterId: number = Object.values(this.state.nodeClusters).indexOf(
        node.clusterId
      );
      node.color = KELLY_COLOR_PALETTE[clusterId];
    });
  };

  private assignNodeClustersStateProperties = (
    nodes: SharedTypes.Graph.INode[]
  ): void => {
    let nodeClusters: { [clusterId: number]: number } = {};
    let numberOfNodesInCluster: { [clusterId: number]: number } = {};
    // let

    _.each(nodes, (node: SharedTypes.Graph.INode) => {
      if (!(node.clusterId in nodeClusters)) {
        const nodeCluster: number = node.clusterId;
        nodeClusters[node.clusterId] = nodeCluster;
        if (!(nodeCluster in numberOfNodesInCluster)) {
          numberOfNodesInCluster[nodeCluster] = 1;
          return;
        }
        numberOfNodesInCluster[nodeCluster] += 1;
      }
    });
    this.setState({
      nodeClusters,
      numberOfNodesInCluster,
    });
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
      // console.log(
      //   _.find(this.state.data.nodes, (node) => node.id === 10)?.medoid
      // );
      if (sourceNode?.clusterId !== targetNode?.clusterId) {
        let pairwiseClusterDistance: number = this.getPairwiseClusterDistance();
        return (
          pairwiseClusterDistance * sourceNode.distances[targetNode.id] * 1.5
        );
      } else {
        let clusterCompactnessValue: number = this.getClusterCompactnessValue();
        return (
          clusterCompactnessValue * sourceNode.distances[targetNode.id] * 1.5
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
        ctx.strokeStyle = getClusterColor(this.state.data.nodes, clusterId);
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
            nodeAutoColorBy={"medoid"}
            linkColor={(link) => {
              const linkObject: SharedTypes.Graph.ILink = link as SharedTypes.Graph.ILink;
              return getColorAccordingToPairwiseDistance(
                linkObject.pairwiseDistance
              );
            }}
            onNodeDragEnd={(node) => {
              const canvasNode: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
              this.assignNewlyAssignedClusterToNode(canvasNode);
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
              const canvasNode: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
              const label: string = canvasNode.nodeLabel;
              const fontSize: number = 15 / globalScale;
              const textWidth: number = ctx.measureText(label).width;
              const bckgDimensions: number[] = _.map(
                [textWidth, fontSize],
                (n) => n + fontSize * 0.2
              );

              ctx.fillStyle = "transparent";
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.fillRect(
                canvasNode.x - bckgDimensions[0] / 2,
                canvasNode.y - bckgDimensions[1] / 2,
                bckgDimensions[0],
                bckgDimensions[1]
              );
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = canvasNode.color;
              ctx.fillText(label, canvasNode.x, canvasNode.y + 10);

              canvasNode.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
            }}
            nodePointerAreaPaint={(node, color, ctx) => {
              const canvasNode: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
              ctx.fillStyle = color;
              const bckgDimensions: number[] = canvasNode.__bckgDimensions;
              bckgDimensions &&
                ctx.fillRect(
                  canvasNode.x - bckgDimensions[0] / 2,
                  canvasNode.y - bckgDimensions[1] / 2,
                  bckgDimensions[0],
                  bckgDimensions[1] + 10
                );
            }}
            onNodeClick={(node: NodeObject) => {
              if (!this.props.isNodeDrawerOpen) {
                const nodeObj: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
                this.props.toggleNodeDrawer();
                this.props.assignNodeDrawerContent(nodeObj);
              }
            }}
          />
        )}
      </>
    );
  }
}

export default Graph;
