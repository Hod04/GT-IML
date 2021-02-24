import React from "react";
import Graph from "./components/Graph";
import NodeDrawer from "./components/NodeDrawer";
import { SharedTypes } from "./shared/sharedTypes";

class App extends React.Component<{}, SharedTypes.App.IAppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      nodeDrawerOpen: false,
      nodeDrawerContent: { author: "", publishedAt: "", text: "" },
    };
  }

  private toggleNodeDrawer = () =>
    this.setState({ nodeDrawerOpen: !this.state.nodeDrawerOpen });

  private assignNodeDrawerContent = (nodeObject: SharedTypes.Graph.INode) => {
    this.setState({
      nodeDrawerContent: {
        author: nodeObject.author || "John Doe",
        text: nodeObject.text,
        publishedAt: nodeObject.publishedAt || "Lorem ipsum",
      },
    });
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
