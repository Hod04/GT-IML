import React from "react";
import * as _ from "lodash";
import ForceGraph, {
  ForceGraphMethods,
  NodeObject,
} from "react-force-graph-2d";
import { convexHull } from "../helpers/grahamScan";
import { SharedTypes } from "../shared/sharedTypes";
import { pointInPolygon } from "../helpers/rayCasting";
import { pointInArc } from "../helpers/pointInArc";
import {
  CANVAS_ARC_ANTICLOCKWISE,
  CANVAS_ARC_END_ANGLE,
  CANVAS_ARC_RADIUS,
  CANVAS_ARC_START_ANGLE,
  DEFAULT_NODE_COLOR,
  FORCE_CHARGE_MAX_DISTANCE,
  FORCE_GRAPH_WARM_UP_TICKS,
  FORCE_LINK_DIFFERENT_GROUP_DISTANCE,
  FORCE_LINK_SAME_GROUP_DISTANCE,
  ZOOM_TO_FIT_DURATION,
  ZOOM_TO_FIT_PADDING,
} from "../helpers/constants";

class Graph extends React.Component<
  SharedTypes.Graph.IGraphProps,
  SharedTypes.Graph.IGraphState
> {
  constructor(props: SharedTypes.Graph.IGraphProps) {
    super(props);
    this.state = {
      renderCounter: 0,
      data: {} as SharedTypes.Graph.IData,
      nodeGroups: {},
      groupConvexHullCoordinations: {},
    };
  }

  private graphRef: React.MutableRefObject<ForceGraphMethods> = React.createRef() as React.MutableRefObject<ForceGraphMethods>;

  public async componentDidMount(): Promise<void> {
    const mockdata: Response = await fetch("data/mockdata.json");
    const data: SharedTypes.Graph.IData = await mockdata.json();
    this.populateNodeGroupsStateProp(data.nodes);
    this.setState({
      data: { nodes: data.nodes, links: this.generateLinks(data.nodes) },
    });
  }

  public componentDidUpdate(
    prevProps: SharedTypes.Graph.IGraphProps,
    prevState: SharedTypes.Graph.IGraphState
  ): void {
    if (this.state.nodeWithNewlyAssignedCluster != null) {
      this.handleNodeClusterMembershipChange();
    }

    if (!_.isEqual(prevState.nodeGroups, this.state.nodeGroups)) {
      this.populateNodeGroupsStateProp(this.state.data.nodes);
    }
  }

  private handleNodeClusterMembershipChange = (): void => {
    let dataClone: SharedTypes.Graph.IData = _.clone(this.state.data);
    const newlyAssignedNode: SharedTypes.Graph.INode | undefined = _.find(
      dataClone.nodes,
      (node) => node.id === this.state.nodeWithNewlyAssignedCluster!.node.id
    );
    if (newlyAssignedNode != null) {
      // assign the newly assigned node its new group & corresponding color
      newlyAssignedNode.group = this.state.nodeWithNewlyAssignedCluster!.newGroupKey;
      newlyAssignedNode.color = this.getGroupColor(
        this.state.nodeWithNewlyAssignedCluster!.newGroupKey
      );

      dataClone.nodes.splice(newlyAssignedNode.index, 1, {
        ...this.state.nodeWithNewlyAssignedCluster!.node,
        group: this.state.nodeWithNewlyAssignedCluster!.newGroupKey,
      });

      dataClone.links = this.generateLinks(dataClone.nodes);
      this.setState({
        renderCounter: 0,
        nodeWithNewlyAssignedCluster: undefined,
        groupConvexHullCoordinations: {},
        nodeGroups: {},
        data: dataClone,
      });
    }
  };

  private interconnectClusterMembers(
    nodes: SharedTypes.Graph.INode[]
  ): SharedTypes.Graph.ILink[] {
    let interconnectedLinks: SharedTypes.Graph.ILink[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        interconnectedLinks.push({
          source: nodes[i],
          target: nodes[j],
          value: 0,
        });
      }
    }
    return interconnectedLinks;
  }

  private generateLinks(
    nodes: SharedTypes.Graph.INode[]
  ): SharedTypes.Graph.ILink[] {
    let links: SharedTypes.Graph.ILink[] = [];
    _.each(_.values(this.state.nodeGroups), (group) => {
      const nodeGroupA: SharedTypes.Graph.INode[] | undefined = _.filter(
        nodes,
        (node) => node.group === group
      );
      if (nodeGroupA != null) {
        links = [...links, ...this.interconnectClusterMembers(nodeGroupA)];
      }
    });
    return links;
  }

  private populateNodeGroupsStateProp = (
    nodes: SharedTypes.Graph.INode[]
  ): void => {
    _.each(nodes, (node: SharedTypes.Graph.INode) => {
      if (!(node.group in this.state.nodeGroups)) {
        this.setState({
          nodeGroups: { ...this.state.nodeGroups, [node.group]: node.group },
        });
      }
    });
  };

  private getGroupNodeCoordinations = (
    nodes: SharedTypes.Graph.INode[]
  ): SharedTypes.Graph.IGroupNodeCoordinations => {
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

  private getGroupConvexHullCoordinations = (): SharedTypes.Graph.IGroupConvexHullCoordinations => {
    const { nodes } = this.state.data;
    const groupNodesCoordinations: SharedTypes.Graph.IGroupNodeCoordinations = this.getGroupNodeCoordinations(
      nodes
    );

    let groupConvexHullCoordinations: SharedTypes.Graph.IGroupConvexHullCoordinations = {};

    _.each(_.keys(groupNodesCoordinations), (group) => {
      const groupKey: number = parseInt(group);
      let x: number[] = groupNodesCoordinations[groupKey].x;
      let y: number[] = groupNodesCoordinations[groupKey].y;
      const groupCoordinations: number[][] = x.map((xElem, index) => [
        xElem,
        y[index],
      ]);

      if (groupCoordinations.length <= 2) {
        const s = this.getArcCenterForClustersWithAtMostTwoElements(
          groupCoordinations
        );

        groupConvexHullCoordinations[groupKey] = [[s.x, s.y]];
      } else {
        groupConvexHullCoordinations[groupKey] = convexHull(groupCoordinations);
      }
    });

    this.setState({ groupConvexHullCoordinations });
    return groupConvexHullCoordinations;
  };

  private increaseDistanceBetweenDifferentClusters = (
    d3Graph: ForceGraphMethods
  ): void => {
    const forceFn: SharedTypes.Graph.IForceFn | undefined = d3Graph.d3Force(
      "link"
    ) as SharedTypes.Graph.IForceFn;

    forceFn?.distance((link: SharedTypes.Graph.ILink) => {
      const src: SharedTypes.Graph.INode = link.source;
      const tgt: SharedTypes.Graph.INode = link.target;
      if (src?.group !== tgt?.group) {
        return FORCE_LINK_DIFFERENT_GROUP_DISTANCE;
      } else {
        return FORCE_LINK_SAME_GROUP_DISTANCE;
      }
    });

    const chargeFn: SharedTypes.Graph.IForceFn | undefined = d3Graph.d3Force(
      "charge"
    ) as SharedTypes.Graph.IForceFn;

    chargeFn?.distanceMax(FORCE_CHARGE_MAX_DISTANCE);
  };

  private getGroupColor = (nodeGroup: number) => {
    let mostProminantColor: string = DEFAULT_NODE_COLOR;
    let nodeColorDictionary: { [nodeColor: string]: number } = {
      [DEFAULT_NODE_COLOR]: 1,
    };
    const nodes: SharedTypes.Graph.INode[] = _.filter(
      this.state.data.nodes,
      (node) => node.group === nodeGroup
    );
    _.each(nodes, (node) => {
      if (node.color in nodeColorDictionary) {
        nodeColorDictionary[node.color] += 1;
      } else {
        nodeColorDictionary[node.color] = 1;
      }
      if (
        nodeColorDictionary[node.color] >=
        nodeColorDictionary[mostProminantColor]
      ) {
        mostProminantColor = node.color;
      }
    });
    return mostProminantColor;
  };

  private getArcCenterForClustersWithAtMostTwoElements = (
    groupCoordinations: number[][]
  ): { x: number; y: number } => {
    let grp: { x: number[]; y: number[] } = {
      x: [],
      y: [],
    };

    _.each(_.keys(groupCoordinations), (node) => {
      grp.x = [...grp.x, groupCoordinations[parseInt(node)][0]];
      grp.y = [...grp.y, groupCoordinations[parseInt(node)][1]];
    });

    const sum: { x: number; y: number } = {
      x: _.reduce(grp.x, (a, b) => a + b, 0),
      y: _.reduce(grp.y, (a, b) => a + b, 0),
    };

    const arcCenter: { x: number; y: number } = {
      x: sum.x / grp.x.length || 0,
      y: sum.y / grp.y.length || 0,
    };

    return arcCenter;
  };

  private drawArcForClustersWithAtMostTwoElements = (
    ctx: CanvasRenderingContext2D,
    groupConvexHullCoordinations: SharedTypes.Graph.IGroupConvexHullCoordinations,
    nodeGroup: number
  ): void => {
    const groupCoordinations: number[][] =
      groupConvexHullCoordinations[nodeGroup];

    const arcCenter: {
      x: number;
      y: number;
    } = { x: groupCoordinations[0][0], y: groupCoordinations[0][1] };

    ctx.arc(
      arcCenter.x,
      arcCenter.y,
      CANVAS_ARC_RADIUS,
      CANVAS_ARC_START_ANGLE,
      CANVAS_ARC_END_ANGLE,
      CANVAS_ARC_ANTICLOCKWISE
    );
  };

  private drawClusterHulls = (ctx: CanvasRenderingContext2D): void => {
    let groupConvexHullCoordinations: SharedTypes.Graph.IGroupConvexHullCoordinations = {};

    let newConvexHulls: boolean = false;
    // draw the convex hulls when component mounts and upon change in cluster membership
    if (
      _.isEqual(
        _.keys(this.state.groupConvexHullCoordinations),
        _.keys(this.state.nodeGroups)
      ) &&
      this.state.renderCounter > 5
    ) {
      groupConvexHullCoordinations = this.state.groupConvexHullCoordinations;
    } else {
      groupConvexHullCoordinations = this.getGroupConvexHullCoordinations();
      newConvexHulls = true;
      this.setState({ renderCounter: this.state.renderCounter + 1 });
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
            this.drawArcForClustersWithAtMostTwoElements(
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

      // adjust the camera's view in case new convex hulls were created
      if (newConvexHulls) {
        this.graphRef.current?.zoomToFit(
          ZOOM_TO_FIT_DURATION,
          ZOOM_TO_FIT_PADDING
        );
      }
    });
  };

  private assignNewlyAssignedClusterToNode(
    canvasNode: SharedTypes.Graph.INode
  ): void {
    const newGroup: number[][] | undefined = _.find(
      this.state.groupConvexHullCoordinations,
      (convexHull) => {
        if (convexHull.length === 1) {
          return pointInArc(
            canvasNode.x,
            canvasNode.y,
            convexHull[0][0],
            convexHull[0][1],
            CANVAS_ARC_RADIUS
          );
        }
        return pointInPolygon([canvasNode.x, canvasNode.y], convexHull);
      }
    );

    if (newGroup == null) {
      return;
    }

    const key: string | undefined = _.findKey(
      this.state.groupConvexHullCoordinations,
      (convexHull) => convexHull === newGroup
    );

    if (key == null) {
      return;
    }

    const newGroupKey: number = parseInt(key);

    if (newGroupKey !== canvasNode.group) {
      this.setState({
        nodeWithNewlyAssignedCluster: {
          node: canvasNode,
          newGroupKey,
        },
      });
    }
  }

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

              const canvasNode: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
              this.assignNewlyAssignedClusterToNode(canvasNode);
            }}
            linkVisibility={false}
            warmupTicks={FORCE_GRAPH_WARM_UP_TICKS}
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
              const fontSize: number = 15 / globalScale;
              const textWidth: number = ctx.measureText(label).width;
              const bckgDimensions: number[] = _.map(
                [textWidth, fontSize],
                (n) => n + fontSize * 0.2
              );

              ctx.fillStyle = "white";
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

              canvasNode.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
            }}
            nodePointerAreaPaint={(node, color, ctx) => {
              const canvasNode: SharedTypes.Graph.INode = node as SharedTypes.Graph.INode;
              ctx.fillStyle = color;
              const bckgDimensions: number[] = canvasNode.__bckgDimensions;
              bckgDimensions &&
                ctx.fillRect(
                  canvasNode.x - bckgDimensions[0] / 2,
                  canvasNode.y - bckgDimensions[1] / 2,
                  bckgDimensions[0],
                  bckgDimensions[1]
                );
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
