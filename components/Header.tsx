"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
// import Link from "next/link";
import {
  LogOut,
  User,
  Settings,
  Loader2,
  LogIn,
  Home,
  Heart,
  Map,
  Coins,
  QrCode,
  Trophy,
  Receipt,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SPECIAL_ROUTES } from "@/lib/routes.config";
import { useUser } from "@/components/UserProvider";
import { useLogout } from "@/hooks/useLogout";
import { QRCodeSVG } from "qrcode.react";

export function Header() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showCoinDialog, setShowCoinDialog] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isNavigatingHome, setIsNavigatingHome] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { logout } = useLogout();
  const [userCoins, setUserCoins] = useState<number | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [coinsLoading, setCoinsLoading] = useState(false);

  // 监听用户状态变化，重置登录按钮状态
  useEffect(() => {
    console.log("🔄 Header: 用户状态变化", {
      user: !!user,
      loading,
      isLoginLoading,
    });

    // 只有在用户状态真正发生变化且不在主动登录过程中时才重置
    if (!user && !loading && !isLoginLoading) {
      console.log("🔄 Header: 重置登录按钮状态");
      setIsLoginLoading(false);
    }
  }, [user, loading, isLoginLoading]); // 添加 isLoginLoading 依赖

  // 添加一个安全机制，如果按钮状态卡住超过8秒，强制重置
  useEffect(() => {
    if (isLoginLoading) {
      const timer = setTimeout(() => {
        console.log("⚠️ Header: 登录按钮状态卡住超过8秒，强制重置");
        setIsLoginLoading(false);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [isLoginLoading]);

  const handleLoginClick = async () => {
    console.log("🔄 Header: 点击登录按钮", {
      isLoginLoading,
      user,
      loading,
    });

    // 防止重复点击
    if (isLoginLoading) {
      console.log("⚠️ Header: 登录按钮正在加载中，忽略点击");
      return;
    }

    // 立即设置加载状态
    setIsLoginLoading(true);
    console.log("🔄 Header: 设置登录按钮为加载状态");

    try {
      // 先等待一小段时间，确保用户能看到加载状态的变化
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 使用 router.push 进行客户端路由跳转
      console.log("🔄 Header: 跳转到登录页面", SPECIAL_ROUTES.LOGIN);

      // 使用 setTimeout 确保状态更新完成后再跳转
      setTimeout(() => {
        router.push(SPECIAL_ROUTES.LOGIN);
      }, 200);
    } catch (error) {
      console.error("❌ Header: 跳转登录页面失败", error);
      // 如果 router.push 失败，回退到 window.location.href
      window.location.href = SPECIAL_ROUTES.LOGIN;
    }
  };

  const handleHomeClick = () => {
    // 防止重复点击
    if (isNavigatingHome || isPending) {
      console.log("⚠️ Header: 正在导航中，忽略点击");
      return;
    }

    console.log("🏠 Header: 点击首页按钮");

    // 立即设置导航状态，提供即时视觉反馈
    setIsNavigatingHome(true);

    // 使用 startTransition 来标记这是一个非紧急的状态更新
    startTransition(() => {
      // 跳转到首页
      router.push(SPECIAL_ROUTES.DEFAULT_HOME);
    });

    // 导航完成后重置状态（设置较短的超时时间以优化体验）
    setTimeout(() => {
      setIsNavigatingHome(false);
    }, 1000);
  };

  // 获取用户游戏币信息
  const fetchUserCoins = async () => {
    if (!user) {
      console.error("用户未登录");
      return;
    }

    setCoinsLoading(true);
    try {
      console.log("🪙 正在获取用户游戏币信息...");
      // 不传 userId，让 API 从认证信息自动获取并同步用户
      const response = await fetch("/api/user/profile");
      const data = await response.json();

      console.log("📊 用户资料响应:", data);

      if (data.success) {
        setUserCoins(data.data.user.coins);
        setUserRank(data.data.rank);
        console.log("✅ 游戏币信息获取成功:", {
          coins: data.data.user.coins,
          rank: data.data.rank,
        });
      } else {
        console.error("❌ 获取用户资料失败:", data.error);
      }
    } catch (error) {
      console.error("❌ 获取用户游戏币信息失败:", error);
    } finally {
      setCoinsLoading(false);
    }
  };

  // 打开游戏币弹窗时获取最新游戏币信息
  const handleCoinDialogOpen = () => {
    setShowCoinDialog(true);
    fetchUserCoins();
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div
          className={`flex items-center space-x-2 cursor-pointer transition-all duration-300 ${
            isNavigatingHome || isPending
              ? "scale-95 opacity-60 cursor-wait"
              : "hover:scale-105 active:scale-95 hover:text-primary"
          }`}
          onClick={handleHomeClick}
          title={isNavigatingHome || isPending ? "跳转中..." : "返回首页"}
        >
          {isNavigatingHome || isPending ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Home className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
          )}
        </div>

        {/* 右侧控制按钮 */}
        <div className="flex items-center space-x-3">
          {/* 主题切换 */}
          <ModeToggle />

          {/* 游戏币按钮 - 只在用户登录时显示 */}
          {!loading && user && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCoinDialogOpen}
              className="flex items-center space-x-2 h-9 px-3 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <QrCode className="h-4 w-4 text-gray-800 dark:text-gray-200 transition-transform duration-200" />
            </Button>
          )}

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
                {user.isAdmin ? (
                  <DropdownMenuItem
                    onClick={() => router.push(SPECIAL_ROUTES.SETTING)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    设置
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onClick={() => router.push(SPECIAL_ROUTES.DEFAULT_REDIRECT)}
                >
                  <span className="relative inline-flex items-center gap-2 w-full">
                    <Heart className="mr-2 h-4 w-4 fill-current text-pink-500 animate-pulse" />
                    <span className="rainbow-gradient text-white font-bold px-2 py-1 rounded-md w-full">
                      前往活动 ！
                    </span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(SPECIAL_ROUTES.MAP)}
                >
                  <Map className="mr-2 h-4 w-4 text-primary" />
                  地图探索
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/leaderboard")}>
                  <Trophy className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-500" />
                  游戏币排行榜
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/coin-history")}>
                  <Receipt className="mr-2 h-4 w-4 text-emerald-500" />
                  我的游戏币明细
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
              className={`h-9 px-3 transition-all duration-300 ease-out ${
                isLoginLoading
                  ? "scale-95 opacity-75 bg-primary/20 border-primary/40 cursor-not-allowed"
                  : "hover:scale-105 active:scale-95 hover:shadow-lg hover:bg-primary hover:text-primary-foreground"
              }`}
            >
              {isLoginLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2 transition-all duration-200" />
                  <span className="transition-all duration-200 font-medium">
                    跳转中...
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2 transition-transform duration-200 hover:rotate-12" />
                  <span className="transition-all duration-200">登录</span>
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
              您确定要退出登录吗？
              <br />
              退出后需要重新登录才能访问您的账户。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                logout();
                setShowLogoutDialog(false);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              确认退出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 游戏币和二维码弹窗 */}
      <Dialog open={showCoinDialog} onOpenChange={setShowCoinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-500" />
              我的游戏币
            </DialogTitle>
            <DialogDescription>
              查看您的游戏币余额和个人二维码
              <br />
              （管理员可扫码进行操作）
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-6 py-4">
            {/* 二维码 */}
            <div className="relative">
              <div className="p-4 bg-white rounded-lg shadow-lg">
                <QRCodeSVG
                  value={`${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }/admin-panel?userId=${user?.data?.dbId || user?.id || ""}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-2 shadow-lg">
                <Coins className="h-4 w-4" />
              </div>
            </div>

            {/* 用户信息 */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.name || user?.username || "用户"}</span>
              </div>

              {/* 游戏币信息 */}
              {coinsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    加载中...
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 游戏币余额 */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-medium">游戏币数量</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {userCoins !== null ? userCoins.toLocaleString() : "--"}
                    </span>
                  </div>

                  {/* 排名 */}
                  {userRank !== null && (
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950 rounded-lg border border-teal-200 dark:border-teal-800">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">我的排名</span>
                      </div>
                      <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                        第 {userRank} 名
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 查看明细按钮 */}
            <Button
              variant="outline"
              className="w-full border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              onClick={() => {
                setShowCoinDialog(false);
                router.push("/coin-history");
              }}
            >
              <Receipt className="mr-2 h-4 w-4" />
              查看收支明细
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
