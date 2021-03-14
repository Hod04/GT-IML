export const getColorAccordingToPairwiseDistance = (
  distance: number
): string => {
  if (distance < 0.25) {
    return "#004c6d";
  } else if (distance < 0.5) {
    return "#346888";
  } else if (distance > 0.75) {
    return "#c1e7ff";
  }
  return "#7aa6c2";
};
