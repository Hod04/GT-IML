import _ from "lodash";

export function calculateDistanceMatrix(
  data: number[][],
  distanceFn: (p: number[], q: number[], Wa: number, We: number) => number,
  // attribute weight
  Wa: number,
  // edge class weight
  We: number
) {
  let distanceMatrix: number[][] = [];

  // initialize the distance matrix with zero values
  _.forIn(data, (row) => {
    distanceMatrix.push(_.fill(new Array(data.length), 0));
  });

  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j <= i; j++) {
      distanceMatrix[i][j] = distanceFn(data[i], data[j], Wa, We);
      distanceMatrix[j][i] = distanceMatrix[i][j];
    }
  }

  const distanceRange: { min: number; max: number } = getDistanceRange(
    distanceMatrix
  );

  const normalizedDistanceMatrix: number[][] = normalizeValues(
    distanceMatrix,
    distanceRange
  );

  return normalizedDistanceMatrix;
}

export function euclideanDistance(
  p: number[],
  q: number[],
  Wa: number,
  We: number
) {
  let distance: number = 0;
  for (let i = 0; i < p.length; i++) {
    distance += Wa * We * (p[i] - q[i]) * (p[i] - q[i]);
  }

  return Math.sqrt(distance);
}

export function manhattanDistance(
  pointA: { x: number; y: number },
  pointB: { x: number; y: number }
): number {
  return Math.abs(pointA.x - pointB.x) + Math.abs(pointA.y - pointB.y);
}

export function getDistanceRange(
  distanceMatrix: number[][]
): { min: number; max: number } {
  let distanceRange: { min: number; max: number } = {} as {
    min: number;
    max: number;
  };
  _.each(distanceMatrix, (row) => {
    const minDist: number | undefined = _.min(row);
    const maxDist: number | undefined = _.max(row);

    if (
      distanceRange.min == null ||
      (minDist != null && minDist < distanceRange.min)
    ) {
      distanceRange.min = minDist as number;
    }

    if (
      distanceRange.max == null ||
      (maxDist != null && maxDist > distanceRange.max)
    ) {
      distanceRange.max = maxDist as number;
    }
  });
  return distanceRange;
}

function normalizeValues(
  distanceMatrix: number[][],
  distanceRange: { min: number; max: number }
) {
  let distanceMatrixClone: number[][] = _.clone(distanceMatrix);
  _.each(distanceMatrixClone, (row, rowIndex) => {
    _.each(row, (value, valueIndex) => {
      if (value === 0) {
        return;
      }
      distanceMatrixClone[rowIndex][valueIndex] =
        (value - distanceRange.min) / (distanceRange.max - distanceRange.min);
    });
  });
  return distanceMatrixClone;
}
