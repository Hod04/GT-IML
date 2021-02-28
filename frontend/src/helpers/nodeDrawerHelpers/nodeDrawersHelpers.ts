export const getTableEntryBackgroundColor = (distance: number): string => {
  if (distance < 5) {
    return "seagreen";
  } else if (distance < 10) {
    return "steelblue";
  } else if (distance > 15) {
    return "indianred";
  }
  return "white";
};
