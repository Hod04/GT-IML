import _ from "lodash";
import { SharedTypes } from "../../shared/sharedTypes";

export const generateLinks = (
  nodes: SharedTypes.Graph.INode[]
): SharedTypes.Graph.ILink[] => {
  let interconnectedLinks: SharedTypes.Graph.ILink[] = [];

  for (let i: number = 0; i < nodes.length; i++) {
    for (let j: number = i + 1; j < nodes.length; j++) {
      let pairwiseDistance: number = nodes[i].distances[nodes[j].id];

      interconnectedLinks.push({
        source: nodes[i],
        target: nodes[j],
        pairwiseDistance,
      });
    }
  }
  return interconnectedLinks;
};

export const getClusterNodeCoordinations = (
  nodes: SharedTypes.Graph.INode[]
): SharedTypes.Graph.IClusterNodeCoordinations => {
  let clusterNodesCoordinations: SharedTypes.Graph.IClusterNodeCoordinations = {};

  _.each(nodes, (node) => {
    if (node.x == null || node.y == null) {
      return;
    }

    if (!(node.clusterId in clusterNodesCoordinations)) {
      clusterNodesCoordinations = {
        ...clusterNodesCoordinations,
        [node.clusterId]: {
          x: [node.x],
          y: [node.y],
        },
      };
    } else {
      clusterNodesCoordinations = {
        ...clusterNodesCoordinations,
        [node.clusterId]: {
          x: [...clusterNodesCoordinations[node.clusterId].x, node.x],
          y: [...clusterNodesCoordinations[node.clusterId].y, node.y],
        },
      };
    }
  });
  return clusterNodesCoordinations;
};

export const getArcCenterForClustersWithAtMostTwoElements = (
  clusterCoordinations: number[][]
): { x: number; y: number } => {
  let grp: { x: number[]; y: number[] } = {
    x: [],
    y: [],
  };
  if (clusterCoordinations.length === 1) {
    return { x: clusterCoordinations[0][0], y: clusterCoordinations[0][1] };
  }
  _.each(_.keys(clusterCoordinations), (node) => {
    grp.x = [...grp.x, clusterCoordinations[parseInt(node)][0]];
    grp.y = [...grp.y, clusterCoordinations[parseInt(node)][1]];
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
