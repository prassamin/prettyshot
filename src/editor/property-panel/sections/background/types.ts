export type BgType = "none" | "solid" | "gradient" | "mesh" | "image" | "auto";

export type Background = {
  type: BgType;
  value: string;
  sourceUrl?: string;
  thumbUrl?: string;
};
