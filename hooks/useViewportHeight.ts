"use client";

import { useEffect, useRef } from "react";

export function useViewportHeight() {
  const lastHeight = useRef<number>(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 确保只在客户端执行
    if (typeof window === 'undefined') return;
    
    const setRealHeight = () => {
      const currentHeight = window.innerHeight;
      
      // 如果高度变化很小（小于 50px），则忽略，避免微小变化导致的突变
      if (Math.abs(currentHeight - lastHeight.current) < 50) {
        return;
      }
      
      // 防抖处理，避免频繁更新
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = setTimeout(() => {
        const vh = currentHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        lastHeight.current = currentHeight;
      }, 100); // 100ms 防抖
    };

    // 初始设置
    setRealHeight();

    // 监听窗口大小变化
    window.addEventListener('resize', setRealHeight);
    
    // 监听设备方向变化
    window.addEventListener('orientationchange', setRealHeight);

    // 清理事件监听器和定时器
    return () => {
      window.removeEventListener('resize', setRealHeight);
      window.removeEventListener('orientationchange', setRealHeight);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);
}