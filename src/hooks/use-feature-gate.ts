"use client";

import { useAppStore } from "@/stores/app-store";
import { isPro } from "@/lib/utils";
import { FEATURES, type FeatureId, type FeatureTier } from "@/config/features";
import { toast } from "@heroui/react";
import { APP_NAME } from "@/config";

export type FeatureGate = {
  /** True if the user can use this feature right now. */
  can: (id: FeatureId) => boolean;
  /** The tier of a feature ("free" | "pro") — for UI hints / badges. */
  tier: (id: FeatureId) => FeatureTier;
  /** True if the feature is paid AND the user hasn't unlocked it. */
  isLocked: (id: FeatureId) => boolean;
  /** True if the current user has Pro unlocked (paid or trial, or dev bypass). */
  isProActive: boolean;
  /**
   * Show a toast warning that the user needs to subscribe to unlock this feature.
   */
  message: () => void;
};

function buildGate(unlocked: boolean): FeatureGate {
  return {
    can: (id) => unlocked || FEATURES[id] === "free",
    tier: (id) => FEATURES[id],
    isLocked: (id) => FEATURES[id] === "pro" && !unlocked,
    isProActive: unlocked,
    message: () => {
      if (!unlocked) {
        toast.warning(`You need to subscribe to ${APP_NAME} Pro`);
      }
    },
  };
}

/**
 * Hook form — subscribes to the app store so the gate updates when the user
 * logs in / out or their license changes.
 */
export function useFeatureGate(): FeatureGate {
  const { user } = useAppStore();
  const pro = isPro(user);
  return buildGate(pro.isActive);
}

/**
 * Non-hook form — for stores, actions, and any non-React context. Pass the
 * user object you already have (e.g. from a server fetch or the app store's
 * state) to compute the gate without a React subscription.
 */
export function getFeatureGate(
  user?: { is_pro?: boolean; trial_ends_at?: string } | null,
): FeatureGate {
  return buildGate(isPro(user).isActive);
}
