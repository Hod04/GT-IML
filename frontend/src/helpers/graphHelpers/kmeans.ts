import _, { isEmpty } from "lodash";
import { SharedTypes } from "../../shared/sharedTypes";
import { embeddings } from "../embeddings";
import { euclideanDistance } from "../algorithms/calculateDistanceMatrix";
import kmeans, { KMeans } from "../algorithms/kMeansLib";

export function kMeans(
  nodes: SharedTypes.Graph.INode[],
  k: number,
  attributeWeightArray: number[],
  weightedEmbeddings: number[][],
  clusters: number[][],
  performElbowMethod: boolean
): SharedTypes.Graph.IKMeansClusteringInfo {
  let nodeCentroidInfoObjects: {
    [nodeId: number]: {
      centroid: number;
    };
  } = {};

  let centroidObject: {
    [centroid: number]: number;
  } = {};

  let kMeansClusteringInstances: { [kClusters: number]: KMeans } = {};

  let initClusters: number[][] | undefined =
    clusters != null && !_.isEmpty(clusters) && clusters.length === k
      ? clusters
      : undefined;

  let kmeansClusterDataEmbeddings: KMeans = {} as KMeans;

  if (!performElbowMethod) {
    kmeansClusterDataEmbeddings = kmeans(
      weightedEmbeddings || embeddings,
      k,
      euclideanDistance,
      attributeWeightArray,
      initClusters
    );
  } else {
    // calculate SSE to employ elbow method
    let SSE: { [clusterId: number]: number } = {};
    for (let kClusters: number = 2; kClusters <= 15; kClusters++) {
      let distancesWithinCluster: { [clusterId: number]: number[] } = {};
      let meanDistancesWithinCluster: { [clusterId: number]: number } = {};
      SSE[kClusters] = 0;
      const kMeansClusterInstance: KMeans = kmeans(
        weightedEmbeddings || embeddings,
        kClusters,
        euclideanDistance,
        attributeWeightArray,
        initClusters
      );

      kMeansClusteringInstances[kClusters] = kMeansClusterInstance;

      _.each(kMeansClusterInstance.centroids, (cluster, clusterId) => {
        distancesWithinCluster[clusterId] = [];
      });

      _.each(kMeansClusterInstance.indexes, (clusterIndex, nodeIndex) => {
        const distanceBetweenClusterAndNode: number = euclideanDistance(
          kMeansClusterInstance.centroids[clusterIndex],
          weightedEmbeddings[nodeIndex],
          attributeWeightArray
        );
        distancesWithinCluster[clusterIndex].push(
          distanceBetweenClusterAndNode
        );
      });

      _.each(distancesWithinCluster, (cluster, clusterId) => {
        meanDistancesWithinCluster[parseInt(clusterId)] = _.mean(cluster);
      });

      _.each(distancesWithinCluster, (cluster, clusterId) => {
        _.each(cluster, (distance) => {
          SSE[kClusters] += Math.pow(
            distance - meanDistancesWithinCluster[parseInt(clusterId)],
            2
          );
        });
      });
    }
    _.each(SSE, (SSEElem, SSEIndex) => {
      // make sure the number of clusters surpasses the square root of half of the data samples
      if (
        parseInt(SSEIndex) < _.floor(Math.sqrt(nodes.length / 2)) ||
        !_.isEmpty(kmeansClusterDataEmbeddings)
      ) {
        return;
      }
      const parsedSSEIndex: number = parseInt(SSEIndex);
      const nextSSEIndex: number = parsedSSEIndex + 1;
      if (SSE[nextSSEIndex] != null && SSE[nextSSEIndex] > SSEElem) {
        kmeansClusterDataEmbeddings = kMeansClusteringInstances[parsedSSEIndex];
      }
    });

    // default to k = 8 in the edge case where no "ideal" cluster was found
    if (isEmpty(kmeansClusterDataEmbeddings)) {
      kmeansClusterDataEmbeddings = kMeansClusteringInstances[8];
    }
  }

  initClusters = kmeansClusterDataEmbeddings.centroids;

  _.each(
    kmeansClusterDataEmbeddings.indexes,
    (clusterIndex: number, nodeIndex: number) => {
      nodeCentroidInfoObjects[nodes[nodeIndex].id] = {
        centroid: clusterIndex,
      };
      if (centroidObject[nodes[nodeIndex].id] == null) {
        centroidObject[nodes[nodeIndex].id] = clusterIndex;
      }
    }
  );
  return {
    nodeCentroidInfoObjects,
    clusters: initClusters,
  };
}
