export const getColorAccordingToCosineDistance = (distance: number): string => {
  if (distance < 5) {
    return "#004c6d";
  } else if (distance < 10) {
    return "#346888";
  } else if (distance > 15) {
    return "#c1e7ff";
  }
  return "#7aa6c2";
};
