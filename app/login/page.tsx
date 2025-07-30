"use client";
import { useEffect } from "react";
import { guard } from "@/lib/auth-graud/config";

export default function LoginPage() {
  useEffect(() => {
    // 确保只在客户端环境中调用
    if (typeof window !== "undefined") {
      guard.startWithRedirect();
    }
  }, []);

  return (
    <div className="min-h-screen-dynamic flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <h2 className="text-xl font-semibold">正在跳转到登录页</h2>
        <p className="text-muted-foreground">请稍候，正在为您准备登录界面...</p>
      </div>
    </div>
  );
}
