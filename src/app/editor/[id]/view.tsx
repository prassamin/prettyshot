"use client";

import * as React from "react";
import { Canvas } from "@/editor/canvas";
import { LeftSidebar } from "@/editor/sidebar/left-sidebar";
import { EditorErrorBoundary } from "@/editor/components/error-boundary";
import { FloatingToolbar } from "@/editor/toolbar";
import { PropertyPenel } from "@/editor/property-panel";
import { MobileToolbar } from "@/editor/mobile-toolbar";
import { AnimateBar, AnimationLayer } from "@/editor/animate";
import { PanelToolProvider } from "@/editor/providers/panel-tool-provider";
import { TopNavigationBar } from "@/editor/navbar";
import { useEditorEngine } from "@/editor/lib/engine";
import { cn } from "@/lib/utils";
import { Button } from "@heroui/react";
import { Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAutoSave } from "@/hooks/use-auto-save";
import { ShortcutsProvider } from "@/editor/providers/shortcuts-provider";
import { AnimationPlayerProvider } from "@/editor/animate/hooks/use-animation-player";
import { SplashScreen } from "@/editor/components/splash-screen";
import { rememberLocalDesign } from "@/editor/lib/local-design-storage";

export function EditorView({
  initialConfig,
  serverId,
}: {
  initialConfig?: any;
  serverId?: string;
}) {
  useAutoSave();

  const setDesignId = useEditorEngine((s) => s.setDesignId);
  const hydrate = useEditorEngine((s) => s.hydrate);

  // Splash screen: visible during initial React mount and hydration,
  // dismissing cleanly after initial preparation is completed.
  const [splashVisible, setSplashVisible] = React.useState(true);

  React.useEffect(() => {
    if (serverId) {
      setDesignId(serverId);
      // Only record in device's local designs cookie if this is a local-only design
      if (!initialConfig) {
        rememberLocalDesign(serverId);
      }
    }
    if (initialConfig) {
      hydrate(initialConfig, { resetHistory: true });
    }

    const timer = setTimeout(() => {
      setSplashVisible(false);
    }, 500);

    return () => {
      clearTimeout(timer);
      // On unmount (exiting editor to landing page/dashboard), reset store to pristine state
      useEditorEngine.getState().reset();
      useEditorEngine.getState().setDesignId(null);
    };
  }, [serverId, initialConfig, setDesignId, hydrate]);

  const isPreviewMode = useEditorEngine((s) => s.isPreviewMode);
  const isAnimateMode = useEditorEngine((s) => s.isAnimateMode);
  const setIsPreviewMode = useEditorEngine((s) => s.setIsPreviewMode);

  const hideEditorChrome = isPreviewMode;
  const hideBottomToolbar = isPreviewMode || false;

  return (
    <ShortcutsProvider>
      <AnimationPlayerProvider>
        <AnimatePresence>{splashVisible && <SplashScreen />}</AnimatePresence>
        <div className="fixed inset-0 flex min-h-0 flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
          {!hideEditorChrome && <TopNavigationBar />}
          <AnimatePresence>
            {isPreviewMode && (
              <motion.div
                key="exit-preview"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
              >
                <Button
                  onPress={() => {
                    setIsPreviewMode(false);
                  }}
                  className="h-10 cursor-pointer border border-foreground/15 bg-background/80 px-4 text-foreground shadow-xl backdrop-blur-md hover:bg-background/95"
                >
                  <Eye className="mr-2 size-4" />
                  Exit Preview
                  <kbd className="ml-2 rounded border border-foreground/15 bg-foreground/8 px-1.5 py-0.5 font-mono text-[10px] text-foreground/70">
                    Esc
                  </kbd>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <PanelToolProvider>
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
              {/* Desktop Left Tool Rail */}
              {!hideEditorChrome && <LeftSidebar className="hidden lg:flex" />}

              {/* Canvas Viewport */}
              <div
                className={cn(
                  "relative isolate flex min-h-0 flex-1 overflow-hidden",
                )}
              >
                <EditorErrorBoundary label="Canvas" resetKeys={[isPreviewMode]}>
                  <Canvas />
                </EditorErrorBoundary>
                {isAnimateMode && <AnimationLayer />}
                {isAnimateMode && !isPreviewMode && <AnimateBar />}
              </div>

              {/* Desktop Floating Action Toolbar */}
              {!hideBottomToolbar && !isAnimateMode && (
                <div className="hidden lg:block">
                  <FloatingToolbar />
                </div>
              )}

              {/* Desktop Right Property Panel */}
              {!isPreviewMode && <PropertyPenel className="hidden lg:flex" />}

              {/* Mobile & Tablet Bottom Controls */}
              {!hideBottomToolbar && !isAnimateMode && (
                <div className="lg:hidden">
                  <MobileToolbar />
                </div>
              )}
            </div>
          </PanelToolProvider>
        </div>
      </AnimationPlayerProvider>
    </ShortcutsProvider>
  );
}
