"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { debugModeManager } from "@/lib/vconsole-manager";

/**
 * vConsole 主题监听器
 * 监听主题变化并自动更新 vConsole 主题
 */
export function VConsoleThemeListener() {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return;

    // 获取实际的主题（考虑 system 模式）
    const actualTheme = resolvedTheme as 'light' | 'dark' || 'dark';
    
    // 如果 vConsole 已初始化，更新主题
    if (debugModeManager.getVConsoleManager().isInitialized()) {
      const currentTheme = debugModeManager.getVConsoleManager().getCurrentTheme();
      
      // 只有当主题真正改变时才更新
      if (currentTheme !== actualTheme) {
        console.log(`🎨 检测到主题变化: ${currentTheme} -> ${actualTheme}`);
        debugModeManager.getVConsoleManager().updateTheme(actualTheme);
      }
    }
  }, [theme, resolvedTheme]);

  // 这个组件不渲染任何内容
  return null;
} 