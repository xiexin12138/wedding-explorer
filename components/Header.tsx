"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Settings, Loader2, LogIn, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SPECIAL_ROUTES } from "@/lib/routes.config";
import { useUser } from "@/components/UserProvider";
import { useLogout } from "@/hooks/useLogout";

export function Header() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const { logout } = useLogout();

  // 监听用户状态变化，重置登录按钮状态
  useEffect(() => {
    console.log("🔄 Header: 用户状态变化", {
      user: !!user,
      loading,
      isLoginLoading,
    });

    // 当用户未登录且不在加载状态时，重置登录按钮状态
    if (!user && !loading) {
      console.log("🔄 Header: 重置登录按钮状态");
      setIsLoginLoading(false);
    }
  }, [user, loading]);

  // 添加一个安全机制，如果按钮状态卡住超过3秒，强制重置
  useEffect(() => {
    if (isLoginLoading) {
      const timer = setTimeout(() => {
        console.log("⚠️ Header: 登录按钮状态卡住超过3秒，强制重置");
        setIsLoginLoading(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLoginLoading]);

  const handleLoginClick = async () => {
    console.log("🔄 Header: 点击登录按钮", {
      isLoginLoading,
      user: !!user,
      loading,
    });

    // 防止重复点击
    if (isLoginLoading) {
      console.log("⚠️ Header: 登录按钮正在加载中，忽略点击");
      return;
    }

    setIsLoginLoading(true);
    console.log("🔄 Header: 设置登录按钮为加载状态");

    try {
      // 使用 router.push 进行客户端路由跳转
      console.log("🔄 Header: 跳转到登录页面", SPECIAL_ROUTES.LOGIN);
      router.push(SPECIAL_ROUTES.LOGIN);
    } catch (error) {
      console.error("❌ Header: 跳转登录页面失败", error);
      // 如果 router.push 失败，回退到 window.location.href
      window.location.href = SPECIAL_ROUTES.LOGIN;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div
          className="flex items-center space-x-2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 hover:text-primary"
          onClick={() => {
            // 使用 router.push 进行客户端路由跳转
            router.push(SPECIAL_ROUTES.DEFAULT_HOME);
          }}
        >
          <Home className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
          <h1 className="text-xl font-semibold">Wedding Explorer</h1>
        </div>

        {/* 右侧控制按钮 */}
        <div className="flex items-center space-x-3">
          {/* 主题切换 */}
          <ModeToggle />

          {/* 用户菜单 */}
          {loading ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="animate-pulse transition-all duration-200"
            >
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              加载中...
            </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 h-9 px-3 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md"
                >
                  <User className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
                  <span
                    className="max-w-[80px] sm:max-w-[120px] md:max-w-[160px] truncate text-sm"
                    title={
                      user?.name || user?.email || user?.username || "用户"
                    }
                  >
                    {user?.name || user?.email || user?.username || "用户"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || user?.username || "用户"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  设置
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowLogoutDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoginClick}
              disabled={isLoginLoading}
              className="h-9 px-3 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:bg-primary hover:text-primary-foreground"
            >
              {isLoginLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  跳转中...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2 transition-transform duration-200 hover:rotate-12" />
                  登录
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 退出确认对话框 */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认退出</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要退出登录吗？退出后需要重新登录才能访问您的账户。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                logout();
                setShowLogoutDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认退出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
