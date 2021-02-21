import _ from "lodash";
import { SharedTypes } from "../../shared/sharedTypes";
import { DEFAULT_NODE_COLOR } from "../constants";

export const interconnectClusterMembers = (
  nodes: SharedTypes.Graph.INode[]
): SharedTypes.Graph.ILink[] => {
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
};

export const generateLinks = (
  nodes: SharedTypes.Graph.INode[],
  nodeGroups: { [nodeGroup: number]: number }
): SharedTypes.Graph.ILink[] => {
  let links: SharedTypes.Graph.ILink[] = [];
  _.each(_.values(nodeGroups), (group) => {
    const nodeGroupA: SharedTypes.Graph.INode[] | undefined = _.filter(
      nodes,
      (node) => node.group === group
    );
    if (nodeGroupA != null) {
      links = [...links, ...interconnectClusterMembers(nodeGroupA)];
    }
  });
  return links;
};

export const getGroupNodeCoordinations = (
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

export const getGroupColor = (
  nodes: SharedTypes.Graph.INode[],
  nodeGroup: number
) => {
  let mostProminantColor: string = DEFAULT_NODE_COLOR;
  let nodeColorDictionary: { [nodeColor: string]: number } = {
    [DEFAULT_NODE_COLOR]: 1,
  };
  const groupNodes: SharedTypes.Graph.INode[] = _.filter(
    nodes,
    (node) => node.group === nodeGroup
  );
  _.each(groupNodes, (node) => {
    if (node.color in nodeColorDictionary) {
      nodeColorDictionary[node.color] += 1;
    } else {
      nodeColorDictionary[node.color] = 1;
    }
    if (
      nodeColorDictionary[node.color] >= nodeColorDictionary[mostProminantColor]
    ) {
      mostProminantColor = node.color;
    }
  });
  return mostProminantColor;
};

export const getArcCenterForClustersWithAtMostTwoElements = (
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
