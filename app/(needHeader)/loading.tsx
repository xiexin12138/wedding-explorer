"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/client-config";
import Image from "next/image";

export default function LoadingPage() {
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

      {/* 加载内容区域 */}
      <div className="relative z-10 min-h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {APP_NAME}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {/* 加载动画 */}
            <div className="flex justify-center">
              <div className="relative">
                {/* 外圈旋转动画 */}
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                {/* 内圈脉冲动画 */}
                <div className="absolute inset-2 bg-primary/30 rounded-full animate-pulse"></div>
                {/* 中心点 */}
                <div className="absolute inset-6 bg-primary rounded-full animate-ping"></div>
              </div>
            </div>
            
            {/* 加载文字 */}
            <div className="space-y-2">
              <p className="text-lg font-medium text-muted-foreground">
                正在加载...
              </p>
              <p className="text-sm text-muted-foreground">
                请稍候，我们正在为您准备美好的体验
              </p>
            </div>

            {/* 装饰性元素 */}
            <div className="flex justify-center space-x-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}