"use client";

import { useEffect } from "react";

// 声明全局类型
declare global {
  interface Window {
    vConsole?: {
      destroy: () => void;
      show: () => void;
      hide: () => void;
      setOption: (key: string, value: unknown) => void;
    };
    // 全局调试工具
    enableDebugMode: () => Promise<void>;
    clearDebugMode: () => void;
    toggleDebugMode: () => Promise<void>;
    getDebugStatus: () => boolean;
    showVConsole: () => void;
    hideVConsole: () => void;
    updateVConsoleTheme: (theme: "light" | "dark") => void;
  }
}

// 调试模式的 sessionStorage key
const DEBUG_MODE_KEY = "debug_mode_enabled";

// 日志缓冲区
const LOG_BUFFER: Array<{
  type: string;
  content: unknown[];
  timestamp: number;
}> = [];
const MAX_LOG_BUFFER_SIZE = 1000;

// 添加日志到缓冲区
function addToLogBuffer(type: string, ...args: unknown[]) {
  LOG_BUFFER.push({
    type,
    content: args,
    timestamp: Date.now(),
  });

  // 限制缓冲区大小
  if (LOG_BUFFER.length > MAX_LOG_BUFFER_SIZE) {
    LOG_BUFFER.shift();
  }
}

// 输出缓存的日志
function outputCachedLogs() {
  if (LOG_BUFFER.length > 0) {
    console.log(`📋 输出 ${LOG_BUFFER.length} 条缓存的日志:`);
    LOG_BUFFER.forEach((log) => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      console.log(`[${time}] ${log.type.toUpperCase()}:`, ...log.content);
    });
  }
}

// 检测当前主题
function detectCurrentTheme(): "light" | "dark" {
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  }
  return "light";
}

// 初始化全局调试工具
function initGlobalDebugTools() {
  // 启用调试模式
  window.enableDebugMode = async () => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(DEBUG_MODE_KEY, "true");
    }

    if (!window.vConsole) {
      try {
        // 动态导入 VConsole
        const VConsoleModule = await import("vconsole");
        const VConsole = VConsoleModule.default;
        
        // 初始化 vConsole
        const theme = detectCurrentTheme();
        window.vConsole = new VConsole({
          theme: theme,
          maxLogNumber: 10000,
          // 禁用网络面板
          onReady: () => {
            console.log("vConsole 初始化完成");
            outputCachedLogs();
          },
          // 配置面板选项 - 只启用系统、元素、存储面板，禁用网络面板
          defaultPlugins: ["system", "storage"],
        });
      } catch (error) {
        console.error("VConsole 初始化失败:", error);
      }
    }

    console.log("调试模式已启用");
  };

  // 清除调试模式
  window.clearDebugMode = () => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(DEBUG_MODE_KEY);
    }
    if (window.vConsole) {
      window.vConsole.destroy();
      window.vConsole = undefined;
    }
    console.log("调试模式已清除，请刷新页面");
  };

  // 切换调试模式
  window.toggleDebugMode = async () => {
    const isEnabled = window.getDebugStatus();
    if (isEnabled) {
      window.clearDebugMode();
    } else {
      await window.enableDebugMode();
    }
  };

  // 获取调试状态
  window.getDebugStatus = () => {
    if (typeof sessionStorage !== "undefined") {
      return sessionStorage.getItem(DEBUG_MODE_KEY) === "true";
    }
    return false;
  };

  // 显示 vConsole
  window.showVConsole = () => {
    if (window.vConsole) {
      window.vConsole.show();
    }
  };

  // 隐藏 vConsole
  window.hideVConsole = () => {
    if (window.vConsole) {
      window.vConsole.hide();
    }
  };

  // 更新 vConsole 主题
  window.updateVConsoleTheme = (theme: "light" | "dark") => {
    if (window.vConsole) {
      window.vConsole.setOption("theme", theme);
    }
  };
}

// 重写 console 方法以收集日志
function setupLogCapture() {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;

  console.log = (...args) => {
    addToLogBuffer("log", ...args);
    originalLog.apply(console, args);
  };

  console.warn = (...args) => {
    addToLogBuffer("warn", ...args);
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    addToLogBuffer("error", ...args);
    originalError.apply(console, args);
  };

  console.info = (...args) => {
    addToLogBuffer("info", ...args);
    originalInfo.apply(console, args);
  };
}

export function VConsoleLoader() {
  useEffect(() => {
    // 初始化全局调试工具
    initGlobalDebugTools();

    // 设置日志捕获
    setupLogCapture();

    // 检查是否需要启用调试模式
    const shouldEnableDebug = () => {
      // 检查 URL 参数
      const urlParams = new URLSearchParams(window.location.search);
      const debugParam = urlParams.get("debug");

      if (debugParam) {
        // 如果 URL 中有 debug 参数，写入 sessionStorage
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(DEBUG_MODE_KEY, debugParam);
        }
        return debugParam === "true";
      }

      // 检查 sessionStorage
      if (typeof sessionStorage !== "undefined") {
        return sessionStorage.getItem(DEBUG_MODE_KEY) === "true";
      }
      return false;
    };

    // 只在需要时初始化 vConsole
    if (shouldEnableDebug()) {
      // 延迟初始化，确保组件已挂载
      window.enableDebugMode();
    } else {
      // 如果不需要调试模式，销毁现有实例
      if (window.vConsole) {
        window.vConsole.destroy();
        window.vConsole = undefined;
      }
    }
  }, []);

  return null; // 这个组件不需要渲染任何内容
}
