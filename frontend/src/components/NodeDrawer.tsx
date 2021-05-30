import React from "react";
import { Drawer, Classes, Divider, Tooltip, Icon } from "@blueprintjs/core";
import { SharedTypes } from "../shared/sharedTypes";
import "../styles/NodeDrawer.css";
import _ from "lodash";
import { getColorAccordingToPairwiseDistance } from "../helpers/nodeDrawerHelpers/nodeDrawersHelpers";
import {
  isClusterNode,
  isClusterNodeById,
} from "../helpers/graphHelpers/graphHelpers";
import { DEFAULT_COLOR } from "../helpers/constants";
import { toggleNodeDrawerActionCreator } from "../actions/actions";

export default class NodeDrawer extends React.PureComponent<
  SharedTypes.NodeDrawer.INodeDrawerProps,
  { sortedClusters: boolean }
> {
  constructor(props: SharedTypes.NodeDrawer.INodeDrawerProps) {
    super(props);
    this.state = { sortedClusters: false };
  }

  private dispatch = async (action: SharedTypes.App.IAction): Promise<void> =>
    await this.props.reducer(this.props.store, action);

  private getPublishedAtSection = (): JSX.Element => (
    <>
      <p>
        <strong>{"Published At"}</strong>
      </p>
      <p>{this.props.store.nodeDrawerContent.publishedAt}</p>
    </>
  );

  private getAuthorNameSection = (): JSX.Element => (
    <>
      <p>
        <strong>{"Author Name"}</strong>
      </p>
      <p>{this.props.store.nodeDrawerContent.author}</p>
    </>
  );

  private getTextSection = (): JSX.Element => (
    <>
      <p>
        <strong>{"Text"}</strong>
      </p>
      <p>{this.props.store.nodeDrawerContent.text}</p>
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
              backgroundColor: getColorAccordingToPairwiseDistance(0.2),
            }}
          >
            {"Distance < 0.25"}
          </div>
          <div
            style={{
              backgroundColor: getColorAccordingToPairwiseDistance(0.4),
            }}
          >
            {"0.25 <= Distance < 0.5"}
          </div>
          <div
            style={{
              backgroundColor: getColorAccordingToPairwiseDistance(0.6),
              color: DEFAULT_COLOR,
            }}
          >
            {"0.5 <= Distance < 0.75"}
          </div>
          <div
            style={{
              backgroundColor: getColorAccordingToPairwiseDistance(0.8),
              color: DEFAULT_COLOR,
            }}
          >
            {"Distance >= 0.75"}
          </div>
        </>
      }
    >
      {"Distance"}
    </Tooltip>
  );

  private getDistancesTableBody = (): JSX.Element => {
    const elements: JSX.Element[] = _.map(
      this.props.store.nodeDrawerContent.distances,
      (distanceValue: number, nodeId: string) => {
        const node: SharedTypes.Graph.INode | undefined = _.find(
          this.props.nodes,
          (node) => node.id === parseInt(nodeId)
        );

        if (
          (node != null && isClusterNode(node)) ||
          isClusterNodeById(parseFloat(nodeId))
        ) {
          return null!;
        }

        const nodeIndex: number = _.indexOf(this.props.nodes, node);

        return (
          <tr
            // key={`${this.props.store.nodeDrawerContent.publishedAt}-${nodeId}`}
            id={
              this.props.store.clusterLabels[
                this.props.nodes[nodeIndex]?.clusterId
              ]
            }
            key={`${
              this.props.store.clusterLabels[
                this.props.nodes[nodeIndex]?.clusterId
              ]
            }-${nodeId}-${this.props.nodes[nodeIndex]?.clusterId}`}
            style={{
              backgroundColor: getColorAccordingToPairwiseDistance(
                distanceValue
              ),
            }}
          >
            <td>
              <div
                style={{
                  backgroundColor: `${this.props.nodes[nodeIndex]?.color}`,
                  width: 55,
                  marginRight: 5,
                  height: 20,
                  fontSize: "smaller",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textAlign: "center",
                }}
              >
                {
                  this.props.store.clusterLabels[
                    this.props.nodes[nodeIndex]?.clusterId
                  ]
                }
              </div>
            </td>
            <td>{distanceValue}</td>
            <td>{this.props.nodes[nodeIndex]?.author}</td>
            <td>{this.props.nodes[nodeIndex]?.text}</td>
          </tr>
        );
      }
    );
    if (this.state.sortedClusters) {
      elements.sort((elemA, elemB) => {
        if (elemA?.props.id == null || elemB?.props.id == null) {
          return 0;
        }
        const idA: string = elemA.props.id as string;
        const idB: string = elemB.props.id as string;
        return idA.localeCompare(idB, "en", { sensitivity: "case" });
      });
    }
    return <>{elements}</>;
  };

  render() {
    return (
      <>
        {!_.isEmpty(this.props.nodes) && (
          <Drawer
            isOpen={this.props.store.nodeDrawerOpen}
            onClose={() => this.dispatch(toggleNodeDrawerActionCreator())}
            canOutsideClickClose={true}
            hasBackdrop={false}
            size={"33%"}
            title={
              <div style={{ display: "flex" }}>
                <div
                  style={{
                    backgroundColor: `${this.props.store.nodeDrawerContent.color}`,
                    width: 5,
                    marginRight: 5,
                  }}
                />
                {"Comment Overview"}
              </div>
            }
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
                      <th style={{ display: "flex", alignItems: "center" }}>
                        {"Cluster"}
                        <Icon
                          style={{ marginLeft: 5, cursor: "pointer" }}
                          onClick={() =>
                            this.setState({
                              sortedClusters: !this.state.sortedClusters,
                            })
                          }
                          icon={"sort"}
                          iconSize={12}
                        />
                      </th>
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
        )}
      </>
    );
  }
}
