"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { API_ROUTES, SPECIAL_ROUTES } from "@/lib/routes.config";
import { useRequestTracker } from "@/hooks/useRequestTracker";
import { AUTHING_APP_HOST } from "@/lib/client-config";

interface User {
  name?: string;
  email?: string;
  id?: string;
  username?: string;
  isAdmin?: boolean;
  data: {
    [key: string]: string | number | boolean | undefined;
  };
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { postWithTracking, getWithTracking } = useRequestTracker();
  const isCheckingAuth = useRef(false);

  const logout = async () => {
    try {
      console.log("🚀 开始登出流程...");

      // 立即清除用户状态，确保 UI 立即更新
      setUser(null);
      setLoading(true); // 重新设置加载状态

      // 1.调用本地 API 清除 cookie（使用追踪功能）
      try {
        const apiLogout = await postWithTracking(
          API_ROUTES.AUTH.LOGOUT,
          undefined,
          {
            credentials: "include",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          }
        );
        console.log("🔍 本地 API 登出结果:", apiLogout.ok);
      } catch (apiError) {
        console.warn("⚠️ API 登出请求失败，但继续清除本地状态:", apiError);
      }

      // 3. 清除客户端存储
      if (typeof window !== "undefined" && localStorage) {
        // 清除 Authing 相关的 localStorage
        localStorage.removeItem("_authing_token");
        localStorage.removeItem("_authing_user");
        localStorage.removeItem("_authing_session");

        console.log("✅ 客户端存储已清除");
      }
      // 4. 完成加载状态
      setLoading(false);

      // 5. 调用 Authing 指定的 url 进行登出
      const redirectUri = `${AUTHING_APP_HOST}/login/profile/logout?redirect_uri=${encodeURIComponent(
        window.location.href
      )}`;
      window.location.href = redirectUri;
    } catch (error) {
      console.error("❌ 登出请求失败:", error);

      // 即使网络错误，也清除客户端存储和用户状态
      if (typeof window !== "undefined" && localStorage) {
        localStorage.removeItem("_authing_token");
        localStorage.removeItem("_authing_user");
        localStorage.removeItem("_authing_session");
      }

      // 确保用户状态被清除
      setUser(null);
      setLoading(false);

      // 使用硬重定向避免 React 相关错误
      if (typeof window !== "undefined") {
        window.location.href = SPECIAL_ROUTES.DEFAULT_HOME;
      } else {
        router.replace(SPECIAL_ROUTES.DEFAULT_HOME);
      }
    }
  };

  const checkAuth = useCallback(async () => {
    // 防止并发请求
    if (isCheckingAuth.current) {
      console.log("🔍 认证检查正在进行中，跳过重复请求");
      return;
    }
    
    isCheckingAuth.current = true;
    try {
      console.log("🔍 开始检查用户登录状态...");
      const response = await getWithTracking(API_ROUTES.AUTH.CHECK);

      console.log("📡 API 响应状态:", response);

      if (response.ok) {
        const data = await response.json();
        console.log("📦 API 返回数据:", data);

        if (data.user) {
          setUser(data.user);
          console.log("✅ 用户已登录:", data.user);
        } else {
          setUser(null);
          console.log("❌ 用户未登录");
        }
      } else {
        console.log("❌ 检查认证状态失败:", response.status);
        setUser(null);
      }
    } catch (error) {
      console.error("检查认证状态失败:", error);
      setUser(null);
    } finally {
      setLoading(false);
      isCheckingAuth.current = false;
      console.log("🏁 用户状态检查完成");
    }
  }, [getWithTracking]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <UserContext.Provider value={{ user, setUser, loading, logout, checkAuth }}>
      {children}
    </UserContext.Provider>
  );

}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
