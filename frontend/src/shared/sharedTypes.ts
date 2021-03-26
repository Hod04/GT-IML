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
      nodes: Graph.INode[];
      clusterCompactness: CLUSTER_COMPACTNESS;
      pairwiseClusterDistance: PAIRWISE_CLUSTER_DISTANCE;
      k: number;
    }
  }

  export namespace Graph {
    export interface IGraphProps {
      assignNodes: (nodes: INode[]) => void;
      toggleNodeDrawer: () => void;
      isNodeDrawerOpen: boolean;
      assignNodeDrawerContent: (node: INode) => void;
      dynamicGraph: boolean;
      showEdges: boolean;
      clusterCompactness: CLUSTER_COMPACTNESS;
      pairwiseClusterDistance: PAIRWISE_CLUSTER_DISTANCE;
      k: number;
    }

    export interface IGraphState {
      data: IData;
      attributeWeightArray: number[];

      nodeClusters: { [clusterId: number]: number };
      numberOfNodesInCluster: { [clusterId: number]: number };
      clusterConvexHullCoordinations: IClusterConvexHullCoordinations;
      clusterColorObject: { [clusterId: number]: string };

      nodeWithNewlyAssignedCluster?: { node: INode; newClusterId: number };

      distanceRange: { min: number; max: number };
      distanceMatrix: number[][];

      renderCounter: number;
    }

    export interface IData {
      nodes: INode[];
      links: ILink[];
    }

    export interface INode {
      id: number;
      distances: { [nodeId: number]: number };
      distanceFromClusterMedoid: number;
      medoidNodeIndex: number;
      nodeLabel: string;
      text: string;
      clusterId: number;
      author: string;
      publishedAt: string;
      color: string;
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
  }

  export namespace NodeDrawer {
    export interface INodeDrawerProps {
      isOpen: boolean;
      toggleNodeDrawer: () => void;
      content: INodeDrawerContent;
      nodes: Graph.INode[];
    }

    export interface INodeDrawerState {
      nodeInfo: INodeInfo;
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
      dynamicGraph: boolean;
      showEdges: boolean;
      k: number;
      toggleDynamicGraph: () => void;
      toggleShowEdges: () => void;
      assignClusterCompactness: (
        clusterCompactness: CLUSTER_COMPACTNESS
      ) => void;
      assignPairwiseClusterDistance: (
        pairwiseClusterDistance: PAIRWISE_CLUSTER_DISTANCE
      ) => void;
      assignK: (k: number) => void;
    }
  }
}
