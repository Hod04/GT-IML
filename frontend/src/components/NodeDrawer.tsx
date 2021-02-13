import React from "react";
import { Drawer, Button } from "@blueprintjs/core";

interface INodeDrawerProps {
  isOpen: boolean;
  toggleNodeDrawer: () => void;
  content: string | number;
}

interface INodeDrawerState {}

export default class NodeDrawer extends React.Component<
  INodeDrawerProps,
  INodeDrawerState
> {
  constructor(props: INodeDrawerProps) {
    super(props);
    this.state = {};
  }
  render() {
    return (
      <Drawer
        isOpen={this.props.isOpen}
        onClose={() => this.props.toggleNodeDrawer()}
        canOutsideClickClose={false}
        size={"33%"}
      >
        <Button
          icon={"menu-closed"}
          onClick={() => this.props.toggleNodeDrawer()}
        >
          close
        </Button>
        {this.props.content}
      </Drawer>
    );
  }
}
