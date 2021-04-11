import {
  CLUSTER_COMPACTNESS,
  IActionType,
  PAIRWISE_CLUSTER_DISTANCE,
} from "../helpers/constants";
import { SharedTypes } from "../shared/sharedTypes";

export const assignNodes = (
  nodes: SharedTypes.Graph.INode[]
): SharedTypes.App.IAssignNodesAction => {
  return {
    type: IActionType.ASSIGN_NODES,
    payload: nodes,
  };
};

export const assignClusterNodes = (
  nodes: SharedTypes.Graph.INode[]
): SharedTypes.App.IAssignClusterNodesAction => {
  return {
    type: IActionType.ASSIGN_CLUSTER_NODES,
    payload: nodes,
  };
};

export const assignK = (k: number): SharedTypes.App.IAssignKAction => {
  return {
    type: IActionType.ASSIGN_K,
    payload: k,
  };
};

export const assignNodeDrawerContent = (
  node: SharedTypes.Graph.INode
): SharedTypes.App.IAssignNodeDrawerContentAction => {
  return {
    type: IActionType.ASSIGN_NODE_DRAWER_CONTENT,
    payload: node,
  };
};

export const assignClusterCompactness = (
  compactness: CLUSTER_COMPACTNESS
): SharedTypes.App.IAssignClusterCompactnessAction => {
  return {
    type: IActionType.ASSIGN_CLUSTER_COMPACTNESS,
    payload: compactness,
  };
};

export const assignPairwiseClusterDistance = (
  pairwiseClusterDistance: PAIRWISE_CLUSTER_DISTANCE
): SharedTypes.App.IAssignPairwiseClusterDistanceAction => {
  return {
    type: IActionType.ASSIGN_PAIRWISE_CLUSTER_DISTANCE,
    payload: pairwiseClusterDistance,
  };
};

export const toggleNodeDrawer = (): SharedTypes.App.IToggleNodeDrawerAction => {
  return {
    type: IActionType.TOGGLE_NODE_DRAWER,
    payload: null,
  };
};

export const toggleShowEdges = (): SharedTypes.App.IToggleShowEdgesAction => {
  return {
    type: IActionType.TOGGLE_SHOW_EDGES,
    payload: null,
  };
};

export const toggleShowClusterCentroids = (): SharedTypes.App.IToggleShowClusterCentroidsAction => {
  return {
    type: IActionType.TOGGLE_SHOW_CLUSTER_CENTROIDS,
    payload: null,
  };
};

export const toggleAttributeWeightDialog = (): SharedTypes.App.IToggleAttributeWeightDialogAction => {
  return {
    type: IActionType.TOGGLE_ATTRIBUTE_WEIGHT_DIALOG,
    payload: null,
  };
};

export const toggleDynamicGraph = (): SharedTypes.App.IToggleDynamicGraphAction => {
  return {
    type: IActionType.TOGGLE_DYNAMIC_GRAPH,
    payload: null,
  };
};
