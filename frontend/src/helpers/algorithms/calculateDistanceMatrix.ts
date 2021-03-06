import _ from "lodash";

export function calculateDistanceMatrix(
  data: number[][],
  distanceFn: (p: number[], q: number[], Wa: number[], We: number) => number,
  // attribute weight
  Wa: number[],
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
      if (i === j) {
        distanceMatrix[i][j] = 0;
        distanceMatrix[j][i] = 0;
        continue;
      }
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
  Wa: number[]
): number {
  let distance: number = 0;
  for (let i = 0; i < p.length; i++) {
    distance += Wa[i] * Math.pow(p[i] - q[i], 2);
  }

  return Math.sqrt(distance);
}

export function manhattanDistance(p: number, q: number): number {
  return Math.abs(p - q);
}

export function getDistanceRange(
  distanceMatrix: number[][]
): { min: number; max: number } {
  let distanceRange: { min: number; max: number } = {} as {
    min: number;
    max: number;
  };
  _.each(distanceMatrix, (row) => {
    let rowClone: number[] = _.clone(row);
    rowClone.splice(_.indexOf(rowClone, 0), 1);
    const minDist: number | undefined = _.min(rowClone);
    const maxDist: number | undefined = _.max(rowClone);
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
      if (value === distanceRange.min) {
        distanceMatrixClone[rowIndex][valueIndex] = value;
        return;
      }
      distanceMatrixClone[rowIndex][valueIndex] =
        (value - distanceRange.min) / (distanceRange.max - distanceRange.min);
    });
  });

  return distanceMatrixClone;
}
