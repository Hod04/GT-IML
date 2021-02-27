import React from "react";
import { Drawer, Classes, Divider } from "@blueprintjs/core";
import { SharedTypes } from "../shared/sharedTypes";
import "../styles/NodeDrawer.css";
import _ from "lodash";

export default class NodeDrawer extends React.Component<
  SharedTypes.NodeDrawer.INodeDrawerProps,
  SharedTypes.NodeDrawer.INodeDrawerState
> {
  constructor(props: SharedTypes.NodeDrawer.INodeDrawerProps) {
    super(props);
    this.state = {
      nodeInfo: {},
    };
  }

  public componentDidUpdate(
    prevProps: SharedTypes.NodeDrawer.INodeDrawerProps,
    prevState: SharedTypes.NodeDrawer.INodeDrawerState
  ): void {
    if (_.isEmpty(prevState.nodeInfo)) {
      this.assignNodeInfo();
    }
  }

  private assignNodeInfo = (): void => {
    let nodeInfo: SharedTypes.NodeDrawer.INodeInfo = {} as SharedTypes.NodeDrawer.INodeInfo;
    _.each(
      this.props.nodes,
      (node) => (nodeInfo[node.id] = { text: node.text, author: node.author })
    );
    this.setState({ nodeInfo });
  };

  private getTableEntryBackgroundColor = (distance: number): string => {
    if (distance < 5) {
      return "seagreen";
    } else if (distance < 10) {
      return "steelblue";
    } else if (distance > 15) {
      return "indianred";
    }
    return "white";
  };

  render() {
    return (
      <Drawer
        isOpen={this.props.isOpen}
        onClose={this.props.toggleNodeDrawer}
        canOutsideClickClose={false}
        size={"33%"}
        title={"Comment Overview"}
      >
        <div className={Classes.DRAWER_BODY}>
          <div className={`${Classes.DIALOG_BODY} gt-iml-node-drawer`}>
            <p>
              <strong>{"Published At"}</strong>
            </p>
            <p>{this.props.content.publishedAt}</p>
            <Divider className={"gt-iml-node-drawer-divider"} />
            <p>
              <strong>{"Author Name"}</strong>
            </p>
            <p>{this.props.content.author}</p>
            <Divider className={"gt-iml-node-drawer-divider"} />
            <p>
              <strong>{"Text"}</strong>
            </p>
            <p>{this.props.content.text}</p>
            <Divider className={"gt-iml-node-drawer-divider"} />
            <p>
              <strong>{"Distances"}</strong>
            </p>
            <table className={"bp3-html-table bp3-interactive"}>
              <thead>
                <tr>
                  <th>{"Distance"}</th>
                  <th>{"Author"}</th>
                  <th>{"Text"}</th>
                </tr>
              </thead>
              <tbody>
                {_.map(
                  this.props.content.distances,
                  (distanceValue: number, nodeId: string) => (
                    <tr
                      key={`${this.props.content.publishedAt}-${nodeId}`}
                      style={{
                        backgroundColor: this.getTableEntryBackgroundColor(
                          distanceValue
                        ),
                      }}
                    >
                      <td>{distanceValue}</td>
                      <td>{this.state.nodeInfo[parseInt(nodeId)]?.author}</td>
                      <td>{this.state.nodeInfo[parseInt(nodeId)]?.text}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Drawer>
    );
  }
}
