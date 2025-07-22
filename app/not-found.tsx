import Link from "next/link";
import { SPECIAL_ROUTES } from "@/lib/routes.config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-6xl font-bold text-stone-900 mb-2">404</CardTitle>
          <CardDescription className="text-2xl font-semibold text-stone-700 mb-4">
            页面找不到啦
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-stone-600 text-center mb-6">
            抱歉，您访问的页面不存在或已被移动。
          </p>

          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link href={SPECIAL_ROUTES.DEFAULT_HOME}>
                返回首页
              </Link>
            </Button>

            <div className="text-sm text-stone-500 text-center">
              <p>如果问题持续存在，请检查您的网络连接或稍后再试</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
