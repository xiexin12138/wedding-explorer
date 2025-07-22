"use client";

import { ReactNode } from "react";
import { useViewportHeight } from "@/hooks/useViewportHeight";

interface ViewportHeightProviderProps {
  children: ReactNode;
}

export function ViewportHeightProvider({ children }: ViewportHeightProviderProps) {
  useViewportHeight();
  
  return <>{children}</>;
} 