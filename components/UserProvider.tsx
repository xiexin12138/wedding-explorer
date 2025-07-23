"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { API_ROUTES, SPECIAL_ROUTES } from "@/lib/routes.config";
import { guard } from "@/lib/auth-graud/config";

interface User {
  name?: string;
  email?: string;
  id?: string;
  username?: string;
  data: {
    [key: string]: string | number | boolean | undefined;
  };
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = async () => {
    try {
      console.log("🚀 开始登出流程...");

      // 立即清除用户状态，确保 UI 立即更新
      setUser(null);
      setLoading(true); // 重新设置加载状态

      // 1. 调用 Authing 服务端登出
      guard.logout();

      // 2. 调用本地 API 清除 cookie
      const apiLogout = await fetch(API_ROUTES.AUTH.LOGOUT, {
        method: "POST",
      });

      console.log("🔍 本地 API 登出结果:", apiLogout.ok);

      // 3. 清除客户端存储
      if (typeof window !== "undefined" && localStorage) {
        // 清除 Authing 相关的 localStorage
        localStorage.removeItem("_authing_token");
        localStorage.removeItem("_authing_user");
        localStorage.removeItem("_authing_session");

        // 清除其他可能的认证相关存储
        // sessionStorage.clear();

        console.log("✅ 客户端存储已清除");
      }

      // 4. 完成加载状态
      setLoading(false);

      // 5. 重定向到默认页
      router.replace(SPECIAL_ROUTES.DEFAULT_HOME);
    } catch (error) {
      console.error("❌ 登出请求失败:", error);

      // 即使网络错误，也清除客户端存储和用户状态
      if (typeof window !== "undefined" && localStorage) {
        localStorage.removeItem("_authing_token");
        localStorage.removeItem("_authing_user");
        localStorage.removeItem("_authing_session");
        // sessionStorage.clear();
      }

      // 确保用户状态被清除
      setUser(null);
      setLoading(false);

      // 重定向到默认页
      router.replace(SPECIAL_ROUTES.DEFAULT_HOME);
    }
  };

  useEffect(() => {
    // 检查用户登录状态
    const checkAuth = async () => {
      try {
        console.log("🔍 开始检查用户登录状态...");
        const response = await fetch(API_ROUTES.AUTH.CHECK, {
          method: "GET",
          credentials: "include", // 确保发送 cookies
        });

        console.log("📡 API 响应状态:", response.status);

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
        console.log("🏁 用户状态检查完成");
      }
    };

    checkAuth();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, logout }}>
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
