import _ from "lodash";
import React from "react";
import Graph from "./components/Graph";
import NavBar from "./components/NavBar";
import NodeDrawer from "./components/NodeDrawer";
import {
  CLUSTER_COMPACTNESS,
  IActionType,
  PAIRWISE_CLUSTER_DISTANCE,
} from "./helpers/constants";
import { SharedTypes } from "./shared/sharedTypes";

class App extends React.Component<{}, SharedTypes.App.IAppState> {
  constructor(props: {}) {
    super(props);
    let clusterLabels: { [cluster: number]: string } = {};
    _.forEach(new Array(15), (val, index) => {
      clusterLabels[index] = `Cluster ${index}`;
    });
    this.state = {
      nodes: [],
      clusterNodes: [],
      nodeDrawerOpen: false,
      nodeDrawerContent: {
        author: "",
        publishedAt: "",
        text: "",
        color: "",
        distances: {},
      },
      dynamicGraph: true,
      showEdges: false,
      showClusterCentroids: false,
      clusterCompactness: CLUSTER_COMPACTNESS.ClusterCompactness,
      pairwiseClusterDistance:
        PAIRWISE_CLUSTER_DISTANCE.PairwisseClusterDistance,
      k: 8,
      attributeWeightDialogOpen: false,
      clusterLabels,
    };
  }

  private reducer = (
    state: SharedTypes.App.IAppState,
    action: SharedTypes.App.IAction
  ) =>
    this.setState(() => {
      switch (action.type) {
        case IActionType.ASSIGN_NODES:
          const assignNodesAction: SharedTypes.App.IAssignNodesAction = action as SharedTypes.App.IAssignNodesAction;
          return { ...state, nodes: assignNodesAction.payload };

        case IActionType.ASSIGN_CLUSTER_NODES:
          const assignClusterNodesAction: SharedTypes.App.IAssignClusterNodesAction = action as SharedTypes.App.IAssignClusterNodesAction;
          return { ...state, clusterNodes: assignClusterNodesAction.payload };

        case IActionType.ASSIGN_K:
          const assignKAction: SharedTypes.App.IAssignKAction = action as SharedTypes.App.IAssignKAction;
          return { ...state, k: assignKAction.payload };

        case IActionType.ASSIGN_NODE_DRAWER_CONTENT:
          const assignNodeDrawerContentAction: SharedTypes.App.IAssignNodeDrawerContentAction = action as SharedTypes.App.IAssignNodeDrawerContentAction;
          return {
            ...state,
            nodeDrawerContent: assignNodeDrawerContentAction.payload,
          };

        case IActionType.ASSIGN_CLUSTER_COMPACTNESS:
          const assignClusterCompactnessAction: SharedTypes.App.IAssignClusterCompactnessAction = action as SharedTypes.App.IAssignClusterCompactnessAction;
          return {
            ...state,
            clusterCompactness: assignClusterCompactnessAction.payload,
          };

        case IActionType.ASSIGN_PAIRWISE_CLUSTER_DISTANCE:
          const assignPairwiseClusterDistanceAction: SharedTypes.App.IAssignPairwiseClusterDistanceAction = action as SharedTypes.App.IAssignPairwiseClusterDistanceAction;
          return {
            ...state,
            pairwiseClusterDistance:
              assignPairwiseClusterDistanceAction.payload,
          };

        case IActionType.TOGGLE_NODE_DRAWER:
          return { ...state, nodeDrawerOpen: !state.nodeDrawerOpen };

        case IActionType.TOGGLE_SHOW_EDGES:
          return { ...state, showEdges: !state.showEdges };

        case IActionType.TOGGLE_SHOW_CLUSTER_CENTROIDS:
          return {
            ...state,
            showClusterCentroids: !state.showClusterCentroids,
          };

        case IActionType.TOGGLE_ATTRIBUTE_WEIGHT_DIALOG:
          return {
            ...state,
            attributeWeightDialogOpen: !state.attributeWeightDialogOpen,
          };

        case IActionType.TOGGLE_DYNAMIC_GRAPH:
          return {
            ...state,
            dynamicGraph: !state.dynamicGraph,
          };

        case IActionType.ASSIGN_CLUSTER_LABEL:
          const assignClusterLabelAction: SharedTypes.App.IAssignClusterLabelAction = action as SharedTypes.App.IAssignClusterLabelAction;
          const clusterLabelsClone: { [cluster: number]: string } = _.clone(
            state.clusterLabels
          );
          clusterLabelsClone[assignClusterLabelAction.payload.cluster] =
            assignClusterLabelAction.payload.label;
          return {
            ...state,
            clusterLabels: clusterLabelsClone,
          };

        default:
          return state;
      }
    });

  render() {
    return (
      <>
        <NavBar store={this.state} reducer={this.reducer} />
        <Graph store={this.state} reducer={this.reducer} />
        {!_.isEmpty(this.state.nodes) && (
          <NodeDrawer
            store={this.state}
            reducer={this.reducer}
            nodes={this.state.nodes.slice(
              0,
              this.state.nodes.length - this.state.clusterNodes.length
            )}
          />
        )}
      </>
    );
  }
}

export default App;
