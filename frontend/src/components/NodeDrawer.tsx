import React from "react";
import { Drawer, Classes, Divider, Tooltip } from "@blueprintjs/core";
import { SharedTypes } from "../shared/sharedTypes";
import "../styles/NodeDrawer.css";
import _ from "lodash";
import { getTableEntryBackgroundColor } from "../helpers/nodeDrawerHelpers/nodeDrawersHelpers";

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

  private getPublishedAtSection = (): JSX.Element => (
    <>
      <p>
        <strong>{"Published At"}</strong>
      </p>
      <p>{this.props.content.publishedAt}</p>
    </>
  );

  private getAuthorNameSection = (): JSX.Element => (
    <>
      <p>
        <strong>{"Author Name"}</strong>
      </p>
      <p>{this.props.content.author}</p>
    </>
  );

  private getTextSection = (): JSX.Element => (
    <>
      <p>
        <strong>{"Text"}</strong>
      </p>
      <p>{this.props.content.text}</p>
    </>
  );

  private getPairWiseDistancesSection = (): JSX.Element => (
    <p>
      <strong>{"Pairwise Distances"}</strong>
    </p>
  );

  private getDistancesTableHeaderAndTooltip = (): JSX.Element => (
    <Tooltip
      className={Classes.TOOLTIP_INDICATOR}
      content={
        <>
          <span>{"Distance Color Legend:"}</span>
          <div
            style={{
              backgroundColor: getTableEntryBackgroundColor(2),
            }}
          >
            {"Distance < 5"}
          </div>
          <div
            style={{
              backgroundColor: getTableEntryBackgroundColor(6),
            }}
          >
            {"5 < Distance < 10"}
          </div>
          <div
            style={{
              backgroundColor: getTableEntryBackgroundColor(11),
              color: "black",
            }}
          >
            {"10 < Distance < 15"}
          </div>
          <div
            style={{
              backgroundColor: getTableEntryBackgroundColor(16),
            }}
          >
            {"Distance > 15"}
          </div>
        </>
      }
    >
      {"Distance"}
    </Tooltip>
  );

  private getDistancesTableBody = (): JSX.Element[] =>
    _.map(
      this.props.content.distances,
      (distanceValue: number, nodeId: string) => (
        <tr
          key={`${this.props.content.publishedAt}-${nodeId}`}
          style={{
            backgroundColor: getTableEntryBackgroundColor(distanceValue),
          }}
        >
          <td>{distanceValue}</td>
          <td>{this.state.nodeInfo[parseInt(nodeId)]?.author}</td>
          <td>{this.state.nodeInfo[parseInt(nodeId)]?.text}</td>
        </tr>
      )
    );

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
            {this.getPublishedAtSection()}
            <Divider className={"gt-iml-node-drawer-divider"} />
            {this.getAuthorNameSection()}
            <Divider className={"gt-iml-node-drawer-divider"} />
            {this.getTextSection()}
            <Divider className={"gt-iml-node-drawer-divider"} />
            {this.getPairWiseDistancesSection()}
            <table className={"bp3-html-table bp3-interactive"}>
              <thead>
                <tr>
                  <th>{this.getDistancesTableHeaderAndTooltip()}</th>
                  <th>{"Author"}</th>
                  <th>{"Text"}</th>
                </tr>
              </thead>
              <tbody>{this.getDistancesTableBody()}</tbody>
            </table>
          </div>
        </div>
      </Drawer>
    );
  }
}
