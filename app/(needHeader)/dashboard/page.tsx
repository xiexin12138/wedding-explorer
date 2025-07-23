import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 欢迎卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            欢迎回来！
          </CardTitle>
          <CardDescription>
            您已成功登录 Wedding Explorer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            在这里您可以查看活动信息，查看活动安排，以及与新人保持联系。
          </p>
        </CardContent>
      </Card>

      {/* 功能卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              活动信息
            </CardTitle>
            <CardDescription>
              查看活动详情
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              查看详情
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              活动安排
            </CardTitle>
            <CardDescription>
              查看即将到来的活动
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              查看安排
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              联系我们
            </CardTitle>
            <CardDescription>
              与新人取得联系
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              联系团队
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 账户操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            账户操作
          </CardTitle>
          <CardDescription>
            管理您的账户设置
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
} 