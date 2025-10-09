"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HomeButton } from "@/components/HomeButton";
import { WeddingCountdown } from "@/components/WeddingCountdown";
import { ConfettiEffect } from "@/components/ConfettiEffect"; // 方案二
import { MapPin, Navigation, Car } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function HomePage() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
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
          <Card className="w-full pt-4 max-w-md bg-background/80 backdrop-blur-sm mx-auto my-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                欢迎参加我们的婚礼
              </CardTitle>
              <CardDescription className="text-lg">
                我们将共度一个愉快的周六
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

          {/* 婚礼场地卡片 */}
          <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm mx-auto mt-80">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                婚礼场地
              </CardTitle>
              <CardDescription className="text-lg font-medium">
                花园里
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 场地门头图片 */}
              <div className="relative w-full rounded-lg overflow-hidden">
                <Image
                  src="/images/doorheard.jpg"
                  alt="花园里婚礼场地门头"
                  width={1200}
                  height={900}
                  className="w-full h-auto"
                  priority
                />
              </div>

              {/* 地址信息 */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  为方便您的出行，我们为您提供地图导航和自驾路线指引
                </p>
              </div>

              {/* 导航按钮 */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="w-full bg-[#00A870]/10 hover:bg-[#00A870]/20 border-[#00A870]/30"
                >
                  <a
                    href="https://surl.amap.com/cV47A7zFaZZ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>高德地图</span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full bg-[#3385FF]/10 hover:bg-[#3385FF]/20 border-[#3385FF]/30"
                >
                  <a
                    href="https://j.map.baidu.com/31/_GFk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>百度地图</span>
                  </a>
                </Button>
              </div>

              {/* 自驾路线指引按钮 */}
              <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30"
                  >
                    <Car className="h-4 w-4 mr-2" />
                    <span>自驾路线指引</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      自驾路线指引
                    </DialogTitle>
                  </DialogHeader>
                  <div className="relative w-full">
                    <Image
                      src="/images/guide.jpg"
                      alt="自驾路线指引图"
                      width={800}
                      height={2000}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                </DialogContent>
              </Dialog>

              {/* 提示信息 */}
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  点击上方按钮即可查看导航和自驾路线
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 测试用的额外卡片 */}
          {/* {Array.from({ length: 5 }).map((_, index) => (
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
          ))} */}
        </div>
      </div>
    </div>
  );
}
