"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HomeButton } from "@/components/HomeButton";
import { WeddingCountdown } from "@/components/WeddingCountdown";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

export default function HomePage() {
  const [imageScale, setImageScale] = useState(100);
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!cardRef.current) return;
      
      const cardRect = cardRef.current.getBoundingClientRect();
      
      // 计算卡片底部距离视口顶部的距离
      const distanceFromTop = cardRect.bottom;
      
      // 获取视口高度作为参考
      const viewportHeight = window.innerHeight;
      
      // 计算缩放比例：距离越近（距离越小），缩放越大
      // 当距离为0时缩放为120%，当距离为视口高度时缩放为80%
      const maxScale = 125;
      const minScale = 100;
      const scaleRange = maxScale - minScale;
      
      // 计算距离比例（0-1之间）
      const distanceRatio = Math.max(0, Math.min(1, distanceFromTop / viewportHeight));
      
      // 反向计算缩放：距离比例越小，缩放越大
      const scale = maxScale - (distanceRatio * scaleRange);
      
      // 调试信息（仅在开发环境）
      if (process.env.NODE_ENV === 'development') {
        console.log('距离顶部:', distanceFromTop, '视口高度:', viewportHeight, '缩放比例:', scale);
      }
      
      setImageScale(scale);
    };

    // 监听窗口滚动事件
    window.addEventListener('scroll', handleScroll);
    // 初始化时也执行一次
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
      <div 
        className="fixed inset-0 z-0 block md:hidden transition-transform duration-300 ease-out"
        style={{
          transform: `scale(${imageScale / 100})`,
          transformOrigin: 'center center'
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
      <div ref={containerRef} className="relative z-10 min-h-full overflow-y-auto p-4">
        <div className="content-container w-full space-y-8">
          {/* 欢迎卡片 */}
          <Card ref={cardRef} className="w-full max-w-md bg-background/80 backdrop-blur-sm mx-auto my-auto">
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
            <Card key={index} className="w-full max-w-md bg-background/80 backdrop-blur-sm mx-auto my-auto mt-110">
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
