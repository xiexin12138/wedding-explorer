import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { SPECIAL_ROUTES } from "@/lib/routes.config";

export default function HomePage() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      {/* 欢迎卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">欢迎回来！</CardTitle>
          <CardDescription>您已成功登录 Wedding Explorer</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            在这里您可以，查看活动安排，以及与新人保持联系。
          </p>
        </CardContent>
      </Card>

      {/* 功能卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">活动安排</CardTitle>
            <CardDescription>查看即将到来的活动</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Link href={SPECIAL_ROUTES.TIMELINE}>查看安排</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">问题咨询</CardTitle>
            <CardDescription>有不清楚的地方尽管联系我们</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              联系我们 ( 开发中... )
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
