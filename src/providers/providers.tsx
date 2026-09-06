"use client";

import { useEffect, useRef } from "react";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { AppStoreContext, createAppStore, User } from "@/stores/app-store";
import { ConfirmProvider } from "@/components/confirm-provider";
import { Toast } from "@heroui/react";
import { usePathname } from "next/navigation";

// function RouteBodyAttributer() {
//   const pathname = usePathname();

//   useEffect(() => {
//     if (pathname) {
//       document.body.setAttribute("data-route", pathname);
//     }
//   }, [pathname]);

//   return null;
// }

export function Providers({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: User;
}) {
  const storeRef = useRef<ReturnType<typeof createAppStore>>(undefined);

  if (!storeRef.current) {
    storeRef.current = createAppStore({ user });
  }

  useEffect(() => {
    if (storeRef.current) {
      storeRef.current.getState().setOrigin(window.location.origin);
      storeRef.current.getState().setUrl(new URL(window.location.href));
      if (user) {
        storeRef.current.getState().setUser(user);
      }
    }
  }, [user]);

  return (
    <AppStoreContext.Provider value={storeRef.current}>
      <ProgressProvider
        height="3px"
        color="var(--primary)"
        options={{ showSpinner: false }}
        shallowRouting
      >
        {/* <RouteBodyAttributer /> */}
        <ConfirmProvider>
          {children}
          <Toast.Provider placement="top" />
          <VercelAnalytics />
        </ConfirmProvider>
      </ProgressProvider>
    </AppStoreContext.Provider>
  );
}
