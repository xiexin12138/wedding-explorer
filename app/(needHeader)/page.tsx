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
import { MapPin, Navigation, Car, Loader2, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function HomePage() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 检测深色模式
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    
    // 监听主题变化
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  // 监听滚动事件 - 兼容性优化
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    let ticking = false;

    const getScrollTop = () => {
      // 兼容多种获取滚动位置的方式
      const containerScrollTop = scrollContainer?.scrollTop || 0;
      const windowScrollY = 
        window.pageYOffset || // 兼容旧版浏览器
        window.scrollY || 
        document.documentElement.scrollTop || 
        document.body.scrollTop || 
        0;
      
      return Math.max(containerScrollTop, windowScrollY);
    };

    const handleScroll = () => {
      if (!ticking) {
        // 使用 requestAnimationFrame 优化性能
        window.requestAnimationFrame(() => {
          const scrollTop = getScrollTop();
          
          // 如果滚动超过阈值，隐藏提示
          if (scrollTop > 30) {
            setShowScrollHint(false);
          }
          
          ticking = false;
        });
        
        ticking = true;
      }
    };

    // 监听容器滚动
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    }
    
    // 监听窗口滚动
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // 移动端触摸滚动监听（微信H5重要）
    if (scrollContainer) {
      scrollContainer.addEventListener("touchmove", handleScroll, { passive: true });
    }
    window.addEventListener("touchmove", handleScroll, { passive: true });
    
    // 检查初始滚动位置
    handleScroll();
    
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
        scrollContainer.removeEventListener("touchmove", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
    };
  }, []);

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

      {/* 滚动提示 */}
      <div
        className={`fixed bottom-8 left-1/2 z-20 pointer-events-none transition-all duration-500 ${
          showScrollHint
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
        style={{
          transform: showScrollHint 
            ? 'translate(-50%, 0)' 
            : 'translate(-50%, 1rem)',
          WebkitTransform: showScrollHint 
            ? 'translate(-50%, 0)' 
            : 'translate(-50%, 1rem)',
        }}
      >
        <div 
          className="flex flex-col items-center gap-1 px-5 py-3 rounded-full shadow-lg animate-bounce"
          style={{
            backgroundColor: isDarkMode 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            向下滑动查看更多
          </span>
          <ChevronDown className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* 可滚动的内容区域 */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 min-h-full overflow-y-auto p-4"
      >
        <div className="content-container w-full space-y-8 flex gap-80 flex-col mb-12">
          {/* 欢迎卡片 */}
          <Card className="w-full pt-4 max-w-md bg-background/80 backdrop-blur-sm mx-auto my-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                欢迎参加我们的婚礼
              </CardTitle>
              <CardDescription className="text-lg">
                我们将共度一个愉快的周末
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
          <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                婚礼场地
              </CardTitle>
              <CardDescription className="text-lg font-medium">
                广东 · 潮州 · InGarden 花园里
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
              <Dialog
                open={isGuideOpen}
                onOpenChange={(open) => {
                  setIsGuideOpen(open);
                  if (open) {
                    // 每次打开弹窗时重置加载状态
                    setIsImageLoading(true);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30"
                  >
                    <Car className="h-4 w-4 mr-2" />
                    <span>自驾路线指引</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
                  <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      自驾路线指引
                    </DialogTitle>
                  </DialogHeader>
                  <div className="relative flex-1 overflow-y-auto px-6 pb-6">
                    <div className="relative w-full min-h-[200px]">
                      {/* 加载状态 */}
                      {isImageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                              加载中...
                            </p>
                          </div>
                        </div>
                      )}
                      {/* 路线图片 */}
                      <Image
                        src="/images/guide.jpg"
                        alt="自驾路线指引图"
                        width={800}
                        height={2000}
                        className="w-full h-auto rounded-lg"
                        onLoad={() => setIsImageLoading(false)}
                        priority={isGuideOpen}
                      />
                    </div>
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
        </div>
      </div>
    </div>
  );
}
