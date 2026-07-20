export interface FrameProps {
  children: React.ReactNode;
  style: React.CSSProperties;
  borderRadius: number;
  className?: string;
  browserUrl?: string;
  imageAspectRatio?: number | null;
  theme?: "light" | "dark";
}
