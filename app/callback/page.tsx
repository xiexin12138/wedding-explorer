"use client";

import { JwtTokenStatus, User } from "@authing/guard-react18";
import { useUser } from "@/components/UserProvider";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { API_ROUTES, SPECIAL_ROUTES } from "@/lib/routes.config";
import { guard } from "@/lib/auth-graud/config";
import { useRequestTracker } from "@/hooks/useRequestTracker";

export default function Callback() {
  const { checkAuth } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { postWithTracking } = useRequestTracker();
  const hasProcessed = useRef(false);

  const handleCallback = useCallback(async () => {
    // 防止重复执行
    if (hasProcessed.current) {
      console.log("🔄 回调处理已经执行过，跳过重复执行");
      return;
    }
    
    hasProcessed.current = true;
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

      // 4. 将认证信息发送到服务端设置 httpOnly cookie（使用追踪功能）
      const response = await postWithTracking(
        API_ROUTES.AUTH.SET_SESSION,
        JSON.stringify({
          userInfo,
        }),
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`服务端会话设置失败: ${response.status}`);
      }

      console.log("✅ 服务端会话设置成功");

      // 5. 触发 UserProvider 中的 checkAuth 来更新全局用户状态
      await checkAuth();

      console.log("✅ 用户状态更新成功，准备跳转到默认页面");

      // 6. 跳转到默认页面
      router.push(SPECIAL_ROUTES.DEFAULT_HOME);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "未知错误";
      console.error("❌ Authing 回调处理失败:", e);
      setError(errorMessage);

      // 清空登录态
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        // 清除 Authing 相关的 localStorage
        localStorage.removeItem("_authing_token");
        localStorage.removeItem("_authing_user");
        localStorage.removeItem("_authing_session");
        console.log("✅ 客户端存储已清除");
      }

      // 调用 Authing 登出
      guard.logout();

      // 调用服务端登出 API 清除 cookie（使用追踪功能）
      try {
        await postWithTracking(API_ROUTES.AUTH.LOGOUT);
        console.log("✅ 服务端会话已清除");
      } catch (logoutError) {
        console.error("❌ 服务端登出失败:", logoutError);
      }

      // 触发 UserProvider 中的 checkAuth 来更新全局用户状态
      await checkAuth();

      // 错误情况下，延迟跳转到登录页
      setTimeout(() => {
        router.push(SPECIAL_ROUTES.LOGIN);
      }, 3000);
    }
  }, [router, checkAuth, postWithTracking]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]); // 添加依赖数组，确保只执行一次

  if (error) {
    return (
      <div className="min-h-screen-dynamic flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <div className="w-6 h-6 text-destructive">⚠️</div>
          </div>
          <h2 className="text-xl font-semibold text-destructive">认证失败</h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <p className="text-sm text-muted-foreground">
            3秒后自动跳转到登录页...
          </p>
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
