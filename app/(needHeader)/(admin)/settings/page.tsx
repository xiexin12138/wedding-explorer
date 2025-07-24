/**
 * 管理员设置页面
 */
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto ">
      <h1 className="text-2xl font-bold mb-6">管理员设置</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
