"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { guard } from "@/lib/auth-graud/config";
import { APP_NAME } from "@/lib/client-config";

export default function LoginPage() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // 设置页面标题
    document.title = `登录 - ${APP_NAME}`;
    
    // 确保只在客户端环境中调用
    if (typeof window !== "undefined") {
      // 获取回调 URL
      const callbackUrl = searchParams.get('callbackUrl');
      
      if (callbackUrl) {
        console.log(`🔗 保存登录前的访问路径: ${callbackUrl}`);
        // 将回调 URL 保存到 sessionStorage
        sessionStorage.setItem('login_callback_url', callbackUrl);
      }
      
      guard.startWithRedirect();
    }
  }, [searchParams]);

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
