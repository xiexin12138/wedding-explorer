"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { debugModeManager, setupGlobalDebugTools } from "@/lib/vconsole-manager";

// 调试模式的 sessionStorage key
const DEBUG_MODE_KEY = 'debug_mode_enabled';

function DebugInitializerContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return;

    // 设置全局调试工具
    setupGlobalDebugTools();

    // 检查URL中是否包含debug参数
    const debugMode = searchParams.get("debug");
    
    // 如果URL中有debug参数，写入sessionStorage
    if (debugMode) {
      console.log(`🔧 URL中检测到debug参数: ${debugMode}`);
      sessionStorage.setItem(DEBUG_MODE_KEY, debugMode);
    }

    // 检查调试模式状态并初始化
    const isDebugModeEnabled = debugModeManager.isDebugModeEnabled();
    
    if (isDebugModeEnabled) {
      console.log("🔧 调试模式已启用，正在初始化 vConsole...");
      
      // 异步初始化 vConsole
      debugModeManager.enableDebugMode().catch((error) => {
        console.error("❌ 初始化调试模式失败:", error);
      });
    } else {
      // 如果不在调试模式，确保 vConsole 被销毁
      if (debugModeManager.getVConsoleManager().isInitialized()) {
        debugModeManager.getVConsoleManager().destroyVConsole();
        console.log("🔧 调试模式已关闭，vConsole 已移除");
      }
      
      // 清除sessionStorage中的调试模式标记
      sessionStorage.removeItem(DEBUG_MODE_KEY);
    }
  }, [searchParams]);

  // 这个组件不渲染任何内容，只负责初始化调试功能
  return null;
}

export function DebugInitializer() {
  return (
    <Suspense fallback={null}>
      <DebugInitializerContent />
    </Suspense>
  );
} 