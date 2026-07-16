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
import { useAutoSave } from "@/hooks/use-auto-save";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditorStore } from "@/stores/editor-store";

const sectionContent: Record<string, React.ReactNode> = {
  background: <BackgroundControl />,
  frame: <FrameControl />,
  padding: <PaddingControl />,
  border: <BorderControl />,
  shadow: <ShadowControl />,
  perspective: <PerspectiveControl />,
  watermark: <WatermarkControl />,
};

export function EditorView({ initialConfig, serverId }: { initialConfig?: any, serverId?: string }) {
  const router = useRouter();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    if (!serverId) {
      // Direct visit to /editor without an ID means "New Mockup"
      const store = useEditorStore.getState();
      
      // Keep track of any pre-applied templates before resetting
      const preAppliedFrame = store.deviceFrame;
      
      store.reset();
      
      // If we had a template frame applied right before this (e.g. from Dashboard), restore it
      if (preAppliedFrame !== "none") {
        store.setDeviceFrame(preAppliedFrame);
      }
      
      const newId = crypto.randomUUID();
      store.setDesignId(newId);
      router.replace(`/editor?id=${newId}`);
    } else {
      // Existing design loading
      const currentId = useEditorStore.getState().designId;
      if (currentId !== serverId) {
        if (initialConfig) {
          useEditorStore.setState(initialConfig);
        } else {
          // If no initialConfig was found but an ID was provided, it's invalid. Reset.
          router.replace("/editor");
        }
      }
    }
  }, [serverId, initialConfig, router]);

  // Activate auto-save
  useAutoSave();

  return (
    <div className="flex h-dvh flex-col bg-linear-to-br from-orange-50/80 via-rose-50/40 to-violet-50/60">
      <EditorTopbar />

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Preview area */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <PreviewCanvas />
        </div>

        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-[45vh] lg:h-full lg:w-85 shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-200/60 bg-white/80 backdrop-blur-xl z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] lg:shadow-none"
        >
          <ControlsSidebar sectionContent={sectionContent} />
        </motion.aside>
      </div>
    </div>
  );
}
