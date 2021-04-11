export interface KMeans {
  iterations: number;
  k: number;
  indexes: Array<number>;
  centroids: Centroids;
}

export type UniMultiDimensionalArray = Array<any>; // needs to be able to handle array of any size
export type Vector = Array<number>;
export type Centroid = Array<number>;
export type Centroids = Array<Centroid>;

const MAX: number = 10000;

function init(len: number, val: number, vect: Vector): Vector {
  vect = vect || [];
  for (let i = 0; i < len; i++) {
    vect[i] = val;
  }
  return vect;
}

export default function kmeans(
  data: UniMultiDimensionalArray,
  k: number,
  distanceFunction: (x: Centroid, y: Centroid, Wa: number[]) => number,
  attributeWeightArray: number[],
  init_cent?: Array<any>,
  max_it?: number
): KMeans {
  let cents: Centroids = [];
  let indexes: Array<number> = [];
  let cent_moved: boolean = false;
  let iterations: number = max_it || MAX;
  let ctr: number = 0;
  let count: Vector = [];

  if (!init_cent) {
    let def_indexes: Array<boolean> = [];
    let i: number = 0;
    while (cents.length < k) {
      let idx: number = Math.floor(Math.random() * data.length);
      if (!def_indexes[idx]) {
        def_indexes[idx] = true;
        cents[i++] = data[idx];
      }
    }
  } else {
    cents = Array.from(init_cent);
  }

  do {
    init(k, 0, count);
    // For each value in data, find nearest centroid (Custom, multidimensional or one-dimensional)
    for (const i in data) {
      let min: number = Infinity;
      let idx: number = 0;
      for (let j = 0; j < k; j++) {
        let dist: number = distanceFunction(
          data[i],
          cents[j],
          attributeWeightArray
        );
        if (dist <= min) {
          min = dist;
          idx = j;
        }
      }
      indexes[i] = idx; // Idx of centroid
      count[idx]++; // Num values for centroid
    }

    // Recalculate centroids
    let sum: UniMultiDimensionalArray = [];
    let old: Centroids = [];
    if (data[0].length > 0) {
      for (let j = 0; j < k; j++) {
        sum[j] = init(data[0].length, 0, sum[j]);
        old[j] = cents[j];
      }
    } else {
      for (let j = 0; j < k; j++) {
        sum[j] = 0;
        old[j] = cents[j];
      }
    }
    // If multidimensional, sum values & accumulate value on the centroid for current vector for each centroid
    if (data[0].length > 0) {
      for (let j = 0; j < k; j++) {
        cents[j] = [];
      }
      for (const i in data) {
        for (let h = 0; h < data[0].length; h++) {
          sum[indexes[i]][h] += data[i][h]; // Sum values for current centroid + Current vector
        }
      }
      // Calculate the avg for each centroid
      cent_moved = true;
      for (let j = 0; j < k; j++) {
        /* 
                sum[j] |  Sum of centroid values
                old[j] | Old centroid value
                count[j] | Num elements for centroid
                */
        let cent_j: Centroid = cents[j]; // Current centroid
        for (let h = 0; h < data[0].length; h++) {
          cent_j[h] = sum[j][h] / count[j] || 0; // Avg from new centroid
        }
        if (cent_moved) {
          for (let h = 0; h < data[0].length; h++) {
            if (old[j][h] !== cent_j[h]) {
              cent_moved = false;
              break;
            }
          }
        }
      }
    }
    // If one-dimensional, sum values & for each centroid, calculate avg, then determine if centroids moved
    else {
      for (const i in data) {
        let idx: number = indexes[i];
        sum[idx] += data[i];
      }
      for (let j = 0; j < k; j++) {
        cents[j] = [sum[j] / count[j]] || [0];
      }
      cent_moved = true;
      for (let j = 0; j < k; j++) {
        if (old[j] !== cents[j]) {
          cent_moved = false;
          break;
        }
      }
    }

    cent_moved = cent_moved || --iterations <= 0;
  } while (!cent_moved);

  const k_means_obj: KMeans = {
    iterations: ctr,
    k,
    indexes,
    centroids: cents,
  };
  return k_means_obj;
}
