import _ from "lodash";
import { SharedTypes } from "../../shared/sharedTypes";
import { DEFAULT_COLOR } from "../constants";

export const generateLinks = (
  nodes: SharedTypes.Graph.INode[],
  constructGraphFromGroundUp: boolean
): SharedTypes.Graph.ILink[] => {
  let interconnectedLinks: SharedTypes.Graph.ILink[] = [];
  let clusterNodes: { [nodeId: number]: SharedTypes.Graph.INode } = {};

  for (let i: number = 0; i < nodes.length; i++) {
    for (let j: number = i + 1; j < nodes.length; j++) {
      let pairwiseDistance: number = nodes[i].distances[nodes[j].id];

      if (isClusterNode(nodes[i])) {
        if (!(nodes[i].id in clusterNodes)) {
          clusterNodes[nodes[i].id] = nodes[i];
        }
        continue;
      } else if (isClusterNode(nodes[j])) {
        if (!(nodes[i].id in clusterNodes)) {
          clusterNodes[nodes[j].id] = nodes[j];
        }
        continue;
      }

      if (nodes[i].clusterId === nodes[j].clusterId) {
        // Node-Node Internal Edges
        interconnectedLinks.push({
          source: nodes[i],
          target: nodes[j],
          pairwiseDistance,
        });
      } else {
        // Node-Node External Edges
        interconnectedLinks.push({
          source: nodes[i],
          target: nodes[j],
          pairwiseDistance,
        });
      }
    }
  }
  _.each(clusterNodes, (clusterNode) => {
    _.each(nodes, (node) => {
      if (clusterNode.id === node.id) {
        return;
      }
      if (!_.isEqual(clusterNode, node) && isClusterNode(node)) {
        // Centroid-Centroid Edges
        interconnectedLinks.push({
          source: clusterNode,
          target: node,
          pairwiseDistance: 1,
          color: DEFAULT_COLOR,
        });
        return;
      }
      let clusterId: number =
        clusterNode.index - nodes.length + Object.keys(clusterNodes).length - 1;
      if (!constructGraphFromGroundUp) {
        clusterId += 1;
      }
      if (clusterId === node.clusterId) {
        // Centroid-Node Internal Edges
        interconnectedLinks.push({
          source: clusterNode,
          target: node,
          pairwiseDistance: 0,
        });
      }
      // Centroid-Node External Edges
      if (clusterId !== node.clusterId) {
        interconnectedLinks.push({
          source: clusterNode,
          target: node,
          pairwiseDistance: 0,
          color: "#d3d3d3",
        });
      }
    });
  });

  return interconnectedLinks;
};

export const getClusterNodeCoordinations = (
  nodes: SharedTypes.Graph.INode[]
): SharedTypes.Graph.IClusterNodeCoordinations => {
  let clusterNodesCoordinations: SharedTypes.Graph.IClusterNodeCoordinations = {};

  _.each(nodes, (node) => {
    if (node.x == null || node.y == null || isClusterNode(node)) {
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

export const isClusterNodeById = (nodeId: number): boolean =>
  !_.isInteger(nodeId);
export const isClusterNode = (node: SharedTypes.Graph.INode): boolean =>
  node.isClusterNode || false;
