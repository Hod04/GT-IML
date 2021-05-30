import { NodeObject } from "react-force-graph-2d";
import {
  CLUSTER_COMPACTNESS,
  PAIRWISE_CLUSTER_DISTANCE,
} from "../helpers/constants";

export namespace SharedTypes {
  export namespace App {
    export interface IAppState {
      nodeDrawerOpen: boolean;
      nodeDrawerContent: NodeDrawer.INodeDrawerContent;
      dynamicGraph: boolean;
      showEdges: boolean;
      showClusterCentroids: boolean;
      nodes: Graph.INode[];
      clusterNodes: Graph.INode[];
      clusterCompactness: CLUSTER_COMPACTNESS;
      pairwiseClusterDistance: PAIRWISE_CLUSTER_DISTANCE;
      k: number;
      attributeWeightDialogOpen: boolean;
      clusterLabels: { [cluster: number]: string };
    }

    export type IAction =
      | IAssignNodesAction
      | IAssignClusterNodesAction
      | IAssignKAction
      | IAssignNodeDrawerContentAction
      | IAssignClusterCompactnessAction
      | IAssignPairwiseClusterDistanceAction
      | IToggleNodeDrawerAction
      | IToggleShowEdgesAction
      | IToggleShowClusterCentroidsAction
      | IToggleAttributeWeightDialogAction
      | IToggleDynamicGraphAction
      | IAssignClusterLabelAction;

    export interface IAssignNodesAction {
      type: number;
      payload: Graph.INode[];
    }

    export interface IAssignClusterNodesAction {
      type: number;
      payload: Graph.INode[];
    }

    export interface IAssignKAction {
      type: number;
      payload: number;
    }

    export interface IAssignNodeDrawerContentAction {
      type: number;
      payload: Graph.INode;
    }

    export interface IAssignClusterCompactnessAction {
      type: number;
      payload: CLUSTER_COMPACTNESS;
    }

    export interface IAssignPairwiseClusterDistanceAction {
      type: number;
      payload: PAIRWISE_CLUSTER_DISTANCE;
    }

    export interface IToggleNodeDrawerAction {
      type: number;
      payload: null;
    }

    export interface IToggleShowEdgesAction {
      type: number;
      payload: null;
    }

    export interface IToggleShowClusterCentroidsAction {
      type: number;
      payload: null;
    }

    export interface IToggleAttributeWeightDialogAction {
      type: number;
      payload: null;
    }

    export interface IToggleDynamicGraphAction {
      type: number;
      payload: null;
    }

    export interface IAssignClusterLabelAction {
      type: number;
      payload: {
        cluster: number;
        label: string;
      };
    }
  }

  export namespace Graph {
    export interface IGraphProps {
      store: App.IAppState;
      reducer: (state: App.IAppState, action: App.IAction) => void;
    }

    export interface IGraphState {
      data: IData;
      attributeWeightArray: number[];
      weightedEmbeddings: number[][];

      clusters: number[][];
      nodeClusters: { [clusterId: number]: number };
      numberOfNodesInCluster: { [clusterId: number]: number };
      clusterConvexHullCoordinations: IClusterConvexHullCoordinations;
      clusterColorObject: { [clusterId: number]: string };

      nodeWithNewlyAssignedCluster?: { node: INode; newClusterId: number };
      clusterChanged?: { nodeId: number; newClusterId: number };

      distanceRange: { min: number; max: number };
      distanceMatrix: number[][];

      renderCounter: number;
      sortedTable: boolean;
    }

    export interface IData {
      nodes: INode[];
      links: ILink[];
    }

    export interface INode {
      id: number;
      distances: { [nodeId: number]: number };
      centroidNodeIndex: number;
      nodeLabel: string;
      text: string;
      clusterId: number;
      author: string;
      publishedAt: string;
      color: string;
      clusterNodeClusterIndex?: number;
      isClusterNode?: boolean;
      index: number;
      fx: number;
      fy: number;
      x: number;
      y: number;
      __bckgDimensions: number[];
    }

    export interface ILink {
      source: INode;
      target: INode;
      pairwiseDistance: number;
      color?: string;
    }

    export interface IClusterConvexHullCoordinations {
      [clusterId: number]: number[][];
    }

    export interface IClusterNodeCoordinations {
      [clusterId: number]: {
        x: number[];
        y: number[];
      };
    }

    export interface IForceFn {
      distanceMax: Function;
      strength: Function;
      distance: Function;
      (alpha: number): void;
      initialize?: (nodes: NodeObject[]) => void;
    }

    export interface IClusterObjectInfo {
      clusters: number[][];
      nodeDiffObject: { [nodeId: number]: INode };
      nodesWithNewlyAssignedClusters: INode[];
      weightedEmbeddingsIncludingClusterCentroids: number[][];
    }

    export interface INodeClusterStateProperties {
      nodeClusters: { [clusterId: number]: number };
      numberOfNodesInCluster: { [clusterId: number]: number };
    }

    export interface IClusterColorObjectInfo {
      clusterColorObject: { [clusterId: number]: string };
      nodesWithNewlyAssignedColors: INode[];
    }

    export interface IClusterMembershipChangeAlgorithm {
      newlyAssignedNode: Graph.INode;
      newlyAssignedClusterId: number;
      adjustedAttributeWeightArray: number[];
      adjustedEmbeddings: number[][];
    }

    export interface IKMeansClusteringInfo {
      nodeCentroidInfoObjects: {
        [nodeId: number]: {
          centroid: number;
        };
      };
      clusters: number[][];
    }
  }

  export namespace NodeDrawer {
    export interface INodeDrawerProps {
      store: App.IAppState;
      reducer: (state: App.IAppState, action: App.IAction) => void;
      nodes: Graph.INode[];
    }

    export interface INodeInfo {
      [nodeId: number]: { text: string; author: string; color: string };
    }

    export interface INodeDrawerContent {
      author: string;
      publishedAt: string;
      distances: { [nodeId: number]: number };
      text: string;
      color: string;
    }
  }

  export namespace NavBar {
    export interface INavBarProps {
      store: App.IAppState;
      reducer: (state: App.IAppState, action: App.IAction) => void;
    }
  }
}
