import { NodeObject } from "react-force-graph-2d";

export namespace SharedTypes {
  export namespace Graph {
    export interface IGraphProps {
      toggleNodeDrawer: () => void;
      isNodeDrawerOpen: boolean;
      assignNodeDrawerContent: (node: NodeObject) => void;
    }

    export interface IGraphState {
      data: IData;
      nodeGroups: { [group: number]: number };
      groupConvexHullCoordinations: IGroupConvexHullCoordinations;
    }

    export interface IData {
      nodes: INode[];
      links: ILink[];
    }

    export interface INode {
      id: string;
      group: number;
      x: number;
      y: number;
      color: string;
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
      distance: Function;
      (alpha: number): void;
      initialize?: (nodes: NodeObject[]) => void;
    }
  }

  export namespace NodeDrawer {
    export interface INodeDrawerProps {
      isOpen: boolean;
      toggleNodeDrawer: () => void;
      content: string | number;
    }

    export interface INodeDrawerState {}
  }
}
