import React from "react";
import { Drawer, Classes, Divider } from "@blueprintjs/core";
import { SharedTypes } from "../shared/sharedTypes";
import "../styles/NodeDrawer.css";

export default class NodeDrawer extends React.Component<
  SharedTypes.NodeDrawer.INodeDrawerProps,
  SharedTypes.NodeDrawer.INodeDrawerState
> {
  constructor(props: SharedTypes.NodeDrawer.INodeDrawerProps) {
    super(props);
    this.state = {};
  }

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
            <Divider />
            <p>
              <strong>{"Author Name"}</strong>
            </p>
            <Divider />
            <p>
              <strong>{"Text"}</strong>
            </p>
            <p>{this.props.content}</p>
          </div>
        </div>
      </Drawer>
    );
  }
}
