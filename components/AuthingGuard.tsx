"use client";

import { useGuard, User } from "@authing/guard-react18";
import { useEffect, useRef, useState } from "react";

const CDN_CSS = "https://cdn.authing.co/packages/guard/latest/guard.min.css";

export default function AuthingGuard() {
  const guard = useGuard();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // 确保只在客户端运行
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // 防止 SSR 阶段运行
    if (!isClient || typeof window === "undefined") return;

    // 1. 插入 CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CDN_CSS;
    document.head.appendChild(link);

    // 2. 启动 Guard
    guard.start(containerRef.current!).then((userInfo: User) => {
      console.log("✅ 登录成功", userInfo);
      setIsLoading(false);
    }).catch((error) => {
      console.error("❌ Authing 初始化失败:", error);
      setIsLoading(false);
    });

    // 3. 组件卸载时清理
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [guard, isClient]);

  // 在服务器端和客户端水合期间显示一致的加载状态
  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white text-lg">正在加载登录...</div>
      </div>
    );
  }

  return <div ref={containerRef} />;
}
