export type FootprintSpot = {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
};

export const lineStyleIds = ["solid", "dashed", "dotted"] as const;
export type LineStyleId = (typeof lineStyleIds)[number];

export const lineColorIds = ["ocean", "coral", "forest", "violet", "amber"] as const;
export type LineColorId = (typeof lineColorIds)[number];

/** Animation presets for the connector overlay. `none` keeps the map completely static. */
export const animationIds = ["none", "pulse", "comet", "flow"] as const;
export type AnimationId = (typeof animationIds)[number];

export const lineShapeIds = ["straight", "arc"] as const;
export type LineShapeId = (typeof lineShapeIds)[number];

/** `star` connects home to every spot; `chain` follows the order spots were added. */
export const connectModeIds = ["star", "chain"] as const;
export type ConnectModeId = (typeof connectModeIds)[number];

export const lineWidthRange = { min: 1, max: 8, step: 1 } as const;

export type TravelFootprintState = {
  home: FootprintSpot | null;
  spots: FootprintSpot[];
  lineStyle: LineStyleId;
  lineColor: LineColorId;
  lineWidth: number;
  animation: AnimationId;
  lineShape: LineShapeId;
  connectMode: ConnectModeId;
};

export const DEFAULT_TRAVEL_FOOTPRINT_STATE: TravelFootprintState = {
  home: null,
  spots: [],
  lineStyle: "solid",
  lineColor: "ocean",
  lineWidth: 3,
  animation: "none",
  lineShape: "straight",
  connectMode: "star",
};
