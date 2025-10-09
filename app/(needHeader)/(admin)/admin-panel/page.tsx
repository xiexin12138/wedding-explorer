"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/UserProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home, Loader2, Shield, User as UserIcon, Coins } from "lucide-react";
import { SPECIAL_ROUTES } from "@/lib/routes.config";

interface TargetUser {
  id: number;
  openid: string;
  name: string | null;
  email: string | null;
  username: string | null;
  coins: number;
  isAdmin: boolean;
  createdAt: string;
}

export default function AdminPanelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useUser();
  const [isChecking, setIsChecking] = useState(true);
  const [targetUser, setTargetUser] = useState<TargetUser | null>(null);
  const [loadingTargetUser, setLoadingTargetUser] = useState(false);
  const [targetUserError, setTargetUserError] = useState<string | null>(null);

  // 从 URL 获取目标用户 ID
  const targetUserId = searchParams.get('userId');

  useEffect(() => {
    // 等待用户信息加载完成
    if (!loading) {
      setIsChecking(false);
    }
  }, [loading]);

  // 获取目标用户信息
  useEffect(() => {
    const fetchTargetUser = async () => {
      if (!targetUserId || !user?.isAdmin) {
        return;
      }

      setLoadingTargetUser(true);
      setTargetUserError(null);

      try {
        console.log("🔍 正在获取目标用户信息，userId:", targetUserId);
        const response = await fetch(`/api/user/profile?userId=${targetUserId}`);
        const data = await response.json();

        console.log("📊 目标用户信息响应:", data);

        if (data.success) {
          setTargetUser(data.data.user);
          console.log("✅ 目标用户信息获取成功:", data.data.user);
        } else {
          setTargetUserError(data.error || "获取用户信息失败");
          console.error("❌ 获取目标用户信息失败:", data.error);
        }
      } catch (error) {
        console.error("❌ 获取目标用户信息异常:", error);
        setTargetUserError("获取用户信息时发生错误");
      } finally {
        setLoadingTargetUser(false);
      }
    };

    fetchTargetUser();
  }, [targetUserId, user?.isAdmin]);

  // 返回首页
  const handleGoHome = () => {
    router.push(SPECIAL_ROUTES.DEFAULT_HOME);
  };

  // 加载中状态
  if (isChecking || loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">正在验证权限...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 非管理员提示
  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">无访问权限</CardTitle>
            <CardDescription className="text-base">
              抱歉，您不是管理员，无法访问此页面
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={handleGoHome} className="gap-2">
              <Home className="h-4 w-4" />
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 管理员页面
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">管理员操作面板</CardTitle>
              <CardDescription>
                欢迎，{user?.name || user?.username || "管理员"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 如果没有指定用户ID */}
          {!targetUserId && (
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
              <p className="text-lg font-medium text-muted-foreground mb-2">
                请扫描用户二维码
              </p>
              <p className="text-sm text-muted-foreground">
                扫描用户的二维码以查看和管理该用户信息
              </p>
            </div>
          )}

          {/* 加载目标用户信息中 */}
          {targetUserId && loadingTargetUser && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">正在加载用户信息...</p>
            </div>
          )}

          {/* 加载目标用户信息失败 */}
          {targetUserId && !loadingTargetUser && targetUserError && (
            <div className="rounded-lg border border-destructive bg-destructive/5 p-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
              <p className="text-lg font-medium text-destructive mb-2">
                获取用户信息失败
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {targetUserError}
              </p>
              <Button onClick={handleGoHome} variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                返回首页
              </Button>
            </div>
          )}

          {/* 显示目标用户信息 */}
          {targetUserId && !loadingTargetUser && targetUser && (
            <div className="space-y-6">
              {/* 用户基本信息卡片 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">用户信息</CardTitle>
                      <CardDescription>查看和管理用户详细信息</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">姓名</p>
                      <p className="font-medium">{targetUser.name || "未设置"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">用户名</p>
                      <p className="font-medium">{targetUser.username || "未设置"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">邮箱</p>
                      <p className="font-medium">{targetUser.email || "未设置"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">用户ID</p>
                      <p className="font-medium font-mono text-sm">{targetUser.id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">OpenID</p>
                      <p className="font-medium font-mono text-sm truncate" title={targetUser.openid}>
                        {targetUser.openid}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">角色</p>
                      <p className="font-medium">
                        {targetUser.isAdmin ? (
                          <span className="text-amber-600 dark:text-amber-400">管理员</span>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400">普通用户</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* 游戏币信息 */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-emerald-500" />
                        <span className="text-sm font-medium">游戏币余额</span>
                      </div>
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {targetUser.coins.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* TODO: 管理操作区域 */}
              <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  待开发功能
                </p>
                <p className="text-sm text-muted-foreground">
                  管理员操作功能将在此处添加（如调整游戏币、查看交易记录等）
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

