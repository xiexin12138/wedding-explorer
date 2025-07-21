"use client";

import { GuardProvider } from "@authing/guard-react18";
import { ReactNode } from "react";
import { AUTHING_APP_ID } from "@/lib/client-config";

interface AuthingGuardWrapperProps {
  children: ReactNode;
}

export function AuthingGuardWrapper({ children }: AuthingGuardWrapperProps) {
  return (
    <GuardProvider
      appId={AUTHING_APP_ID}
      mode="modal"
      lang="zh-CN"
      // 如果你使用的是私有化部署的 Authing 服务，需要传入自定义 host，如:

      // 默认情况下，会使用你在 Authing 控制台中配置的第一个回调地址为此次认证使用的回调地址。
      // 如果你配置了多个回调地址，也可以手动指定（此地址也需要加入到应用的「登录回调 URL」中）：
      // redirectUri="YOUR_REDIRECT_URI"
    >
      {children}
    </GuardProvider>
  );
}
