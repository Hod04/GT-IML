import * as _ from "lodash";

export function pointInPolygon(point: (number | undefined)[], vs: number[][]) {
  if (_.some(point, (coord) => coord == null)) {
    return false;
  }

  const x: number = point[0] as number,
    y: number = point[1] as number;

  let inside: boolean = false;

  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi: number = vs[i][0],
      yi: number = vs[i][1];
    const xj: number = vs[j][0],
      yj: number = vs[j][1];

    const intersect: boolean =
      // eslint-disable-next-line
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}
