import { MacosFrame } from "./macos-frame";
import { WindowsFrame } from "./windows-frame";
import { GlassFrame } from "./glass-frame";
import { ArcFrame } from "./arc-frame";
import { NoneFrame } from "./none-frame";
import { IphoneFrame } from "./iphone-frame";
import { ChromeFrame } from "./chrome-frame";
import { MinimalFrame } from "./minimal-frame";
import { TabletFrame } from "./tablet-frame";
import { FrameProps } from "./types";

export const FrameRegistry: Record<string, React.FC<FrameProps>> = {
  macos: MacosFrame,
  windows: WindowsFrame,
  glass: GlassFrame,
  arc: ArcFrame,
  chrome: ChromeFrame,
  iphone: IphoneFrame,
  tablet: TabletFrame,
  minimal: MinimalFrame,
  none: NoneFrame,
};

export function DeviceFrameWrapper({ frame, ...props }: FrameProps & { frame: string }) {
  const FrameComponent = FrameRegistry[frame] || FrameRegistry.none;
  return <FrameComponent {...props} />;
}
