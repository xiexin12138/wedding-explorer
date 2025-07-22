"use client";

import { useEffect } from "react";

export function useViewportHeight() {
  useEffect(() => {
    const setRealHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // 初始设置
    setRealHeight();

    // 监听窗口大小变化
    window.addEventListener('resize', setRealHeight);
    
    // 监听设备方向变化
    window.addEventListener('orientationchange', setRealHeight);

    // 清理事件监听器
    return () => {
      window.removeEventListener('resize', setRealHeight);
      window.removeEventListener('orientationchange', setRealHeight);
    };
  }, []);
} 