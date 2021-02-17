import React from "react";
import * as _ from "lodash";
import ForceGraph, {
  ForceGraphMethods,
  NodeObject,
} from "react-force-graph-2d";
import { convexHull } from "../helpers/grahamScan";
import { SharedTypes } from "../shared/sharedTypes";

class Graph extends React.Component<
  SharedTypes.Graph.IGraphProps,
  SharedTypes.Graph.IGraphState
> {
  constructor(props: SharedTypes.Graph.IGraphProps) {
    super(props);
    this.state = {
      data: {} as SharedTypes.Graph.IData,
      nodeGroups: {},
      groupConvexHullCoordinations: {},
    };
  }

  private graphRef: React.MutableRefObject<
    ForceGraphMethods
  > = React.createRef() as React.MutableRefObject<ForceGraphMethods>;

  public async componentDidMount(): Promise<void> {
    const mockdata: Response = await fetch("data/mockdata.json");
    const data: SharedTypes.Graph.IData = await mockdata.json();
    this.populateNodeGroupsStateProp(data.nodes);
    this.setState({ data });
  }

  private populateNodeGroupsStateProp = (nodes: SharedTypes.Graph.INode[]) =>
    _.each(nodes, (node: SharedTypes.Graph.INode) => {
      if (!(node.group in this.state.nodeGroups)) {
        this.setState({
          nodeGroups: { ...this.state.nodeGroups, [node.group]: node.group },
        });
      }
    });

  private getGroupNodeCoordinations = (nodes: SharedTypes.Graph.INode[]) => {
    let groupNodesCoordinations: SharedTypes.Graph.IGroupNodeCoordinations = {};

    _.each(nodes, (node) => {
      if (node.x == null || node.y == null) {
        return;
      }

      if (!(node.group in groupNodesCoordinations)) {
        groupNodesCoordinations = {
          ...groupNodesCoordinations,
          [node.group]: {
            x: [node.x],
            y: [node.y],
          },
        };
      } else {
        groupNodesCoordinations = {
          ...groupNodesCoordinations,
          [node.group]: {
            x: [...groupNodesCoordinations[node.group].x, node.x],
            y: [...groupNodesCoordinations[node.group].y, node.y],
          },
        };
      }
    });
    return groupNodesCoordinations;
  };

  private getGroupConvexHullCoordinations = () => {
    const { nodes } = this.state.data;
    const groupNodesCoordinations: SharedTypes.Graph.IGroupNodeCoordinations = this.getGroupNodeCoordinations(
      nodes
    );

    let groupConvexHullCoordinations: SharedTypes.Graph.IGroupConvexHullCoordinations = {};

    _.each(_.keys(groupNodesCoordinations), (group) => {
      const groupKey: number = parseInt(group);
      let x: number[] = groupNodesCoordinations[groupKey].x;
      let y: number[] = groupNodesCoordinations[groupKey].y;
      const s: number[][] = x.map((xElem, index) => [xElem, y[index]]);

      groupConvexHullCoordinations[groupKey] = convexHull(s);
    });

    this.setState({ groupConvexHullCoordinations });
    return groupConvexHullCoordinations;
  };

  private increaseDistanceBetweenDifferentClusters(d3Graph: ForceGraphMethods) {
    const forceFn: SharedTypes.Graph.IForceFn | undefined = d3Graph.d3Force(
      "link"
    ) as SharedTypes.Graph.IForceFn;

    if (forceFn != null) {
      forceFn.distance((link: SharedTypes.Graph.ILink) => {
        const src: SharedTypes.Graph.INode = link.source;
        const tgt: SharedTypes.Graph.INode = link.target;
        if (src.group !== tgt.group) {
          return 200;
        } else {
          return 30;
        }
      });
    }
  }

  private getGroupColor = (nodeGroup: number) => {
    const groupNodeRepresentative: SharedTypes.Graph.INode | undefined = _.find(
      this.state.data.nodes,
      (node) => node.group === nodeGroup
    );
    let groupColor: string = "#444";

    if (groupNodeRepresentative != null) {
      groupColor = groupNodeRepresentative.color;
    }
    return groupColor;
  };

  private drawCircleForClustersWithAtMostTwoElements = (
    ctx: CanvasRenderingContext2D,
    groupConvexHullCoordinations: SharedTypes.Graph.IGroupConvexHullCoordinations,
    nodeGroup: number
  ) => {
    let grp: { x: number[]; y: number[] } = {
      x: [],
      y: [],
    };
    _.each(_.keys(groupConvexHullCoordinations[nodeGroup]), (node) => {
      grp.x = [
        ...grp.x,
        groupConvexHullCoordinations[nodeGroup][parseInt(node)][0],
      ];
      grp.y = [
        ...grp.y,
        groupConvexHullCoordinations[nodeGroup][parseInt(node)][1],
      ];
    });
    const sum: { x: number; y: number } = {
      x: _.reduce(grp.x, (a, b) => a + b, 0),
      y: _.reduce(grp.y, (a, b) => a + b, 0),
    };
    const groupMean = {
      x: sum.x / grp.x.length || 0,
      y: sum.y / grp.y.length || 0,
    };
    ctx.arc(groupMean.x, groupMean.y, 50, 0, Math.PI * 2, true);
  };

  private drawClusterHulls = (ctx: CanvasRenderingContext2D) => {
    let groupConvexHullCoordinations: SharedTypes.Graph.IGroupConvexHullCoordinations = {};

    // draw the convex hulls exactly once, when component mounts
    if (
      _.isEqual(
        _.keys(this.state.groupConvexHullCoordinations),
        _.keys(this.state.nodeGroups)
      )
    ) {
      groupConvexHullCoordinations = this.state.groupConvexHullCoordinations;
    } else {
      groupConvexHullCoordinations = this.getGroupConvexHullCoordinations();
    }

    _.each(_.values(this.state.nodeGroups), (nodeGroup) => {
      if (
        groupConvexHullCoordinations != null &&
        groupConvexHullCoordinations[nodeGroup] != null &&
        groupConvexHullCoordinations[nodeGroup].length > 0
      ) {
        ctx.strokeStyle = this.getGroupColor(nodeGroup);
        ctx.beginPath();

        _.each(groupConvexHullCoordinations[nodeGroup], (group, index) => {
          if (group == null || group.length < 2) {
            return;
          }

          if (groupConvexHullCoordinations[nodeGroup].length <= 2) {
            this.drawCircleForClustersWithAtMostTwoElements(
              ctx,
              groupConvexHullCoordinations,
              nodeGroup
            );
            return;
          }

          ctx.lineTo(group[0], group[1]);

          // draw a line from the last to the first element of the cluster
          if (index === groupConvexHullCoordinations[nodeGroup].length - 1) {
            ctx.lineTo(
              groupConvexHullCoordinations[nodeGroup][0][0],
              groupConvexHullCoordinations[nodeGroup][0][1]
            );
          }
        });

        ctx.stroke();
      }
    });
  };

  render() {
    return (
      <>
        {!_.isEmpty(this.state.data) && (
          <ForceGraph
            ref={this.graphRef}
            graphData={this.state.data}
            nodeAutoColorBy={"group"}
            onNodeDragEnd={(node) => {
              node.fx = node.x;
              node.fy = node.y;
            }}
            linkVisibility={false}
            warmupTicks={200}
            cooldownTicks={0}
            onRenderFramePre={(ctx) => {
              if (this.graphRef.current != null) {
                this.increaseDistanceBetweenDifferentClusters(
                  this.graphRef.current
                );
              }
              this.drawClusterHulls(ctx);
            }}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const canvasNode: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
              const label: string = canvasNode.id;
              const fontSize = 12 / globalScale;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = _.map(
                [textWidth, fontSize],
                (n) => n + fontSize * 0.2
              );

              ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.fillRect(
                canvasNode.x - bckgDimensions[0] / 2,
                canvasNode.y - bckgDimensions[1] / 2,
                bckgDimensions[0],
                bckgDimensions[1]
              );
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = canvasNode.color;
              ctx.fillText(label, canvasNode.x, canvasNode.y);
            }}
            onNodeClick={(node: NodeObject) => {
              if (!this.props.isNodeDrawerOpen) {
                this.props.toggleNodeDrawer();
                this.props.assignNodeDrawerContent(node);
              }
            }}
          />
        )}
      </>
    );
  }
}

export default Graph;
