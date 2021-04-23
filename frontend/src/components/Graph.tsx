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
  DEFAULT_COLOR,
} from "../helpers/constants";
import {
  generateLinks,
  getArcCenterForClustersWithAtMostTwoElements,
  getClusterNodeCoordinations,
  isClusterNode,
} from "../helpers/graphHelpers/graphHelpers";
import { getColorAccordingToPairwiseDistance } from "../helpers/nodeDrawerHelpers/nodeDrawersHelpers";
import {
  calculateDistanceMatrix,
  euclideanDistance,
  getDistanceRange,
  manhattanDistance,
} from "../helpers/algorithms/calculateDistanceMatrix";
import { embeddings } from "../helpers/embeddings";
import { kMeans } from "../helpers/graphHelpers/kmeans";
import { Dialog } from "@blueprintjs/core";
import {
  assignClusterNodesActionCreator,
  assignKActionCreator,
  assignNodeDrawerContentActionCreator,
  assignNodesActionCreator,
  toggleAttributeWeightDialogActionCreator,
  toggleNodeDrawerActionCreator,
} from "../actions/actions";

class Graph extends React.Component<
  SharedTypes.Graph.IGraphProps,
  SharedTypes.Graph.IGraphState
> {
  constructor(props: SharedTypes.Graph.IGraphProps) {
    super(props);
    this.state = {
      data: {} as SharedTypes.Graph.IData,
      attributeWeightArray: _.fill(new Array(200), 1),
      weightedEmbeddings: embeddings,

      clusters: [],
      nodeClusters: {},
      numberOfNodesInCluster: {},
      clusterConvexHullCoordinations: {},
      clusterColorObject: {},

      distanceRange: {} as { min: number; max: number },
      distanceMatrix: [],

      renderCounter: 0,
      sortedTable: false,
    };
  }

  private graphRef: React.MutableRefObject<ForceGraphMethods> = React.createRef() as React.MutableRefObject<ForceGraphMethods>;

  public async componentDidMount(): Promise<void> {
    const dataRes: Response = await fetch("data/data.json");
    const data: SharedTypes.Graph.IData = await dataRes.json();
    this.constructGraph(data, true, true);
  }

  public componentDidUpdate(
    prevProps: SharedTypes.Graph.IGraphProps,
    prevState: SharedTypes.Graph.IGraphState
  ): void {
    if (this.state.nodeWithNewlyAssignedCluster != null) {
      this.constructGraph(this.state.data, false, false);
    }

    if (
      !_.isEqual(
        prevProps.store.clusterCompactness,
        this.props.store.clusterCompactness
      ) ||
      !_.isEqual(
        prevProps.store.pairwiseClusterDistance,
        this.props.store.pairwiseClusterDistance
      ) ||
      !_.isEqual(prevProps.store.dynamicGraph, this.props.store.dynamicGraph) ||
      !_.isEqual(
        prevProps.store.showClusterCentroids,
        this.props.store.showClusterCentroids
      )
    ) {
      this.graphRef.current.d3ReheatSimulation();
    }

    if (
      !_.isEqual(prevProps.store.k, this.props.store.k) &&
      !_.isEmpty(this.state.clusters)
    ) {
      this.constructGraph(this.state.data, true, false);
    }
  }

  private dispatch = async (action: SharedTypes.App.IAction): Promise<void> =>
    await this.props.reducer(this.props.store, action);

  private constructGraph = (
    data: SharedTypes.Graph.IData,
    constructGraphFromGroundUp: boolean,
    componentMounted: boolean
  ): void => {
    const nodeClusterMembershipCounterLimit: number = 100;
    let nodeClusterMembershipChangeCounter: number = 0;

    let nodeDiffObject: { [nodeId: number]: SharedTypes.Graph.INode } = {};
    let clusters: number[][] = [];
    let newlyConstructedNodes: SharedTypes.Graph.INode[] = _.clone(data.nodes);

    let adjustedWeightedEmbeddings: number[][] | undefined = [];
    let clusterObjectsInfo: SharedTypes.Graph.IClusterObjectInfo = {} as SharedTypes.Graph.IClusterObjectInfo;

    if (!constructGraphFromGroundUp) {
      while (
        nodeClusterMembershipChangeCounter <
          nodeClusterMembershipCounterLimit &&
        this.state.nodeWithNewlyAssignedCluster != null &&
        this.state.nodeWithNewlyAssignedCluster.node.clusterId !==
          this.state.nodeWithNewlyAssignedCluster.newClusterId
      ) {
        adjustedWeightedEmbeddings = this.handleNodeClusterMembershipChange(
          this.state.attributeWeightArray,
          adjustedWeightedEmbeddings,
          nodeClusterMembershipChangeCounter
        );

        clusterObjectsInfo = this.getClusterObjectInfo(
          newlyConstructedNodes,
          this.props.store.k,
          adjustedWeightedEmbeddings != null &&
            !_.isEmpty(adjustedWeightedEmbeddings)
            ? adjustedWeightedEmbeddings
            : this.state.weightedEmbeddings,
          this.state.clusters,
          componentMounted,
          nodeClusterMembershipChangeCounter
        );
        nodeDiffObject = {
          ...nodeDiffObject,
          ...clusterObjectsInfo.nodeDiffObject,
        };
        clusters = clusterObjectsInfo.clusters;
        newlyConstructedNodes =
          clusterObjectsInfo.nodesWithNewlyAssignedClusters;
        adjustedWeightedEmbeddings =
          clusterObjectsInfo.weightedEmbeddingsIncludingClusterCentroids;
        nodeClusterMembershipChangeCounter++;
      }
    } else {
      clusterObjectsInfo = this.getClusterObjectInfo(
        newlyConstructedNodes,
        this.props.store.k,
        adjustedWeightedEmbeddings != null &&
          !_.isEmpty(adjustedWeightedEmbeddings)
          ? adjustedWeightedEmbeddings
          : this.state.weightedEmbeddings,
        // let k-means generate random centroids for us when firstly constructing the graph
        [],
        componentMounted
      );
      clusters = clusterObjectsInfo.clusters;
      newlyConstructedNodes = clusterObjectsInfo.nodesWithNewlyAssignedClusters;
      adjustedWeightedEmbeddings =
        clusterObjectsInfo.weightedEmbeddingsIncludingClusterCentroids;
    }

    const distanceMatrix: number[][] = this.getDistanceMatrix(
      adjustedWeightedEmbeddings != null &&
        !_.isEmpty(adjustedWeightedEmbeddings)
        ? adjustedWeightedEmbeddings
        : this.state.weightedEmbeddings
    );

    const distanceRange: {
      min: number;
      max: number;
    } = getDistanceRange(distanceMatrix);

    newlyConstructedNodes = this.getDistanceObjectsForNodes(
      newlyConstructedNodes,
      distanceMatrix
    );

    const {
      nodeClusters,
      numberOfNodesInCluster,
    } = this.getNodeClustersStateProperties(newlyConstructedNodes);

    const {
      clusterColorObject,
      nodesWithNewlyAssignedColors,
    } = this.getClusterColorObjectInfo(
      newlyConstructedNodes,
      nodeClusters,
      nodeDiffObject
    );

    newlyConstructedNodes = nodesWithNewlyAssignedColors;

    this.setState(
      {
        data: {
          nodes: newlyConstructedNodes,
          links: generateLinks(
            newlyConstructedNodes,
            constructGraphFromGroundUp
          ),
        },
        weightedEmbeddings: adjustedWeightedEmbeddings,
        distanceMatrix,
        distanceRange,
        nodeClusters,
        numberOfNodesInCluster,
        clusterColorObject,
        clusters,
        nodeWithNewlyAssignedCluster: undefined,
      },
      async () => {
        await this.dispatch(assignNodesActionCreator(this.state.data.nodes));
        await this.dispatch(
          assignClusterNodesActionCreator(
            this.state.data.nodes.slice(
              this.state.data.nodes.length - this.state.clusters.length
            )
          )
        );
      }
    );
  };

  private clusterMembershipChangeAlgorithm = (
    attributeWeightArray?: number[],
    adjustedWeightedEmbeddings?: number[][],
    algorithmIterations?: number
  ): SharedTypes.Graph.IClusterMembershipChangeAlgorithm | undefined => {
    if (this.state.nodeWithNewlyAssignedCluster == null) {
      return;
    }

    let dataClone: SharedTypes.Graph.IData = _.clone(this.state.data);
    let adjustedEmbeddings: number[][] = _.clone(
      adjustedWeightedEmbeddings != null &&
        !_.isEmpty(adjustedWeightedEmbeddings)
        ? adjustedWeightedEmbeddings
        : this.state.weightedEmbeddings
    );
    let adjustedAttributeWeightArray: number[] =
      attributeWeightArray != null
        ? attributeWeightArray
        : _.clone(this.state.attributeWeightArray);

    const newlyAssignedClusterId: number = this.state
      .nodeWithNewlyAssignedCluster.newClusterId;
    const newlyAssignedNode: SharedTypes.Graph.INode | undefined = _.find(
      dataClone.nodes,
      (node) => node.id === this.state.nodeWithNewlyAssignedCluster!.node.id
    );

    if (newlyAssignedNode == null) {
      return;
    }

    let attributeDistancesFromSourceClusterCentroid: number[] = [];
    let attributeDistancesFromDestinationClusterCentroid: number[] = [];

    const newlyAssignedEmbeddingsRow: number[] = this.state.weightedEmbeddings[
      newlyAssignedNode.index
    ];
    const sourceClusterCentroidEmbeddingsRow: number[] = this.state.clusters[
      newlyAssignedNode.clusterId
    ];
    const destinationClusterCentroidEmbeddingsRow: number[] = this.state
      .clusters[newlyAssignedClusterId];

    // if cluster membership hasn't changed
    if (algorithmIterations) {
      let destinationClusterEmbeddingsEntry: number[] = this.state.clusters[
        this.state.nodeWithNewlyAssignedCluster.newClusterId
      ];

      const weightEmbeddingsEntry = (
        nodeEmbeddingsEntry: number[],
        destinationEmbeddingsEntry: number[],
        weightingDivider: number
      ): number[] => {
        let weightedEmbeddingsEntry: number[] = _.clone(nodeEmbeddingsEntry);

        if (algorithmIterations > 75) {
          return destinationClusterEmbeddingsEntry;
        }

        _.each(weightedEmbeddingsEntry, (movedElem, idx) => {
          const destinationElem: number = destinationEmbeddingsEntry[idx];
          const absoluteDestinationValue: number =
            Math.abs(destinationElem) / weightingDivider;
          if (Math.abs(movedElem) > Math.abs(destinationElem)) {
            if (movedElem < 0) {
              weightedEmbeddingsEntry[idx] += absoluteDestinationValue;
            } else {
              weightedEmbeddingsEntry[idx] -= absoluteDestinationValue;
            }
          } else {
            if (
              (movedElem < 0 && destinationElem > 0) ||
              (movedElem > 0 && destinationElem < 0)
            ) {
              weightedEmbeddingsEntry[idx] -= absoluteDestinationValue;
            } else {
              weightedEmbeddingsEntry[idx] += absoluteDestinationValue;
            }
          }
        });
        return weightedEmbeddingsEntry;
      };

      const movedNodeEmbeddingsEntry: number[] = weightEmbeddingsEntry(
        adjustedEmbeddings[this.state.nodeWithNewlyAssignedCluster.node.index],
        destinationClusterEmbeddingsEntry,
        20
      );

      let adjustedNodeEntries: { [nodeIndex: number]: number[] } = {
        [newlyAssignedNode.index]: movedNodeEmbeddingsEntry,
      };

      const isNodeFromSourceCluster = (
        node: SharedTypes.Graph.INode
      ): boolean =>
        node.clusterId === newlyAssignedNode.clusterId &&
        node.id !== newlyAssignedNode.id;

      if (algorithmIterations < 5) {
        _.each(dataClone.nodes, (node) => {
          let sourceClusterNodeEmbeddingEntry: number[] = [];
          let differentClusterNodeEmbeddingEntry: number[] = [];

          if (isNodeFromSourceCluster(node)) {
            if (node.distances[newlyAssignedNode.id] < 0.25) {
              sourceClusterNodeEmbeddingEntry = weightEmbeddingsEntry(
                adjustedEmbeddings[node.index],
                destinationClusterEmbeddingsEntry,
                50
              );
              adjustedNodeEntries[node.index] = sourceClusterNodeEmbeddingEntry;
            } else if (node.distances[newlyAssignedNode.id] > 0.75) {
              sourceClusterNodeEmbeddingEntry = weightEmbeddingsEntry(
                adjustedEmbeddings[node.index],
                destinationClusterEmbeddingsEntry,
                -50
              );
              adjustedNodeEntries[node.index] = sourceClusterNodeEmbeddingEntry;
            }
          } else if (node.id !== newlyAssignedNode.id) {
            if (node.distances[newlyAssignedNode.id] < 0.25) {
              differentClusterNodeEmbeddingEntry = weightEmbeddingsEntry(
                adjustedEmbeddings[node.index],
                destinationClusterEmbeddingsEntry,
                50
              );
              adjustedNodeEntries[
                node.index
              ] = differentClusterNodeEmbeddingEntry;
            } else if (node.distances[newlyAssignedNode.id] > 0.75) {
              differentClusterNodeEmbeddingEntry = weightEmbeddingsEntry(
                adjustedEmbeddings[node.index],
                destinationClusterEmbeddingsEntry,
                -50
              );
              adjustedNodeEntries[
                node.index
              ] = differentClusterNodeEmbeddingEntry;
            }
          }
        });
      }

      _.each(adjustedNodeEntries, (entry, key) =>
        adjustedEmbeddings.splice(parseInt(key), 1, entry)
      );

      return {
        newlyAssignedNode,
        newlyAssignedClusterId,
        adjustedAttributeWeightArray,
        adjustedEmbeddings,
      };
    }

    if (
      newlyAssignedEmbeddingsRow == null ||
      sourceClusterCentroidEmbeddingsRow == null ||
      destinationClusterCentroidEmbeddingsRow == null
    ) {
      return;
    }

    for (let i: number = 0; i < newlyAssignedEmbeddingsRow.length; i++) {
      attributeDistancesFromSourceClusterCentroid[i] = manhattanDistance(
        newlyAssignedEmbeddingsRow[i],
        sourceClusterCentroidEmbeddingsRow[i]
      );
      attributeDistancesFromDestinationClusterCentroid[i] = manhattanDistance(
        newlyAssignedEmbeddingsRow[i],
        destinationClusterCentroidEmbeddingsRow[i]
      );
    }

    const destinationCentroidAttributeSimilarityArray: {
      value: number;
      index: number;
    }[] = _.map(
      attributeDistancesFromDestinationClusterCentroid,
      (attribute, index) => {
        return {
          value: attribute,
          index,
        };
      }
    );

    const sourceCentroidAttributeSimilarityArray: {
      value: number;
      index: number;
    }[] = _.map(
      attributeDistancesFromSourceClusterCentroid,
      (attribute, index) => {
        return {
          value: attribute,
          index,
        };
      }
    );

    const sortedDestinationCentroidAttributeSimilarityArray = destinationCentroidAttributeSimilarityArray.sort(
      (a, b) => a.value - b.value
    );
    const sortedSourceCentroidAttributeSimilarityArray = sourceCentroidAttributeSimilarityArray.sort(
      (a, b) => a.value - b.value
    );

    _.each(
      sortedSourceCentroidAttributeSimilarityArray,
      (elem, itereeIndex: number) => {
        let adjustedWeightValue: number = 0;
        if (itereeIndex < 100) {
          adjustedWeightValue = (100 - itereeIndex) / 1600;
        } else {
          adjustedWeightValue = -(itereeIndex + 1) / 3200;
        }

        // deminish adjust weight value
        if (adjustedWeightValue < 0) {
          adjustedWeightValue /= 5;
        }

        if (
          adjustedAttributeWeightArray[elem.index] + adjustedWeightValue >
          0
        ) {
          adjustedAttributeWeightArray[elem.index] += adjustedWeightValue;
        } else {
          adjustedAttributeWeightArray[elem.index] = 0.000000000000001;
        }
      }
    );

    _.each(
      sortedDestinationCentroidAttributeSimilarityArray,
      (elem, itereeIndex: number) => {
        let adjustedWeightValue: number = 0;
        if (itereeIndex < 100) {
          adjustedWeightValue = (100 - itereeIndex) / 1600;
        } else {
          adjustedWeightValue = -(itereeIndex + 1) / 3200;
        }

        // deminish adjust weight value
        if (adjustedWeightValue < 0) {
          adjustedWeightValue /= 5;
        }

        if (
          adjustedAttributeWeightArray[elem.index] + adjustedWeightValue >
          0
        ) {
          adjustedAttributeWeightArray[elem.index] += adjustedWeightValue;
        } else {
          adjustedAttributeWeightArray[elem.index] = 0.000000000000001;
        }
      }
    );

    return {
      newlyAssignedNode,
      newlyAssignedClusterId,
      adjustedAttributeWeightArray,
      adjustedEmbeddings,
    };
  };

  private handleNodeClusterMembershipChange = (
    attributeWeightArray?: number[],
    adjustedWeightedEmbeddings?: number[][],
    algorithmIterations?: number
  ): number[][] | undefined => {
    const adjustmentData:
      | SharedTypes.Graph.IClusterMembershipChangeAlgorithm
      | undefined = this.clusterMembershipChangeAlgorithm(
      attributeWeightArray,
      adjustedWeightedEmbeddings,
      algorithmIterations
    );

    if (adjustmentData != null) {
      this.setState({
        renderCounter: 0,
        attributeWeightArray: adjustmentData.adjustedAttributeWeightArray,
        clusterChanged: {
          nodeId: adjustmentData.newlyAssignedNode.id,
          newClusterId: adjustmentData.newlyAssignedClusterId,
        },
        weightedEmbeddings: adjustmentData.adjustedEmbeddings,
      });
    }

    return adjustmentData?.adjustedEmbeddings;
  };

  private getDistanceMatrix = (
    adjustedWeightedEmbeddings: number[][]
  ): number[][] =>
    calculateDistanceMatrix(
      adjustedWeightedEmbeddings,
      euclideanDistance,
      this.state.attributeWeightArray,
      1
    );

  private getDistanceObjectsForNodes = (
    nodes: SharedTypes.Graph.INode[],
    distanceMatrix: number[][]
  ): SharedTypes.Graph.INode[] => {
    let nodesWithNewlyAssignedDistanceObjects: SharedTypes.Graph.INode[] = _.clone(
      nodes
    );
    let nodeIds: number[] = [];

    _.each(nodesWithNewlyAssignedDistanceObjects, (node) => {
      nodeIds.push(node.id);
    });
    _.each(nodesWithNewlyAssignedDistanceObjects, (node, index) => {
      let distanceObj: {
        [nodeId: number]: number;
      } = {};
      _.each(nodeIds, (nodeId, nodeIdIndex) => {
        if (
          nodeId !== node.id &&
          distanceMatrix[index] != null &&
          distanceMatrix[index][nodeIdIndex] != null
        ) {
          distanceObj[nodeId] = distanceMatrix[index][nodeIdIndex];
        }
      });

      nodesWithNewlyAssignedDistanceObjects[index].distances = distanceObj;
    });

    return nodesWithNewlyAssignedDistanceObjects;
  };

  private getClusterObjectInfo = (
    nodes: SharedTypes.Graph.INode[],
    k: number,
    weightedEmbeddings: number[][],
    initClusters: number[][],
    performElbowMethod: boolean,
    nodeClusterMembershipChangeCounter?: number
  ): SharedTypes.Graph.IClusterObjectInfo => {
    const clustersAreAssigned: boolean = !_.isEmpty(this.state.clusters);
    let nodeDiffObject: { [nodeId: number]: SharedTypes.Graph.INode } = {};
    let clusters: number[][] = [];

    let nodeListWithoutClusterNodes: SharedTypes.Graph.INode[] = _.clone(nodes);
    let weightedEmbeddingsWithoutClusterEmbeddings: number[][] = _.clone(
      weightedEmbeddings
    );

    if (
      nodeClusterMembershipChangeCounter === 0 ||
      (!performElbowMethod && k !== this.state.clusters.length)
    ) {
      nodeListWithoutClusterNodes.splice(
        nodeListWithoutClusterNodes.length - this.state.clusters.length,
        this.state.clusters.length
      );
      weightedEmbeddingsWithoutClusterEmbeddings.splice(
        weightedEmbeddingsWithoutClusterEmbeddings.length -
          this.state.clusters.length,
        this.state.clusters.length
      );
    }

    const kMeansData: SharedTypes.Graph.IKMeansClusteringInfo = kMeans(
      nodeListWithoutClusterNodes,
      k,
      this.state.attributeWeightArray,
      weightedEmbeddingsWithoutClusterEmbeddings,
      initClusters,
      performElbowMethod
    );

    if (!clustersAreAssigned && performElbowMethod) {
      this.dispatch(assignKActionCreator(kMeansData.clusters.length));
    }

    _.each(nodeListWithoutClusterNodes, (node) => {
      if (kMeansData.nodeCentroidInfoObjects[node.id] == null) {
        return;
      }
      const { centroid } = kMeansData.nodeCentroidInfoObjects[node.id];
      if (node.clusterId !== centroid) {
        nodeDiffObject[node.id] = node;
      }
      node.clusterId = centroid;
    });
    console.log(nodeDiffObject);
    clusters = kMeansData.clusters;

    if (
      !clustersAreAssigned ||
      (clustersAreAssigned && clusters.length !== this.state.clusters.length) ||
      nodeClusterMembershipChangeCounter === 0
    ) {
      let clusterNodes: SharedTypes.Graph.INode[] = [];
      _.each(clusters, (cluster, clusterIndex) => {
        // @ts-ignore
        const clusterNode: SharedTypes.Graph.INode = {
          id: _.sum(cluster),
          isClusterNode: true,
          index: nodeListWithoutClusterNodes.length + 1 + clusterIndex,
          nodeLabel: `CLUSTER_CENTROID${clusterIndex}`,
          color: KELLY_COLOR_PALETTE[clusterIndex],
          clusterNodeClusterIndex: clusterIndex,
        };
        clusterNodes.push(clusterNode);
        weightedEmbeddingsWithoutClusterEmbeddings.push(cluster);
      });
      nodeListWithoutClusterNodes = [
        ...nodeListWithoutClusterNodes,
        ...clusterNodes,
      ];
    }

    const nodesWithNewlyAssignedClusters: SharedTypes.Graph.INode[] = _.clone(
      nodeListWithoutClusterNodes
    );
    const weightedEmbeddingsIncludingClusterCentroids: number[][] = _.clone(
      weightedEmbeddingsWithoutClusterEmbeddings
    );

    this.graphRef?.current?.d3ReheatSimulation();

    return {
      clusters,
      nodeDiffObject,
      nodesWithNewlyAssignedClusters,
      weightedEmbeddingsIncludingClusterCentroids,
    };
  };

  private getClusterColorObjectInfo = (
    nodes: SharedTypes.Graph.INode[],
    nodeClusters: { [clusterId: number]: number },
    nodeDiffObject: { [nodeId: number]: SharedTypes.Graph.INode }
  ): SharedTypes.Graph.IClusterColorObjectInfo => {
    let nodesWithNewlyAssignedColors: SharedTypes.Graph.INode[] = _.clone(
      nodes
    );
    let clusterColorObject: { [clusterId: number]: string } = {};

    _.each(nodesWithNewlyAssignedColors, (node, index) => {
      const clusterId: number = node.clusterId;
      const clusterIndex: number = Object.values(nodeClusters).indexOf(
        clusterId
      );
      const nodeColor: string = KELLY_COLOR_PALETTE[clusterIndex];
      nodesWithNewlyAssignedColors[index].color = nodeColor;

      if (!(node.clusterId in clusterColorObject)) {
        clusterColorObject[clusterId] = nodeColor;
      }

      if (node.id in nodeDiffObject && !isClusterNode(node)) {
        nodesWithNewlyAssignedColors[index].color = DEFAULT_COLOR;
      }
    });

    return { clusterColorObject, nodesWithNewlyAssignedColors };
  };

  private getNodeClustersStateProperties = (
    nodes: SharedTypes.Graph.INode[]
  ): SharedTypes.Graph.INodeClusterStateProperties => {
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

    _.each(_.keys(clusterNodesCoordinations), (centroid) => {
      const clusterId: number = parseInt(centroid);
      if (clusterNodesCoordinations[clusterId] == null) {
        return;
      }
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
      clusterConvexHullCoordinations,
    });
    return clusterConvexHullCoordinations;
  };

  private getPairwiseClusterDistance = (): number => {
    let pairwiseClusterDistance: number = FORCE_LINK_DIFFERENT_CLUSTER_DISTANCE;
    if (
      this.props.store.pairwiseClusterDistance ===
      PAIRWISE_CLUSTER_DISTANCE.Closer
    ) {
      pairwiseClusterDistance = FORCE_LINK_DIFFERENT_CLUSTER_DISTANCE_CLOSER_DISTANCE;
    } else if (
      this.props.store.pairwiseClusterDistance ===
      PAIRWISE_CLUSTER_DISTANCE.Farther
    ) {
      pairwiseClusterDistance = FORCE_LINK_DIFFERENT_CLUSTER_DISTANCE_FARTHER_DISTANCE;
    }
    return pairwiseClusterDistance;
  };

  private getClusterCompactnessValue = (): number => {
    let clusterCompactnessValue: number = FORCE_LINK_SAME_CLUSTER_DISTANCE;
    if (
      this.props.store.clusterCompactness === CLUSTER_COMPACTNESS.LessCompact
    ) {
      clusterCompactnessValue = FORCE_LINK_SAME_CLUSTER_DISTANCE_LESS_COMPACT;
    } else if (
      this.props.store.clusterCompactness === CLUSTER_COMPACTNESS.MoreCompact
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
      !this.props.store.dynamicGraph &&
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
      if (!this.props.store.dynamicGraph) {
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
      if (newConvexHulls && !this.props.store.dynamicGraph) {
        this.graphRef.current?.zoomToFit(
          ZOOM_TO_FIT_DURATION,
          ZOOM_TO_FIT_PADDING
        );
      }
    });
  };

  private getAttributeWeightTable = (sortedTable: boolean): JSX.Element[] => {
    let tableContent: { [key: number]: number }[] = [];
    _.each(
      this.state.attributeWeightArray,
      (attribute: number, key: number) => {
        tableContent.push({ [key]: attribute });
      }
    );

    if (sortedTable) {
      tableContent = tableContent.sort((a, b) => {
        const weightDiff: number = _.values(b)[0] - _.values(a)[0];
        if (weightDiff === 0) {
          return parseInt(_.keys(a)[0]) - parseInt(_.keys(b)[0]);
        }
        return weightDiff;
      });
    }

    return _.map(tableContent, (content: { [key: number]: number }) => {
      return (
        <tr key={_.keys(content)[0]}>
          <td>{_.keys(content)[0]}</td>
          <td>{_.values(content)[0]}</td>
        </tr>
      );
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
              if (linkObject.color != null) {
                return linkObject.color;
              }

              if (isClusterNode(linkObject.source)) {
                return KELLY_COLOR_PALETTE[
                  linkObject.source.clusterNodeClusterIndex!
                ];
              }
              return getColorAccordingToPairwiseDistance(
                linkObject.pairwiseDistance
              );
            }}
            onNodeDragEnd={(node) => {
              const graphNode: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
              if (isClusterNode(graphNode)) {
                return;
              }
              this.assignNewlyAssignedClusterToNode(graphNode);
            }}
            nodeVisibility={(node) => {
              const graphNode: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
              if (isClusterNode(graphNode)) {
                return this.props.store.showClusterCentroids;
              }
              return true;
            }}
            linkVisibility={(link) => {
              const linkObject: SharedTypes.Graph.ILink = link as SharedTypes.Graph.ILink;
              if (isClusterNode(linkObject.source)) {
                return (
                  this.props.store.showClusterCentroids &&
                  this.props.store.showEdges
                );
              }
              return this.props.store.showEdges;
            }}
            warmupTicks={
              this.props.store.dynamicGraph
                ? undefined
                : FORCE_GRAPH_WARM_UP_TICKS
            }
            cooldownTicks={this.props.store.dynamicGraph ? Infinity : 0}
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
              if (isClusterNode(graphNode)) {
                ctx.fillStyle =
                  KELLY_COLOR_PALETTE[graphNode.clusterNodeClusterIndex!];
              } else {
                ctx.fillStyle = graphNode.color;
              }
              ctx.fillText(label, graphNode.x, graphNode.y + 15);

              graphNode.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
            }}
            nodePointerAreaPaint={(node, color, ctx) => {
              const graphNode: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
              if (isClusterNode(graphNode)) {
                ctx.fillStyle =
                  KELLY_COLOR_PALETTE[graphNode.clusterNodeClusterIndex!];
              } else {
                ctx.fillStyle = color;
              }
              const bckgDimensions: number[] = graphNode.__bckgDimensions;
              bckgDimensions &&
                ctx.fillRect(
                  graphNode.x - bckgDimensions[0] / 2,
                  graphNode.y - bckgDimensions[1] / 2,
                  bckgDimensions[0],
                  bckgDimensions[1] + 15
                );
            }}
            nodeRelSize={7}
            onNodeClick={async (node: NodeObject) => {
              const graphNode: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
              if (isClusterNode(graphNode)) {
                return;
              }
              if (!this.props.store.nodeDrawerOpen) {
                await this.dispatch(toggleNodeDrawerActionCreator());
                await this.dispatch(
                  assignNodeDrawerContentActionCreator(graphNode)
                );
              } else {
                this.dispatch(assignNodeDrawerContentActionCreator(graphNode));
              }
            }}
            onBackgroundClick={() => {
              if (this.props.store.nodeDrawerOpen) {
                this.dispatch(toggleNodeDrawerActionCreator());
              }
            }}
          />
        )}

        <Dialog
          isOpen={this.props.store.attributeWeightDialogOpen}
          title={"Attribute Weight"}
          onClose={() =>
            this.dispatch(toggleAttributeWeightDialogActionCreator())
          }
        >
          <div
            style={{
              margin: "5px 0",
              maxHeight: 400,
              overflowY: "scroll",
              display: "flex",
              justifySelf: "center",
            }}
          >
            <table
              className="bp3-html-table bp3-html-table-condensed bp3-html-table-bordered"
              style={{ width: "-webkit-fill-available" }}
            >
              <thead>
                <tr>
                  <th>{"Key"}</th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      this.setState({ sortedTable: !this.state.sortedTable })
                    }
                  >
                    {"Weight"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {this.getAttributeWeightTable(this.state.sortedTable)}
              </tbody>
            </table>
          </div>
        </Dialog>
      </>
    );
  }
}

export default Graph;
