export const DEFAULT_NODE_COLOR: string = "#444";

export const CANVAS_ARC_RADIUS: number = 50;
export const CANVAS_ARC_START_ANGLE: number = 0;
export const CANVAS_ARC_END_ANGLE: number = Math.PI * 2;
export const CANVAS_ARC_ANTICLOCKWISE: boolean = true;

export const FORCE_LINK_DIFFERENT_GROUP_DISTANCE: number = 500;
export const FORCE_LINK_DIFFERENT_GROUP_DISTANCE_CLOSER_DISTANCE: number = 300;
export const FORCE_LINK_DIFFERENT_GROUP_DISTANCE_FARTHER_DISTANCE: number = 700;

export const FORCE_LINK_SAME_GROUP_DISTANCE: number = 80;
export const FORCE_LINK_SAME_GROUP_DISTANCE_MORE_COMPACT: number = 50;
export const FORCE_LINK_SAME_GROUP_DISTANCE_LESS_COMPACT: number = 150;

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
