"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// 定义vConsole接口
interface VConsoleInstance {
  destroy: () => void;
}

// 扩展Window接口以包含vConsole和调试工具
declare global {
  interface Window {
    vConsole?: VConsoleInstance;
    clearDebugMode?: () => void;
  }
}

// 调试模式的 sessionStorage key
const DEBUG_MODE_KEY = 'debug_mode_enabled';

// 清除调试模式的工具函数
function clearDebugMode() {
  if (typeof window === 'undefined') return;
  
  // 移除vConsole
  if (window.vConsole) {
    window.vConsole.destroy();
    window.vConsole = undefined;
    console.log("🔧 手动清除调试模式，vConsole 已移除");
  }
  
  // 清除sessionStorage中的调试模式标记
  sessionStorage.removeItem(DEBUG_MODE_KEY);
  console.log("🔧 调试模式已从 sessionStorage 中清除");
  
  // 刷新页面以完全清除调试状态
  window.location.reload();
}

function DebugInitializerContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return;

    // 将清除调试模式的函数暴露给全局
    window.clearDebugMode = clearDebugMode;

    // 检查URL中是否包含debug=true参数
    const debugMode = searchParams.get("debug");
    
    // 如果URL中有debug=true参数，写入sessionStorage
    if (debugMode) {
      console.log(`🔧 URL中检测到debug参数: ${debugMode}`);
      sessionStorage.setItem(DEBUG_MODE_KEY, debugMode);
    }

    // 从sessionStorage读取调试模式状态
    const isDebugModeEnabled = sessionStorage.getItem(DEBUG_MODE_KEY) === 'true';
    
    if (isDebugModeEnabled) {
      console.log("🔧 调试模式已启用（来自sessionStorage），正在加载 vConsole...");
      
      // 动态导入vConsole
      import("vconsole").then((VConsole) => {
        // 检查是否已经初始化过vConsole
        if (!window.vConsole) {
          const vConsole = new VConsole.default({
            theme: "dark", // 使用暗色主题
            defaultPlugins: ["system", "network", "element", "storage"], // 默认插件
            maxLogNumber: 1000, // 最大日志数量
            onReady: () => {
              console.log("✅ vConsole 已准备就绪");
              console.log("💡 如需关闭调试模式，可在控制台执行: window.clearDebugMode()");
            },
            onClearLog: () => {
              console.log("🧹 日志已清除");
            },
          });
          
          // 将vConsole实例保存到window对象上，避免重复初始化
          window.vConsole = vConsole;
          
          console.log("🎉 vConsole 调试工具已加载完成");
          console.log("📱 在移动设备上点击右下角的 vConsole 图标来打开调试面板");
          console.log("💻 在桌面设备上按 F12 或右键检查元素来查看调试信息");
          console.log("🔧 如需关闭调试模式，可在控制台执行: window.clearDebugMode()");
        } else {
          console.log("⚠️ vConsole 已经初始化过了");
        }
      }).catch((error) => {
        console.error("❌ 加载 vConsole 失败:", error);
      });
    } else {
      // 如果不在调试模式，移除已存在的vConsole
      if (window.vConsole) {
        window.vConsole.destroy();
        window.vConsole = undefined;
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