"use client";

import { useState, useEffect, useRef } from "react";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { AppStoreContext, createAppStore, User } from "@/stores/app-store";

export function Providers({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: User;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const storeRef = useRef<ReturnType<typeof createAppStore>>(undefined);

  if (!storeRef.current) {
    storeRef.current = createAppStore({ user });
  }

  useEffect(() => {
    if (storeRef.current) {
      storeRef.current.getState().setOrigin(window.location.origin);
      storeRef.current.getState().setUrl(new URL(window.location.href));
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppStoreContext.Provider value={storeRef.current}>
        <ProgressProvider
          height="3px"
          color="var(--accent)"
          options={{ showSpinner: false }}
          shallowRouting
        >
          {children}
          <VercelAnalytics />
        </ProgressProvider>
      </AppStoreContext.Provider>
    </QueryClientProvider>
  );
}
