/**
 * 管理员设置页面
 */
import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/client-config";
import { checkSuperAdminStatus } from "@/lib/auth-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: `管理员设置 - ${APP_NAME}`,
  description: "管理系统配置和数据字典",
};

export default async function AdminSettingsPage() {
  const isSuperAdmin = await checkSuperAdminStatus();

  return (
    <div className="container mx-auto ">
      <h1 className="text-2xl font-bold mb-6">管理员设置</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 超级管理员配置 - 仅超级管理员可见 */}
        {isSuperAdmin && (
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>超级管理员配置</CardTitle>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Super Admin
                </Badge>
              </div>
              <CardDescription>
                配置游戏项目、设置游戏规则和奖励机制
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/super-admin">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  进入配置
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* 数据字典配置 */}
        <Card>
          <CardHeader>
            <CardTitle>数据字典配置</CardTitle>
            <CardDescription>
              管理系统中的数据字典项，包括状态、类型等配置信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/dictionary">
              <Button className="w-full">进入配置</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 其他设置项可以在这里添加 */}
        <Card>
          <CardHeader>
            <CardTitle>系统配置</CardTitle>
            <CardDescription>系统基础配置和参数设置</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled>
              开发中...
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>用户管理</CardTitle>
            <CardDescription>管理系统用户和权限设置</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled>
              开发中...
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
