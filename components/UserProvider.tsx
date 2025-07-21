"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查用户登录状态
    const checkAuth = async () => {
      try {
        console.log("🔍 开始检查用户登录状态...");
        const response = await fetch("/api/auth/check", {
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
            console.log("❌ 用户未登录");
          }
        } else {
          console.log("❌ 检查认证状态失败:", response.status);
        }
      } catch (error) {
        console.error("检查认证状态失败:", error);
      } finally {
        setLoading(false);
        console.log("🏁 用户状态检查完成");
      }
    };

    checkAuth();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
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
