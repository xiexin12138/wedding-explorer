import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/app/ui/LogoutButton";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 欢迎卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-stone-900">
              欢迎回来！
            </CardTitle>
            <CardDescription className="text-stone-600">
              您已成功登录 Wedding Explorer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-stone-700">
              在这里您可以管理您的婚礼信息，查看活动安排，以及与我们的团队保持联系。
            </p>
          </CardContent>
        </Card>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stone-900">
                婚礼信息
              </CardTitle>
              <CardDescription className="text-stone-600">
                查看和管理您的婚礼详情
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
              <CardTitle className="text-lg font-semibold text-stone-900">
                活动安排
              </CardTitle>
              <CardDescription className="text-stone-600">
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
              <CardTitle className="text-lg font-semibold text-stone-900">
                联系我们
              </CardTitle>
              <CardDescription className="text-stone-600">
                与我们的团队取得联系
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
            <CardTitle className="text-lg font-semibold text-stone-900">
              账户操作
            </CardTitle>
            <CardDescription className="text-stone-600">
              管理您的账户设置
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LogoutButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 