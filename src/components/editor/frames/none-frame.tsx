import { FrameProps } from "./types";

export function NoneFrame({ children, style, className, imageAspectRatio }: FrameProps) {
  return (
    <div
      className={className}
      style={{ ...style, overflow: "hidden", display: "flex", ...(imageAspectRatio ? { aspectRatio: String(imageAspectRatio) } : {}) }}
    >
      {children}
    </div>
  );
}
