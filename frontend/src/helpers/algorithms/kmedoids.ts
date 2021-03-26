import _ from "lodash";
import { Cluster, Clusterer } from "k-medoids";
import { SharedTypes } from "../../shared/sharedTypes";

export function kmedoids(
  distanceMatrix: number[][],
  nodes: SharedTypes.Graph.INode[],
  k: number
): {
  nodeMedoidInfoObjects: {
    [nodeId: number]: {
      medoid: number;
      distanceFromMedoid: number;
    };
  };
  medoidObject: { [medoid: number]: number };
} {
  const clusterer: Clusterer<number[]> = Clusterer.getInstance(
    distanceMatrix,
    k
  );
  clusterer.getClusteredData();

  let nodeMedoidInfoObjects: {
    [nodeId: number]: {
      medoid: number;
      distanceFromMedoid: number;
    };
  } = {};

  let medoidObject: {
    [medoid: number]: number;
  } = {};

  const clusters: Cluster<number[]>[] = clusterer.Clusters.sort((a, b) => {
    let sortable: number = a.Elements.length - b.Elements.length;
    _.each(a.Elements, (elem) => {
      sortable += _.indexOf(elem.Element, 0);
    });
    _.each(b.Elements, (elem) => {
      sortable -= _.indexOf(elem.Element, 0);
    });
    return sortable;
  });

  _.each(clusters, (cluster, index) => {
    _.each(cluster.Elements, (element) => {
      const medoid: number = index;
      const nodeIndex: number = _.indexOf(element.Element, 0);
      const node: SharedTypes.Graph.INode = nodes[nodeIndex];
      nodeMedoidInfoObjects[node.id] = {
        medoid,
        distanceFromMedoid: element.DistanceFromMedoid,
      };
      if (element.DistanceFromMedoid === 0) {
        medoidObject[medoid] = nodeIndex;
      }
    });
  });

  return { nodeMedoidInfoObjects, medoidObject };
}
