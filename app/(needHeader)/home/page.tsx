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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">欢迎回来</h1>
        <p className="text-muted-foreground">
          您已成功登录 Wedding Explorer
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">快速开始</CardTitle>
            <CardDescription>
              开始探索活动相关的功能和工具
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">浏览活动策划工具</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">管理您的账户设置</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">查看最新功能</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">账户信息</CardTitle>
            <CardDescription>查看和管理您的账户</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">账户状态</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">已激活</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">登录时间</span>
                <span className="text-sm">刚刚</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">账户类型</span>
                <span className="text-sm">标准用户</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">最近活动</CardTitle>
          <CardDescription>您最近的操作记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
              <span>成功登录系统</span>
              <span className="text-muted-foreground ml-auto">刚刚</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
              <span>账户验证完成</span>
              <span className="text-muted-foreground ml-auto">刚刚</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
