"use client";

import { motion } from "framer-motion";
import { EditorTopbar } from "@/components/editor/editor-topbar";
import { PreviewCanvas } from "@/components/editor/preview-canvas";
import { ControlsSidebar } from "@/components/editor/controls-sidebar";
import { BackgroundControl } from "@/components/editor/controls/background-control";
import { FrameControl } from "@/components/editor/controls/frame-control";
import { PaddingControl } from "@/components/editor/controls/padding-control";
import { BorderControl } from "@/components/editor/controls/border-control";
import { ShadowControl } from "@/components/editor/controls/shadow-control";
import { PerspectiveControl } from "@/components/editor/controls/perspective-control";
import { WatermarkControl } from "@/components/editor/controls/watermark-control";

const sectionContent: Record<string, React.ReactNode> = {
  background: <BackgroundControl />,
  frame: <FrameControl />,
  padding: <PaddingControl />,
  border: <BorderControl />,
  shadow: <ShadowControl />,
  perspective: <PerspectiveControl />,
  watermark: <WatermarkControl />,
};

export function EditorView() {
  return (
    <div className="flex h-dvh flex-col bg-linear-to-br from-orange-50/80 via-rose-50/40 to-violet-50/60">
      <EditorTopbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Preview area */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <PreviewCanvas />
        </div>

        <motion.aside
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="hidden w-85 shrink-0 border-l border-zinc-200/60 bg-white/60 backdrop-blur-xl lg:block z-10"
        >
          <ControlsSidebar sectionContent={sectionContent} />
        </motion.aside>
      </div>
    </div>
  );
}
