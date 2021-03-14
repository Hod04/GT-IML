import _ from "lodash";
import { Clusterer } from "k-medoids";
import { SharedTypes } from "../../shared/sharedTypes";

export function kmedoids(
  distanceMatrix: number[][],
  nodes: SharedTypes.Graph.INode[],
  k: number
): {
  [nodeId: number]: {
    medoid: number;
    distanceFromMedoid: number;
  };
} {
  const clusterer = Clusterer.getInstance(distanceMatrix, k);
  clusterer.getClusteredData();
  let nodeMedoidInfoObjects: {
    [nodeId: number]: {
      medoid: number;
      distanceFromMedoid: number;
    };
  } = {};
  _.each(clusterer.Clusters, (cluster, index) => {
    _.each(cluster.Elements, (element) => {
      const medoid: number = index;
      const nodeIndex: number = getElementIndex(element.Element);
      const node: SharedTypes.Graph.INode = nodes[nodeIndex];
      nodeMedoidInfoObjects[node.id] = {
        medoid,
        distanceFromMedoid: element.DistanceFromMedoid,
      };
    });
  });
  return nodeMedoidInfoObjects;
}

function getElementIndex(row: number[]): number {
  return _.indexOf(row, 0);
}
