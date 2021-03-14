export function pointInArc(
  pointA: number,
  pointB: number,
  xCenter: number,
  yCenter: number,
  radius: number
): boolean {
  const dist_points: number =
    (pointA - xCenter) * (pointA - xCenter) +
    (pointB - yCenter) * (pointB - yCenter);
  return dist_points < radius * radius;
}
