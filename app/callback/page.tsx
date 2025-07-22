"use client";

import { JwtTokenStatus,  User } from "@authing/guard-react18";
import { useUser } from "@/components/UserProvider";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_ROUTES, SPECIAL_ROUTES } from "@/lib/routes.config";
import { guard } from "@/lib/auth-graud/config";

export default function Callback() {
  const { setUser } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleCallback = async () => {
    try {
      setError(null);

      console.log("🔄 开始处理 Authing 回调...");

      // 1. 触发 guard.handleRedirectCallback() 方法完成登录认证
      // 用户认证成功之后，我们会将用户的身份凭证存到浏览器的本地缓存中
      await guard.handleRedirectCallback();
      console.log("✅ handleRedirectCallback 完成");

      // 2. 处理完 handleRedirectCallback 之后，检查用户登录态是否正常
      const loginStatus: JwtTokenStatus | undefined =
        await guard.checkLoginStatus();

      if (!loginStatus) {
        throw new Error("Guard 无法获取登录状态");
      }

      console.log("✅ 登录状态检查通过");

      // 3. 获取到登录用户的用户信息
      const userInfo: User | null = await guard.trackSession();

      if (!userInfo) {
        throw new Error("无法获取用户信息");
      }

      console.log("✅ 用户信息获取成功:", userInfo);

      // 4. 将认证信息发送到服务端设置 httpOnly cookie
      const response = await fetch(API_ROUTES.AUTH.SET_SESSION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInfo,
        }),
      });

      if (!response.ok) {
        throw new Error(`服务端会话设置失败: ${response.status}`);
      }

      console.log("✅ 服务端会话设置成功");

      // 5. 更新客户端用户状态
      setUser({
        id: userInfo.id || undefined,
        name: userInfo.name || userInfo.nickname || undefined,
        email: userInfo.email || undefined,
        data: {
          phone: userInfo.phone || undefined,
          nickname: userInfo.nickname || undefined,
          username: userInfo.username || undefined,
          email: userInfo.email || undefined,
          // 添加其他可能的用户数据字段
          ...Object.fromEntries(
            Object.entries(userInfo).filter(([_, value]) => value != null)
          ),
        },
      });

      console.log("✅ 用户状态更新成功，准备跳转到默认页面");

      // 6. 跳转到默认页面
      router.push(SPECIAL_ROUTES.DEFAULT_HOME);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "未知错误";
      console.error("❌ Authing 回调处理失败:", e);
      setError(errorMessage);

      // 错误情况下，延迟跳转到登录页
      setTimeout(() => {
        router.push(SPECIAL_ROUTES.LOGIN);
      }, 3000);
    }
  };

  useEffect(() => {
    handleCallback();
  }, []); // 添加依赖数组，确保只执行一次

  if (error) {
    return (
      <div className="min-h-screen-dynamic flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <div className="w-6 h-6 text-destructive">⚠️</div>
          </div>
          <h2 className="text-xl font-semibold text-destructive">认证失败</h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <p className="text-sm text-muted-foreground">3秒后自动跳转到登录页...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-dynamic flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <h2 className="text-xl font-semibold">正在处理认证</h2>
        <p className="text-muted-foreground">请稍候，正在完成登录流程</p>
      </div>
    </div>
  );
}
