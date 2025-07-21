import LogoutButton from "@/app/ui/LogoutButton";
import { ModeToggle } from "@/components/ModeToggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * 仪表板页面 - 现在由布局自动处理认证
 * 无需手动检查登录状态
 */
export default async function HomePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">仪表板</CardTitle>
          <CardDescription>
            欢迎使用 Wedding Explorer！您已成功登录。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">账户操作</CardTitle>
          <CardDescription>管理您的账户设置</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
