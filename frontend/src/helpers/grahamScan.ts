export function convexHull(data: number[][]) {
  let upperArr = [],
    lowerArr = [],
    clone;

  clone = data.slice();

  clone.sort(function (a, b) {
    return a[0] - b[0];
  });

  // calculate the upper hull
  for (let i = 0; i < clone.length; i++) {
    let point = clone[i];

    upperArr.push(point);
    removePoints(upperArr);
  }

  // calculate the lower hull
  for (let j = clone.length - 1; j >= 0; j--) {
    let point = clone[j];

    lowerArr.push(point);
    removePoints(lowerArr);
  }

  lowerArr.splice(0, 1);
  lowerArr.splice(lowerArr.length - 1, 1);

  // concat hulls
  return upperArr.concat(lowerArr);
}

function removePoints(arr: number[][]) {
  while (
    arr.length >= 3 &&
    !isTurnRight(arr[arr.length - 3], arr[arr.length - 2], arr[arr.length - 1])
  ) {
    arr.splice(arr.length - 2, 1);
  }
}

function isTurnRight(point1: number[], point2: number[], point3: number[]) {
  const x1 = point1[0],
    x2 = point2[0],
    x3 = point3[0],
    y1 = point1[1],
    y2 = point2[1],
    y3 = point3[1];

  return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1) > 0;
}
