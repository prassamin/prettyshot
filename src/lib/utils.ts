import { User } from "@/stores/app-store";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isPro(user?: any): { isActive: boolean; type: "free" | "trial" | "pro" } {
  if (!user) return { isActive: false, type: "free" };
  
  const rawTrialEndsAt = user.trial_ends_at || user.user_metadata?.trial_ends_at;
  const isTrialActive = rawTrialEndsAt
    ? new Date(rawTrialEndsAt) > new Date()
    : false;
    
  const isUserPro = user.is_pro === true || user.user_metadata?.is_pro === true;
    
  return {
    isActive: isUserPro || isTrialActive,
    type: isTrialActive ? "trial" : isUserPro ? "pro" : "free",
  };
}
