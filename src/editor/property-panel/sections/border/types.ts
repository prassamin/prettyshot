export type BorderStyle =
  | "none"
  | "solid"
  | "dashed"
  | "dotted"
  | "double"
  | "groove"
  | "ridge";

export interface Border {
  color: string | null;
  width: number;
  style?: BorderStyle;
  padding: number;
}

export interface BorderStyleOption {
  id: BorderStyle;
  label: string;
}

export interface BorderSectionProps {
  className?: string;
}
