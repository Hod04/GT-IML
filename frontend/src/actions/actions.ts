import {
  CLUSTER_COMPACTNESS,
  IActionType,
  PAIRWISE_CLUSTER_DISTANCE,
} from "../helpers/constants";
import { SharedTypes } from "../shared/sharedTypes";

export const assignNodesActionCreator = (
  nodes: SharedTypes.Graph.INode[]
): SharedTypes.App.IAssignNodesAction => {
  return {
    type: IActionType.ASSIGN_NODES,
    payload: nodes,
  };
};

export const assignClusterNodesActionCreator = (
  nodes: SharedTypes.Graph.INode[]
): SharedTypes.App.IAssignClusterNodesAction => {
  return {
    type: IActionType.ASSIGN_CLUSTER_NODES,
    payload: nodes,
  };
};

export const assignKActionCreator = (
  k: number
): SharedTypes.App.IAssignKAction => {
  return {
    type: IActionType.ASSIGN_K,
    payload: k,
  };
};

export const assignNodeDrawerContentActionCreator = (
  node: SharedTypes.Graph.INode
): SharedTypes.App.IAssignNodeDrawerContentAction => {
  return {
    type: IActionType.ASSIGN_NODE_DRAWER_CONTENT,
    payload: node,
  };
};

export const assignClusterCompactnessActionCreator = (
  compactness: CLUSTER_COMPACTNESS
): SharedTypes.App.IAssignClusterCompactnessAction => {
  return {
    type: IActionType.ASSIGN_CLUSTER_COMPACTNESS,
    payload: compactness,
  };
};

export const assignPairwiseClusterDistanceActionCreator = (
  pairwiseClusterDistance: PAIRWISE_CLUSTER_DISTANCE
): SharedTypes.App.IAssignPairwiseClusterDistanceAction => {
  return {
    type: IActionType.ASSIGN_PAIRWISE_CLUSTER_DISTANCE,
    payload: pairwiseClusterDistance,
  };
};

export const toggleNodeDrawerActionCreator = (): SharedTypes.App.IToggleNodeDrawerAction => {
  return {
    type: IActionType.TOGGLE_NODE_DRAWER,
    payload: null,
  };
};

export const toggleShowEdgesActionCreator = (): SharedTypes.App.IToggleShowEdgesAction => {
  return {
    type: IActionType.TOGGLE_SHOW_EDGES,
    payload: null,
  };
};

export const toggleShowClusterCentroidsActionCreator = (): SharedTypes.App.IToggleShowClusterCentroidsAction => {
  return {
    type: IActionType.TOGGLE_SHOW_CLUSTER_CENTROIDS,
    payload: null,
  };
};

export const toggleAttributeWeightDialogActionCreator = (): SharedTypes.App.IToggleAttributeWeightDialogAction => {
  return {
    type: IActionType.TOGGLE_ATTRIBUTE_WEIGHT_DIALOG,
    payload: null,
  };
};

export const toggleDynamicGraphActionCreator = (): SharedTypes.App.IToggleDynamicGraphAction => {
  return {
    type: IActionType.TOGGLE_DYNAMIC_GRAPH,
    payload: null,
  };
};

export const assignClusterLabelActionCreator = (
  cluster: number,
  label: string
): SharedTypes.App.IAssignClusterLabelAction => {
  return {
    type: IActionType.ASSIGN_CLUSTER_LABEL,
    payload: { cluster, label },
  };
};
