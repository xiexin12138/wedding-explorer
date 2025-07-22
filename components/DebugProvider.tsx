"use client";

import { useEffect, ReactNode } from "react";
import { useSearchParams } from "next/navigation";

// 定义vConsole接口
interface VConsoleInstance {
  destroy: () => void;
}

// 扩展Window接口以包含vConsole
declare global {
  interface Window {
    vConsole?: VConsoleInstance;
  }
}

interface DebugProviderProps {
  children: ReactNode;
}

export function DebugProvider({ children }: DebugProviderProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // 检查URL中是否包含debug=true参数
    const debugMode = searchParams.get("debug");
    
    if (debugMode === "true") {
      console.log("🔧 调试模式已启用，正在加载 vConsole...");
      
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
    }
  }, [searchParams]);

  return <>{children}</>;
} 