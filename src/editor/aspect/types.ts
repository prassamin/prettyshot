/**
 * Aspect Ratio — shared type definitions.
 */

export type AspectState = {
  id: string;
  w: number;
  h: number;
};

export type AspectOption = {
  id: string;
  name: string;
  ratio: string;
  w: number;
  h: number;
};

export type AspectCategory = {
  id: string;
  label: string;
  options: AspectOption[];
};
