import { NodeObject } from "react-force-graph-2d";

export namespace SharedTypes {
  export namespace App {
    export interface IAppState {
      nodeDrawerOpen: boolean;
      nodeDrawerContent: NodeDrawer.INodeDrawerContent;
    }
  }

  export namespace Graph {
    export interface IGraphProps {
      toggleNodeDrawer: () => void;
      isNodeDrawerOpen: boolean;
      assignNodeDrawerContent: (node: INode) => void;
    }

    export interface IGraphState {
      renderCounter: number;
      data: IData;
      nodeGroups: { [group: number]: number };
      groupConvexHullCoordinations: IGroupConvexHullCoordinations;
      nodeWithNewlyAssignedCluster?: { node: INode; newGroupKey: number };
    }

    export interface IData {
      nodes: INode[];
      links: ILink[];
    }

    export interface INode {
      nodeLabel: string;
      text: string;
      group: number;
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
      value: number;
    }

    export interface IGroupConvexHullCoordinations {
      [group: number]: number[][];
    }

    export interface IGroupNodeCoordinations {
      [group: number]: {
        x: number[];
        y: number[];
      };
    }

    export interface IForceFn {
      distanceMax: Function;
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
    }

    export interface INodeDrawerContent {
      author: string;
      publishedAt?: string;
      text: string;
    }
  }
}
