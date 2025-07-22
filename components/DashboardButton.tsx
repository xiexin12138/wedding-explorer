"use client";

import { useUser } from "@/components/UserProvider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, User } from "lucide-react";
import { useState } from "react";

export function DashboardButton() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>正在检查登录状态...</span>
        </div>
        <Button disabled className="flex items-center space-x-2 w-full" size="lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>加载中...</span>
        </Button>
      </div>
    );
  }

  // 如果用户未登录，不显示按钮
  if (!user) {
    return null;
  }

  const handleClick = async () => {
    setIsNavigating(true);
    
    // 添加一个小延迟，让用户看到按钮状态变化
    await new Promise(resolve => setTimeout(resolve, 100));
    
    router.push("/dashboard");
  };

  return (
    <div className="space-y-3">
      {/* 用户信息显示 */}
      <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        <span>
          欢迎，{user.name || user.email || user.username || "用户"}
        </span>
      </div>
      
      {/* 按钮 */}
      <Button 
        onClick={handleClick}
        disabled={isNavigating}
        className="flex items-center space-x-2 w-full"
        size="lg"
      >
        {isNavigating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>跳转中...</span>
          </>
        ) : (
          <>
            <span>立即参加活动！</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
} 