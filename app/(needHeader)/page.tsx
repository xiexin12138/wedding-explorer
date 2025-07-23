import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardButton } from "@/components/DashboardButton";
import { WeddingCountdown } from "@/components/WeddingCountdown";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex-1 relative">
      {/* 固定背景图片 - 响应式处理 */}
      <div className="fixed inset-0 z-0 hidden md:block">
        <Image
          src="/images/bg-pc.webp"
          alt="背景图片"
          fill
          className="object-contain opacity-60 dark:opacity-20"
          priority
        />
      </div>
      <div className="fixed inset-0 z-0 block md:hidden">
        <Image
          src="/images/bg-mobile.webp"
          alt="背景图片"
          fill
          className="object-cover opacity-60 dark:opacity-20"
          priority
        />
      </div>

      {/* 可滚动的内容区域 */}
      <div className="relative z-10 min-h-full overflow-y-auto p-4">
        <div className="content-container w-full space-y-8">
          {/* 欢迎卡片 */}
          <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm mx-auto my-auto mt-50 mb-140">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                欢迎来到 Wedding Explorer
              </CardTitle>
              <CardDescription className="text-lg">
                您的探索之旅即将开始
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <WeddingCountdown />
              <p className="text-muted-foreground">
                感谢您与我们一起创造美好的回忆。
              </p>
              <DashboardButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
