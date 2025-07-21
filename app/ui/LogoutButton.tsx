"use client";

import { useRouter } from "next/navigation";
import {
  API_ROUTES,
  AUTHING_ROUTES,
  SPECIAL_ROUTES,
} from "@/lib/routes.config";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      console.log("🚀 开始登出流程...");

      // 1. 调用 Authing 服务端登出
      const authLogout = await fetch(AUTHING_ROUTES.LOGOUT, {
        method: "GET",
        credentials: "include", // 包含 cookies
      });

      // 2. 调用本地 API 清除 cookie
      const apiLogout = await fetch(API_ROUTES.AUTH.LOGOUT, {
        method: "POST",
      });

      console.log("🔍 Authing 登出结果:", authLogout.ok);
      console.log("🔍 本地 API 登出结果:", apiLogout.ok);

      // 3. 清除客户端存储
      if (typeof window !== "undefined") {
        // 清除 Authing 相关的 localStorage
        localStorage.removeItem("_authing_token");
        localStorage.removeItem("_authing_user");
        localStorage.removeItem("_authing_session");

        // 清除其他可能的认证相关存储
        sessionStorage.clear();

        console.log("✅ 客户端存储已清除");
      }

      // 4. 重定向到首页
      router.replace(SPECIAL_ROUTES.LOGIN);
    } catch (error) {
      console.error("❌ 登出请求失败:", error);

      // 即使网络错误，也清除客户端存储
      if (typeof window !== "undefined") {
        localStorage.removeItem("_authing_token");
        localStorage.removeItem("_authing_user");
        localStorage.removeItem("_authing_session");
        sessionStorage.clear();
      }

      // 重定向到首页
      router.replace(SPECIAL_ROUTES.LOGIN);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
    >
      退出登录
    </button>
  );
}
