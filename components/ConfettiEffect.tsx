"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useUser } from "@/components/UserProvider";

interface ConfettiEffectProps {
  trigger?: boolean;
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
}

export function ConfettiEffect({
  trigger = true,
  particleCount = 100,
  spread = 70,
  origin = { x: 0.5, y: 0.6 },
}: ConfettiEffectProps) {
  const { user, loading } = useUser();

  useEffect(() => {
    // 只有在用户已登录且不在加载状态时才显示confetti
    if (trigger && !loading) {
      // 创建爱心形状
      const heart = confetti.shapeFromPath({
        path: "M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z",
      });

      // 从顶部有力地喷出爱心confetti
      const defaults = {
        startVelocity: 30,
        spread: 160,
        ticks: 180,
        zIndex: 9999,
        scalar: 1.6,
        shapes: [heart],
        colors: [ "#fbbf24", "#f59e0b", "#ea580c"],
      };

      // 从顶部中央发射
      confetti({
        ...defaults,
        particleCount: particleCount,
        origin: { x: 0.5, y: 0 },
        angle: 270,
        gravity: 0.8,
      });
    }
  }, [trigger, particleCount, spread, origin, user, loading]);

  return null;
}
