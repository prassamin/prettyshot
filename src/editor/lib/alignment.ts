import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  LucideProps,
} from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

type ValidAlignTo =
  | { xPct: number; yPct: null }
  | { xPct: null; yPct: number }
  | { xPct: number; yPct: number }; // Enforces that both cannot be null at the same time

interface AlignOption {
  label: string;
  to: ValidAlignTo;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
}

export const AlignOptions: AlignOption[] = [
  {
    label: "Align Left",
    to: { xPct: 0, yPct: null },
    icon: AlignStartHorizontal,
  },
  {
    label: "Align Center X",
    to: { xPct: 50, yPct: null },
    icon: AlignCenterHorizontal,
  },
  {
    label: "Align Right",
    to: { xPct: 100, yPct: null },
    icon: AlignEndHorizontal,
  },
  { label: "Align Top", to: { xPct: null, yPct: 0 }, icon: AlignStartVertical },
  {
    label: "Align Center Y",
    to: { xPct: null, yPct: 50 },
    icon: AlignCenterVertical,
  },
  {
    label: "Align Bottom",
    to: { xPct: null, yPct: 100 },
    icon: AlignEndVertical,
  },
] as const;
