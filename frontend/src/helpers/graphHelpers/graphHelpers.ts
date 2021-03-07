import _ from "lodash";
import { SharedTypes } from "../../shared/sharedTypes";
import { DEFAULT_NODE_COLOR } from "../constants";

export const interconnectClusterMembers = (
  nodes: SharedTypes.Graph.INode[]
): SharedTypes.Graph.ILink[] => {
  let interconnectedLinks: SharedTypes.Graph.ILink[] = [];
  for (let i: number = 0; i < nodes.length; i++) {
    for (let j: number = i + 1; j < nodes.length; j++) {
      // let nodesFromSameGroup: boolean = false;
      let cosineDistance: number = nodes[i].distances[nodes[j].id];

      // if (nodes[i].group === nodes[j].group) {
      //   nodesFromSameGroup = true;
      // }

      const interconnectNode = () =>
        interconnectedLinks.push({
          source: nodes[i],
          target: nodes[j],
          cosineDistance: ~~cosineDistance,
        });

      interconnectNode();

      // artificially increase edge weight of nodes from same group
      // by increasing the amount of links between such nodes
      for (let w: number = 0; w < 30 - ~~cosineDistance; w++) {
        interconnectNode();
      }

      // if (nodesFromSameGroup) {
      //   for (let k: number = 0; k < 50; k++) {
      //     interconnectNode();
      //   }
      // }
    }
  }
  return interconnectedLinks;
};

export const generateLinks = (
  nodes: SharedTypes.Graph.INode[],
  nodeGroups: { [nodeGroup: number]: number }
): SharedTypes.Graph.ILink[] => {
  let links: SharedTypes.Graph.ILink[] = [];
  // _.each(_.values(nodeGroups), (group) => {
  //   const nodeGroupA: SharedTypes.Graph.INode[] | undefined = _.filter(
  //     nodes,
  //     (node) => node.group === group
  //   );
  //   if (nodeGroupA != null) {
  //     links = [...links, ...interconnectClusterMembers(nodeGroupA)];
  //   }
  // });

  links = interconnectClusterMembers(nodes);
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
  let mostCommonColor: string = DEFAULT_NODE_COLOR;
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
      nodeColorDictionary[node.color] >= nodeColorDictionary[mostCommonColor]
    ) {
      mostCommonColor = node.color;
    }
  });
  return mostCommonColor;
};

export const getArcCenterForClustersWithAtMostTwoElements = (
  groupCoordinations: number[][]
): { x: number; y: number } => {
  let grp: { x: number[]; y: number[] } = {
    x: [],
    y: [],
  };
  if (groupCoordinations.length === 1) {
    return { x: groupCoordinations[0][0], y: groupCoordinations[0][1] };
  }
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