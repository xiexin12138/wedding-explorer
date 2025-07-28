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
  origin = { x: 0.5, y: 0.6 }
}: ConfettiEffectProps) {
  const { user, loading } = useUser();
  
  useEffect(() => {
    // 只有在用户已登录且不在加载状态时才显示confetti
    if (trigger && user && !loading) {
      // 单次爆发效果，增加初始速度让confetti飞得更高，延长掉落时间
        const defaults = { startVelocity: 60, spread, ticks: 160, zIndex: 9999 };

      // 从左下角发射
      confetti({
        ...defaults,
        particleCount: particleCount / 2,
        origin: { x: 0.1, y: 0.9 }, // 左下角位置
        angle: 60, // 向右上方发射
        colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7']
      });
      
      // 从右下角发射
      confetti({
        ...defaults,
        particleCount: particleCount / 2,
        origin: { x: 0.9, y: 0.9 }, // 右下角位置
        angle: 120, // 向左上方发射
        colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7']
      });
    }
  }, [trigger, particleCount, spread, origin, user, loading]);

  return null;
}