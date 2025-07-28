import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HomeButton } from "@/components/HomeButton";
import { WeddingCountdown } from "@/components/WeddingCountdown";
import { ConfettiEffect } from "@/components/ConfettiEffect"; // 方案二
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex-1 relative">
      {/* 彩色碎纸动效 */}
      <ConfettiEffect trigger={true} />

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
      <div
        className="fixed inset-0 z-0 block md:hidden bg-mobile-parallax"
        style={{
          height: `100vh`,
          transition: "height 0.3s ease-out",
        }}
      >
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
          <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm mx-auto my-auto">
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
              <HomeButton />
            </CardContent>
          </Card>
          {/* 测试用的额外卡片 */}
          {Array.from({ length: 5 }).map((_, index) => (
            <Card
              key={index}
              className="w-full max-w-md bg-background/80 backdrop-blur-sm mx-auto my-auto mt-110"
            >
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">
                  测试卡片 {index + 1}
                </CardTitle>
                <CardDescription>
                  这是一个用于测试滚动效果的卡片
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  这是测试卡片的内容区域，用于填充页面以便测试滚动效果。
                </p>
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                  占位区块 {index + 1}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
