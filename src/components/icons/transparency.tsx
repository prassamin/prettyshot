import React from "react";

export function TransparencyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <rect x="1" y="1" width="3.5" height="3.5" fill="currentColor" opacity="0.45" />
      <rect x="8" y="1" width="3.5" height="3.5" fill="currentColor" opacity="0.45" />
      <rect x="4.5" y="4.5" width="3.5" height="3.5" fill="currentColor" opacity="0.45" />
      <rect x="11.5" y="4.5" width="3.5" height="3.5" fill="currentColor" opacity="0.45" />
      <rect x="1" y="8" width="3.5" height="3.5" fill="currentColor" opacity="0.45" />
      <rect x="8" y="8" width="3.5" height="3.5" fill="currentColor" opacity="0.45" />
      <rect x="4.5" y="11.5" width="3.5" height="3.5" fill="currentColor" opacity="0.45" />
      <rect x="11.5" y="11.5" width="3.5" height="3.5" fill="currentColor" opacity="0.45" />
    </svg>
  );
}
