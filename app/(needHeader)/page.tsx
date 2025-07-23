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
    <div className="flex-1 flex justify-center items-center p-4 overflow-hidden">
      {/* 背景图片 - 响应式处理 */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <Image 
          src="/images/bg-pc.webp" 
          alt="背景图片" 
          fill 
          className="object-contain opacity-60 dark:opacity-20" 
          priority
        />
      </div>
      <div className="absolute inset-0 z-0 block md:hidden">
        <Image 
          src="/images/bg-mobile.webp" 
          alt="背景图片" 
          fill 
          className="object-cover opacity-60 dark:opacity-20" 
          priority
        />
      </div>
      <Card className="max-w-md w-full relative z-10 bg-background/80 backdrop-blur-sm">
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
  );
}
