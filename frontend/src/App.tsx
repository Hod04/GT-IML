import React from "react";
import Graph from "./components/Graph";
import NodeDrawer from "./components/NodeDrawer";
import { NodeObject } from "react-force-graph-2d";

interface IAppProps {}

interface IAppState {
  nodeDrawerOpen: boolean;
  nodeDrawerContent: string | number;
}

class App extends React.Component<IAppProps, IAppState> {
  constructor(props: IAppProps) {
    super(props);
    this.state = { nodeDrawerOpen: false, nodeDrawerContent: "" };
  }

  private toggleNodeDrawer = () =>
    this.setState({ nodeDrawerOpen: !this.state.nodeDrawerOpen });

  private assignNodeDrawerContent = (nodeObject: NodeObject) => {
    this.setState({ nodeDrawerContent: nodeObject.id || "" });
  };

  render() {
    return (
      <div className={"App"}>
        <Graph
          isNodeDrawerOpen={this.state.nodeDrawerOpen}
          toggleNodeDrawer={this.toggleNodeDrawer}
          assignNodeDrawerContent={this.assignNodeDrawerContent}
        />
        <NodeDrawer
          toggleNodeDrawer={this.toggleNodeDrawer}
          isOpen={this.state.nodeDrawerOpen}
          content={this.state.nodeDrawerContent}
        />
      </div>
    );
  }
}

export default App;
