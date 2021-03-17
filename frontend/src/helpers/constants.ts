export const CANVAS_ARC_RADIUS: number = 50;
export const CANVAS_ARC_START_ANGLE: number = 0;
export const CANVAS_ARC_END_ANGLE: number = Math.PI * 2;
export const CANVAS_ARC_ANTICLOCKWISE: boolean = true;

export const FORCE_LINK_DIFFERENT_CLUSTER_DISTANCE: number = 500;
export const FORCE_LINK_DIFFERENT_CLUSTER_DISTANCE_CLOSER_DISTANCE: number = 300;
export const FORCE_LINK_DIFFERENT_CLUSTER_DISTANCE_FARTHER_DISTANCE: number = 700;

export const FORCE_LINK_SAME_CLUSTER_DISTANCE: number = 80;
export const FORCE_LINK_SAME_CLUSTER_DISTANCE_MORE_COMPACT: number = 50;
export const FORCE_LINK_SAME_CLUSTER_DISTANCE_LESS_COMPACT: number = 150;

export const FORCE_CHARGE_MAX_DISTANCE: number = 200;

export const ZOOM_TO_FIT_DURATION: number = 500;
export const ZOOM_TO_FIT_PADDING: number = 50;

export const FORCE_GRAPH_WARM_UP_TICKS: number = 200;

export enum CLUSTER_COMPACTNESS {
  MoreCompact = "More Compact",
  ClusterCompactness = "Cluster Compactness",
  LessCompact = "Less Compact",
}

export enum PAIRWISE_CLUSTER_DISTANCE {
  Farther = "Farther",
  PairwisseClusterDistance = "Pairwise Cluster Distance",
  Closer = "Closer",
}

//  theory - https://eleanormaclure.files.wordpress.com/2011/03/colour-coding.pdf (page 5)
//  kelly's colors - https://i.kinja-img.com/gawker-media/image/upload/1015680494325093012.JPG
export const KELLY_COLOR_PALETTE: string[] = [
  "#222222",
  "#F3C300",
  "#875692",
  "#F38400",
  "#A1CAF1",
  "#BE0032",
  "#C2B280",
  "#008856",
  "#E68FAC",
  "#0067A5",
  "#F99379",
  "#604E97",
  "#B3446C",
  "#DCD300",
  "#882D17",
  "#8DB600",
  "#654522",
  "#E25822",
  "#2B3D26",
];
