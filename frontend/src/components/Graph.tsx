import React from "react";
import ForceGraph, { NodeObject } from "react-force-graph-2d";
import { convexHull } from "../helpers/grahamScan";

interface IGraphProps {
  toggleNodeDrawer: () => void;
  isNodeDrawerOpen: boolean;
  assignNodeDrawerContent: (node: NodeObject) => void;
}

interface IGraphState {
  data: IData;
  groupNodesCoordinations: {
    [group: number]: {
      x: number[];
      y: number[];
    };
  };
  nodeGroups: { [group: number]: number };
  groupMeanCoordinations: {
    [group: number]: {
      x: number;
      y: number;
    };
  };
}

interface IData {
  nodes: INode[];
  links: ILink[];
}

interface INode {
  id: string;
  group: number;
  x: number;
  y: number;
  color: string;
}

interface ILink {
  source: string;
  target: string;
  value: number;
}

class Graph extends React.Component<IGraphProps, IGraphState> {
  constructor(props: IGraphProps) {
    super(props);
    this.state = {
      data: {} as IData,
      nodeGroups: {},
      groupNodesCoordinations: {},
      groupMeanCoordinations: {},
    };
  }

  public async componentDidMount(): Promise<void> {
    const mockdata: Response = await fetch("data/mockdata.json");
    const data: IData = await mockdata.json();
    data.nodes.forEach((node) => {
      if (!(node.group in this.state.nodeGroups)) {
        this.setState({
          nodeGroups: { ...this.state.nodeGroups, [node.group]: node.group },
        });
      }
    });
    this.setState({ data });
  }

  private assignGroupConvexHullCoordinations = () => {
    const { nodes } = this.state.data;

    let groupNodesCoordinations: {
      [group: number]: {
        x: number[];
        y: number[];
      };
    } = {};

    nodes.forEach((node) => {
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

    let groupConvexHullCoordinations: {
      [group: number]: number[][];
    } = {};
    Object.keys(groupNodesCoordinations).forEach((group) => {
      const groupKey: number = parseInt(group);
      let x: number[] = groupNodesCoordinations[groupKey].x;
      let y: number[] = groupNodesCoordinations[groupKey].y;
      const s: number[][] = x.map((xElem, index) => [xElem, y[index]]);

      groupConvexHullCoordinations[groupKey] = convexHull(s);
    });
    return groupConvexHullCoordinations;
  };

  render() {
    return (
      <>
        {Object.keys(this.state.data).length > 0 && (
          <ForceGraph
            graphData={this.state.data}
            nodeAutoColorBy={"group"}
            onNodeDragEnd={(node) => {
              node.fx = node.x;
              node.fy = node.y;
            }}
            linkVisibility={false}
            onRenderFramePre={(ctx) => {
              const groupConvexHullCoordinations = this.assignGroupConvexHullCoordinations();
              Object.values(this.state.nodeGroups).forEach((nodeGroup) => {
                if (
                  groupConvexHullCoordinations != null &&
                  groupConvexHullCoordinations[nodeGroup] != null &&
                  groupConvexHullCoordinations[nodeGroup].length > 0
                ) {
                  const groupNodeRepresentative:
                    | INode
                    | undefined = this.state.data.nodes.find(
                    (node) => node.group === nodeGroup
                  );
                  let color: string = "#444";
                  if (
                    groupNodeRepresentative != null &&
                    groupNodeRepresentative
                  ) {
                    color = groupNodeRepresentative.color;
                  }
                  ctx.strokeStyle = color;
                  ctx.beginPath();
                  groupConvexHullCoordinations[nodeGroup].forEach(
                    (group, index) => {
                      if (group == null || group.length < 2) {
                        return;
                      }
                      if (groupConvexHullCoordinations[nodeGroup].length <= 2) {
                        let grp: { x: number[]; y: number[] } = {
                          x: [],
                          y: [],
                        };
                        Object.keys(
                          groupConvexHullCoordinations[nodeGroup]
                        ).forEach((node) => {
                          grp.x = [
                            ...grp.x,
                            groupConvexHullCoordinations[nodeGroup][
                              parseInt(node)
                            ][0],
                          ];
                          grp.y = [
                            ...grp.y,
                            groupConvexHullCoordinations[nodeGroup][
                              parseInt(node)
                            ][1],
                          ];
                        });
                        const sum: { x: number; y: number } = {
                          x: grp.x.reduce((a, b) => a + b, 0),
                          y: grp.y.reduce((a, b) => a + b, 0),
                        };
                        const groupMean = {
                          x: sum.x / grp.x.length || 0,
                          y: sum.y / grp.y.length || 0,
                        };
                        ctx.arc(
                          groupMean.x,
                          groupMean.y,
                          50,
                          0,
                          Math.PI * 2,
                          true
                        ); // Outer circle for <= 2 node cluster
                        return;
                      }

                      ctx.lineTo(group[0], group[1]);
                      if (
                        index ===
                        groupConvexHullCoordinations[nodeGroup].length - 1
                      ) {
                        ctx.lineTo(
                          groupConvexHullCoordinations[nodeGroup][0][0],
                          groupConvexHullCoordinations[nodeGroup][0][1]
                        );
                      }
                    }
                  );
                  ctx.stroke();
                }
              });
            }}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const canvasNode = node as NodeObject & { color: string };
              if (
                canvasNode == null ||
                canvasNode.x == null ||
                canvasNode.y == null ||
                canvasNode.color == null
              ) {
                return;
              }
              const label: string = canvasNode.id as string;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(
                (n) => n + fontSize * 0.2
              ); // some padding

              ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

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
