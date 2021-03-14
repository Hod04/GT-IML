import _ from "lodash";
import React from "react";
import Graph from "./components/Graph";
import NavBar from "./components/NavBar";
import NodeDrawer from "./components/NodeDrawer";
import {
  CLUSTER_COMPACTNESS,
  PAIRWISE_CLUSTER_DISTANCE,
} from "./helpers/constants";
import { SharedTypes } from "./shared/sharedTypes";

class App extends React.Component<{}, SharedTypes.App.IAppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      nodes: [],
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
      clusterCompactness: CLUSTER_COMPACTNESS.ClusterCompactness,
      pairwiseClusterDistance:
        PAIRWISE_CLUSTER_DISTANCE.PairwisseClusterDistance,
      k: 8,
    };
  }

  private assignNodes = (nodes: SharedTypes.Graph.INode[]): void =>
    this.setState({ nodes });

  private toggleNodeDrawer = (): void =>
    this.setState({ nodeDrawerOpen: !this.state.nodeDrawerOpen });

  private toggleDynamicGraph = (): void =>
    this.setState({ dynamicGraph: !this.state.dynamicGraph });

  private toggleShowEdges = (): void =>
    this.setState({ showEdges: !this.state.showEdges });

  private assignClusterCompactness = (
    clusterCompactness: CLUSTER_COMPACTNESS
  ): void => this.setState({ clusterCompactness });

  private assignPairwiseClusterDistance = (
    pairwiseClusterDistance: PAIRWISE_CLUSTER_DISTANCE
  ): void => this.setState({ pairwiseClusterDistance });

  private assignNodeDrawerContent = (
    nodeObject: SharedTypes.Graph.INode
  ): void => {
    this.setState({
      nodeDrawerContent: {
        ...nodeObject,
      },
    });
  };

  private assignK = (k: number): void => this.setState({ k });

  render() {
    return (
      <>
        <NavBar
          dynamicGraph={this.state.dynamicGraph}
          showEdges={this.state.showEdges}
          k={this.state.k}
          toggleDynamicGraph={this.toggleDynamicGraph}
          toggleShowEdges={this.toggleShowEdges}
          assignClusterCompactness={this.assignClusterCompactness}
          assignPairwiseClusterDistance={this.assignPairwiseClusterDistance}
          assignK={this.assignK}
        />
        <Graph
          assignNodes={this.assignNodes}
          isNodeDrawerOpen={this.state.nodeDrawerOpen}
          toggleNodeDrawer={this.toggleNodeDrawer}
          assignNodeDrawerContent={this.assignNodeDrawerContent}
          dynamicGraph={this.state.dynamicGraph}
          showEdges={this.state.showEdges}
          clusterCompactness={this.state.clusterCompactness}
          pairwiseClusterDistance={this.state.pairwiseClusterDistance}
          k={this.state.k}
        />
        {!_.isEmpty(this.state.nodes) && (
          <NodeDrawer
            nodes={this.state.nodes}
            toggleNodeDrawer={this.toggleNodeDrawer}
            isOpen={this.state.nodeDrawerOpen}
            content={this.state.nodeDrawerContent}
          />
        )}
      </>
    );
  }
}

export default App;
