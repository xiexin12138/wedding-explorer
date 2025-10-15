"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ChevronUp,
  X,
  ChevronLeft,
  ChevronRight,
  Map,
  Loader2,
  Check,
  Users,
  Copy,
} from "lucide-react";
import { OptimizedImage } from "@/components/OptimizedImage";
import { OptimizedVideo } from "@/components/OptimizedVideo";
import { detectEnvironment } from "@/lib/environment-detector";
import { openMap } from "@/lib/map-launcher";
import { attractionTypeConfig } from "@/components/MapExplorer";
import { getSignedUrl } from "@/lib/cos-url-signer";
import {
  checkInAttraction,
  getCheckInStatus,
} from "@/lib/services/attractions.service";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/components/UserProvider";

// 定义景点类型枚举 - 与 Prisma 保持一致
export enum AttractionType {
  SCENIC = "SCENIC",
  FOOD = "FOOD",
  SHOPPING = "SHOPPING",
  OTHER = "OTHER",
}

// 定义媒体类型
export interface AttractionMedia {
  type: "image" | "video";
  url: string;
  title?: string;
}

// 扩展景点接口
export interface AttractionDetail {
  id: string;
  name: string;
  position: [number, number]; // 经纬度坐标
  description: string;
  type: AttractionType;
  media?: AttractionMedia[];
  unlockDistance?: number; // 解锁距离，单位米，默认为100米
  rewardCoins?: number; // 打卡奖励金币数（金币功能已屏蔽，但保留数据）
}

interface AttractionCardProps {
  attraction: AttractionDetail;
  userPosition?: [number, number] | null; // 用户当前位置
  onClose?: () => void; // 关闭展开视图的回调
  expanded?: boolean; // 是否展开，由父组件控制
  AMapInstance?: typeof AMap | null; // 高德地图实例
}

export function AttractionCard({
  attraction,
  userPosition,
  onClose,
  expanded: externalExpanded,
  AMapInstance,
}: AttractionCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [openingMapType, setOpeningMapType] = useState<
    "amap" | "baidu" | "tencent" | null
  >(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [signedFullscreenUrl, setSignedFullscreenUrl] = useState<string>("");
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isMediaImageLoading, setIsMediaImageLoading] = useState(true); // 媒体区域图片加载状态
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 打卡相关状态
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInData, setCheckInData] = useState<{
    checkedInAt: string;
    coinsEarned: number;
  } | null>(null);
  const [isLoadingCheckInStatus, setIsLoadingCheckInStatus] = useState(true);

  // 打卡人员列表相关状态
  const [showCheckInList, setShowCheckInList] = useState(true); // 默认展开
  const [checkInList, setCheckInList] = useState<
    Array<{
      id: string;
      user: {
        name: string | null;
        nickname: string | null;
        avatar: string | null;
      };
      checkedInAt: string;
      distance: number | null;
    }>
  >([]);
  const [checkInStats, setCheckInStats] = useState<{
    totalCheckIns: number;
    avgDistance: number | null;
  } | null>(null);
  const [isLoadingCheckInList, setIsLoadingCheckInList] = useState(false);

  // 复制相关状态
  const [isCopied, setIsCopied] = useState(false);

  const { toast } = useToast();
  const { user } = useUser();

  // 使用外部传入的 expanded 状态，如果没有则使用内部状态
  const expanded =
    externalExpanded !== undefined ? externalExpanded : internalExpanded;

  // 计算两点之间的距离（米）- 使用高德地图的距离计算功能
  const calculateDistance = useCallback(
    (lng1: number, lat1: number, lng2: number, lat2: number): number => {
      // 如果高德地图实例不存在，使用默认值
      if (!AMapInstance) {
        return 10000; // 默认返回一个较大的距离，确保未解锁
      }

      // 创建两个点
      const point1 = new AMapInstance.LngLat(lng1, lat1);
      const point2 = new AMapInstance.LngLat(lng2, lat2);

      // 计算两点之间的距离
      const distance = point1.distance(point2);
      console.log("🚀 ~ calculateDistance ~ distance:", distance);

      return distance; // 返回距离（米）
    },
    [AMapInstance]
  );

  // 格式化距离显示
  const formatDistance = useCallback((distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  }, []);

  // 计算当前用户到景点的距离 - 添加防抖优化
  const currentDistance = useMemo(() => {
    if (!userPosition || !attraction.position) {
      return null;
    }
    return calculateDistance(
      userPosition[0],
      userPosition[1],
      attraction.position[0],
      attraction.position[1]
    );
  }, [userPosition, attraction.position, calculateDistance]);

  // 防抖的距离显示，避免频繁更新导致的闪烁
  const [displayDistance, setDisplayDistance] = useState<number | null>(null);
  
  useEffect(() => {
    if (currentDistance === null) {
      setDisplayDistance(null);
      return;
    }

    // 如果距离变化很小（小于10米），不更新显示，避免闪烁
    if (displayDistance !== null && Math.abs(currentDistance - displayDistance) < 10) {
      return;
    }

    // 使用防抖更新显示距离
    const timer = setTimeout(() => {
      setDisplayDistance(currentDistance);
    }, 100);

    return () => clearTimeout(timer);
  }, [currentDistance, displayDistance]);

  // 监听外部 expanded 状态变化
  useEffect(() => {
    // 只有当 externalExpanded 不为 undefined 时才处理
    if (externalExpanded !== undefined) {
      if (!externalExpanded && internalExpanded) {
        // 当外部状态变为 false 时，先显示关闭动画
        setIsClosing(true);
        setTimeout(() => {
          setInternalExpanded(false);
          setIsClosing(false);
        }, 300);
      } else if (externalExpanded) {
        // 当外部状态变为 true 时，确保没有关闭动画
        setIsClosing(false);
        setInternalExpanded(true);
      }
    }
  }, [externalExpanded, internalExpanded]);

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // 计算用户是否在解锁范围内
  useEffect(() => {
    if (!userPosition || !attraction.position) {
      setIsUnlocked(false);
      return;
    }

    // 计算用户与景点的距离
    const distance = calculateDistance(
      userPosition[0],
      userPosition[1],
      attraction.position[0],
      attraction.position[1]
    );

    // 检查是否在解锁距离内
    const unlockDistance = attraction.unlockDistance || 100; // 默认100米
    setIsUnlocked(distance <= unlockDistance);
  }, [userPosition, attraction, calculateDistance]);

  // 获取打卡状态
  useEffect(() => {
    const loadCheckInStatus = async () => {
      if (!user) {
        setIsLoadingCheckInStatus(false);
        return;
      }

      try {
        setIsLoadingCheckInStatus(true);
        const status = await getCheckInStatus(attraction.id);
        setHasCheckedIn(status.hasCheckedIn);
        if (status.checkInData) {
          setCheckInData(status.checkInData);
        }
      } catch (error) {
        console.error("获取打卡状态失败:", error);
      } finally {
        setIsLoadingCheckInStatus(false);
      }
    };

    loadCheckInStatus();
  }, [attraction.id, user]);

  // 获取打卡人员列表
  const loadCheckInList = async () => {
    if (!user) return;

    try {
      setIsLoadingCheckInList(true);
      const response = await fetch(
        `/api/attractions/${attraction.id}/check-ins?page=1&pageSize=10&includeStats=true`
      );

      if (!response.ok) {
        throw new Error("获取打卡列表失败");
      }

      const result = await response.json();

      if (result.success) {
        setCheckInList(result.data.checkIns);
        if (result.data.stats) {
          setCheckInStats(result.data.stats);
        }
      }
    } catch (error) {
      console.error("获取打卡列表失败:", error);
      toast({
        title: "加载失败",
        description: "无法获取打卡人员列表",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCheckInList(false);
    }
  };

  // 切换打卡列表显示
  const toggleCheckInList = () => {
    setShowCheckInList(!showCheckInList);
  };

  // 组件展开时自动加载打卡列表
  useEffect(() => {
    if (expanded && user) {
      loadCheckInList();
    }
  }, [expanded, user, attraction.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 处理打卡
  const handleCheckIn = async () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "您需要登录后才能打卡",
        variant: "destructive",
      });
      return;
    }

    if (hasCheckedIn) {
      toast({
        title: "已经打卡过了",
        description: "您已经在该景点打卡过了",
        variant: "default",
      });
      return;
    }

    if (!isUnlocked) {
      toast({
        title: "距离太远",
        description: "您需要靠近景点才能打卡",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCheckingIn(true);

      // 计算当前距离
      let distance: number | undefined;
      if (userPosition) {
        distance = calculateDistance(
          userPosition[0],
          userPosition[1],
          attraction.position[0],
          attraction.position[1]
        );
      }

      const result = await checkInAttraction(attraction.id, {
        distance,
        longitude: userPosition?.[0],
        latitude: userPosition?.[1],
      });

      setHasCheckedIn(true);
      setCheckInData({
        checkedInAt: new Date().toISOString(),
        coinsEarned: result.coinsEarned,
      });

      // 刷新打卡列表
      if (checkInList.length > 0) {
        loadCheckInList();
      }

      toast({
        title: "打卡成功! 🎉",
        description: "感谢你的探索！",
      });
    } catch (error) {
      console.error("打卡失败:", error);
      const errorMessage = error instanceof Error ? error.message : "打卡失败";
      toast({
        title: "打卡失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  // 通用地图打开方法
  const handleOpenMap = async (mapType: "amap" | "baidu" | "tencent") => {
    if (openingMapType) return; // 防止重复点击

    setOpeningMapType(mapType);
    try {
      const { environment } = detectEnvironment();
      openMap(mapType, attraction.position, attraction.name, environment);

      // 模拟地图应用打开的延迟，给用户反馈
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("打开地图失败:", error);
    } finally {
      setOpeningMapType(null);
    }
  };

  // 复制景点名称（兼容微信浏览器）
  const handleCopyName = async () => {
    try {
      // 方法1: 尝试使用现代 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(attraction.name);
        setIsCopied(true);
        toast({
          title: "复制成功",
          description: `已复制「${attraction.name}」到剪贴板`,
        });
      } else {
        // 方法2: 使用传统的 document.execCommand（兼容微信浏览器）
        const textArea = document.createElement("textarea");
        textArea.value = attraction.name;
        // 防止页面滚动
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.width = "2em";
        textArea.style.height = "2em";
        textArea.style.padding = "0";
        textArea.style.border = "none";
        textArea.style.outline = "none";
        textArea.style.boxShadow = "none";
        textArea.style.background = "transparent";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        // 对于 iOS
        if (navigator.userAgent.match(/ipad|iphone/i)) {
          const range = document.createRange();
          range.selectNodeContents(textArea);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          textArea.setSelectionRange(0, 999999);
        }

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          setIsCopied(true);
          toast({
            title: "复制成功",
            description: `已复制「${attraction.name}」到剪贴板`,
          });
        } else {
          throw new Error("复制失败");
        }
      }

      // 2秒后重置复制状态
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("复制失败:", error);
      toast({
        title: "复制失败",
        description: "请手动选择并复制景点名称",
        variant: "destructive",
      });
    }
  };

  // 获取全屏图片的签名 URL
  useEffect(() => {
    if (!fullscreenImage) {
      setSignedFullscreenUrl("");
      setIsImageLoading(false);
      return;
    }

    let isMounted = true;
    setIsImageLoading(true);

    const loadSignedUrl = async () => {
      try {
        const signed = await getSignedUrl(fullscreenImage);
        if (isMounted) {
          setSignedFullscreenUrl(signed);
        }
      } catch (err) {
        console.error("Failed to load signed URL:", err);
        if (isMounted) {
          setSignedFullscreenUrl(fullscreenImage); // 降级使用原始 URL
        }
      }
    };

    loadSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [fullscreenImage]);

  // 处理图片点击 - 全屏查看
  const handleImageClick = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // 关闭全屏图片
  const closeFullscreenImage = () => {
    setFullscreenImage(null);
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // 处理图片缩放
  const handleImageZoom = (delta: number) => {
    setImageScale((prev) => {
      const newScale = prev + delta;
      if (newScale < 0.5) return 0.5;
      if (newScale > 5) return 5;
      return newScale;
    });
  };

  // 处理触摸缩放（双指）
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      (
        e.currentTarget as HTMLElement & {
          initialPinchDistance?: number;
          initialScale?: number;
        }
      ).initialPinchDistance = distance;
      (
        e.currentTarget as HTMLElement & {
          initialPinchDistance?: number;
          initialScale?: number;
        }
      ).initialScale = imageScale;
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - imagePosition.x,
        y: e.touches[0].clientY - imagePosition.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const initialDistance = (
        e.currentTarget as HTMLElement & { initialPinchDistance?: number }
      ).initialPinchDistance;
      const initialScale =
        (e.currentTarget as HTMLElement & { initialScale?: number })
          .initialScale || 1;

      if (initialDistance) {
        const scale = (distance / initialDistance) * initialScale;
        setImageScale(Math.min(Math.max(scale, 0.5), 5));
      }
    } else if (e.touches.length === 1 && isDragging) {
      setImagePosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 鼠标拖拽支持（PC端）
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 鼠标滚轮缩放（PC端）
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleImageZoom(delta);
  };

  // 处理媒体导航
  const goToNextMedia = () => {
    if (!attraction.media || attraction.media.length === 0) return;
    setIsMediaImageLoading(true); // 切换到下一张时显示加载状态
    setCurrentMediaIndex((prev) => (prev + 1) % attraction.media!.length);
  };

  const goToPreviousMedia = () => {
    if (!attraction.media || attraction.media.length === 0) return;
    setIsMediaImageLoading(true); // 切换到上一张时显示加载状态
    setCurrentMediaIndex(
      (prev) => (prev - 1 + attraction.media!.length) % attraction.media!.length
    );
  };

  // 渲染媒体
  const renderMedia = () => {
    if (!expanded) {
      return null;
    }

    // 没有媒体内容直接返回
    if (!attraction.media || attraction.media.length === 0) {
      return null;
    }

    const currentMedia = attraction.media[currentMediaIndex];

    return (
      <div className="w-full">
        {/* 媒体显示区域 */}
        <div className="w-full h-[40vh] relative overflow-hidden bg-black">
          {/* 加载中状态 */}
          {isMediaImageLoading && currentMedia.type === "image" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
              <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
              <p className="text-white text-sm">加载中...</p>
            </div>
          )}

          {currentMedia.type === "image" ? (
            <div
              className="relative w-full h-full cursor-pointer"
              onClick={() => handleImageClick(currentMedia.url)}
            >
              <OptimizedImage
                src={currentMedia.url}
                alt={currentMedia.title || attraction.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
                optimize={{
                  quality: 85,
                  format: "webp",
                }}
                unoptimized={currentMedia.url.startsWith("data:")} // 如果是 base64 图片则不优化
                onLoadingComplete={() => setIsMediaImageLoading(false)}
              />
            </div>
          ) : (
            <OptimizedVideo
              src={currentMedia.url}
              controls
              className="w-full h-full object-contain"
              title={currentMedia.title || attraction.name}
            />
          )}
        </div>

        {/* 媒体导航控制栏 */}
        {attraction.media.length > 1 && (
          <div className="w-full bg-background/95 backdrop-blur-sm py-2 px-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={goToPreviousMedia}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">上一张</span>
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentMediaIndex + 1} / {attraction.media.length}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={goToNextMedia}
            >
              <span className="text-sm">下一张</span>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  // 全屏图片查看器 - 优先级最高
  if (fullscreenImage) {
    return (
      <div
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* 关闭按钮 */}
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 z-20 rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80"
          onClick={closeFullscreenImage}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* 缩放提示 */}
        <div className="absolute top-4 left-4 z-20 bg-background/60 backdrop-blur-sm rounded-lg px-3 py-2 text-sm">
          {imageScale.toFixed(1)}x
        </div>

        {/* 操作提示（移动端） */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center">
          <div className="bg-background/60 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-center">
            双指缩放 · 单指拖动
          </div>
        </div>

        {/* 图片容器 */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          style={{ touchAction: "none" }}
        >
          {/* 加载中状态 */}
          {isImageLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
              <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
              <p className="text-white text-sm">加载中...</p>
            </div>
          )}

          {signedFullscreenUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signedFullscreenUrl}
              alt="全屏查看"
              className="max-w-none select-none"
              style={{
                transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageScale})`,
                transition: "none", // 完全禁用过渡动画，防止闪烁
                cursor: isDragging ? "grabbing" : "grab",
                maxWidth: "100vw",
                maxHeight: "100vh",
                width: "auto",
                height: "auto",
                willChange: "transform", // 优化性能
                pointerEvents: "none", // 防止图片本身的事件干扰
                opacity: isImageLoading ? 0 : 1, // 加载时隐藏
              }}
              draggable={false}
              onLoad={() => setIsImageLoading(false)}
              onError={() => setIsImageLoading(false)}
            />
          )}
        </div>

        {/* 缩放控制按钮（可选，PC端使用） */}
        <div className="absolute bottom-4 right-4 z-20 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80"
            onClick={() => handleImageZoom(-0.2)}
          >
            <span className="text-lg">-</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80"
            onClick={() => handleImageZoom(0.2)}
          >
            <span className="text-lg">+</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80"
            onClick={() => {
              setImageScale(1);
              setImagePosition({ x: 0, y: 0 });
            }}
          >
            <span className="text-xs">重置</span>
          </Button>
        </div>
      </div>
    );
  }

  // 渲染展开视图
  if (expanded) {
    return (
      <div
        className={`fixed inset-0 z-50 bg-background flex flex-col overflow-hidden ${
          isClosing
            ? "animate-out fade-out slide-out-to-bottom duration-300 ease-in"
            : "animate-in fade-in slide-in-from-bottom duration-300 ease-out"
        }`}
      >
        {/* 媒体区域 */}
        {renderMedia()}

        {/* 内容区域 */}
        <div className="flex-1 p-6 overflow-y-auto pb-20">
          <div className="relative flex items-center mb-2">
            <h2 className="text-2xl font-bold mr-2 flex-shrink-0">
              {attraction.name}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 flex-shrink-0 mr-2"
              onClick={handleCopyName}
              title="复制景点名称"
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <div className="inline-block">
              {/* 在展开视图中使用内联样式而不是绝对定位 */}
              <Badge
                className={cn(
                  attractionTypeConfig[attraction.type]?.className ||
                    attractionTypeConfig[AttractionType.OTHER].className
                )}
              >
                {attractionTypeConfig[attraction.type]?.label ||
                  attractionTypeConfig[AttractionType.OTHER].label}
              </Badge>
            </div>
          </div>

            <div className="mt-4">
              <div className="prose dark:prose-invert">
                <p className="whitespace-pre-wrap">{attraction.description}</p>
              </div>
              
              {/* 打卡状态显示（仅在已打卡时显示） */}
              {user && hasCheckedIn && !isLoadingCheckInStatus && (
                <div className="mt-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-700 dark:text-green-300">
                      已打卡
                    </span>
                  </div>
                  {checkInData && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      <p>
                        打卡时间:{" "}
                        {new Date(checkInData.checkedInAt).toLocaleString(
                          "zh-CN"
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

            {/* 地图导航按钮 - 根据解锁状态显示不同文案 */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    type: "amap" as const,
                    label: "高德地图",
                    navLabel: "用高德导航到这里",
                  },
                  {
                    type: "baidu" as const,
                    label: "百度地图",
                    navLabel: "用百度导航到这里",
                  },
                  {
                    type: "tencent" as const,
                    label: "腾讯地图",
                    navLabel: "用腾讯导航到这里",
                  },
                ].map((mapProvider) => {
                  const isCurrentLoading = openingMapType === mapProvider.type;
                  const isAnyLoading = openingMapType !== null;

                  return (
                    <Button
                      key={mapProvider.type}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleOpenMap(mapProvider.type)}
                      disabled={isAnyLoading}
                    >
                      {isCurrentLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Map className="h-4 w-4" />
                      )}
                      {isCurrentLoading
                        ? "打开中..."
                        : isUnlocked
                        ? mapProvider.label
                        : mapProvider.navLabel}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* 打卡人员列表 */}
            {user && (
              <div className="mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-between"
                  onClick={toggleCheckInList}
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    已打卡的人
                    {checkInStats && (
                      <Badge variant="secondary" className="ml-2">
                        {checkInStats.totalCheckIns}人
                      </Badge>
                    )}
                  </span>
                  <ChevronUp
                    className={cn(
                      "h-4 w-4 transition-transform",
                      showCheckInList ? "rotate-180" : ""
                    )}
                  />
                </Button>

                {showCheckInList && (
                  <div className="mt-3 border rounded-lg overflow-hidden">
                    {isLoadingCheckInList ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          加载中...
                        </span>
                      </div>
                    ) : checkInList.length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        暂无打卡记录
                      </div>
                    ) : (
                      <div className="divide-y">
                        {checkInList.map((checkIn, index) => (
                          <div
                            key={checkIn.id}
                            className="p-3 bg-background hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-sm">
                                    {checkIn.user.name ||
                                      checkIn.user.nickname ||
                                      "匿名用户"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(
                                      checkIn.checkedInAt
                                    ).toLocaleString("zh-CN", {
                                      month: "numeric",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </div>
                              {checkIn.distance !== null && (
                                <div className="text-xs text-muted-foreground">
                                  {checkIn.distance < 1000
                                    ? `${Math.round(checkIn.distance)}m`
                                    : `${(checkIn.distance / 1000).toFixed(
                                        1
                                      )}km`}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 统计信息 */}
                    {checkInStats && checkInStats.totalCheckIns > 0 && (
                      <div className="bg-muted/30 p-3 text-xs text-muted-foreground flex justify-between">
                        <span>共 {checkInStats.totalCheckIns} 人打卡</span>
                        {checkInStats.avgDistance !== null && (
                          <span>
                            平均距离:{" "}
                            {checkInStats.avgDistance < 1000
                              ? `${Math.round(checkInStats.avgDistance)}m`
                              : `${(checkInStats.avgDistance / 1000).toFixed(
                                  1
                                )}km`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮组 */}
        <div className="fixed bottom-0 left-0 right-0 py-4 px-2 bg-gradient-to-t from-background via-background to-background/0 pointer-events-none">
          <div className="pointer-events-auto flex gap-3">
            {/* 左侧打卡按钮 */}
            {user && (
              <div className="flex-[2]">
                {isLoadingCheckInStatus ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12 text-base font-medium"
                    disabled
                  >
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    加载中...
                  </Button>
                ) : hasCheckedIn ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12 text-base font-medium bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                    disabled
                  >
                    <Check className="h-5 w-5 mr-2" />
                    已打卡
                    {displayDistance !== null && (
                      <span className="ml-2 text-sm opacity-80">
                        ({formatDistance(displayDistance!)})
                      </span>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full h-12 text-base font-medium"
                    onClick={handleCheckIn}
                    disabled={!isUnlocked || isCheckingIn}
                  >
                    {isCheckingIn ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        打卡中...
                      </>
                    ) : isUnlocked ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        立即打卡
                        {displayDistance !== null && (
                          <span className="ml-2 text-sm opacity-80">
                            ({formatDistance(displayDistance!)})
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <Map className="h-5 w-5 mr-2" />
                        靠近后可打卡
                        {displayDistance !== null && (
                          <span className="ml-2 text-sm opacity-80">
                            ({formatDistance(displayDistance!)})
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
            
            {/* 右侧关闭按钮 */}
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base font-medium flex-1"
              onClick={() => {
                // 先设置关闭动画状态
                setIsClosing(true);
                // 等待动画完成后再通知父组件
                setTimeout(() => {
                  // 先重置内部状态
                  setInternalExpanded(false);
                  setIsClosing(false);
                  // 最后通知父组件关闭
                  onClose?.();
                }, 300); // 与动画持续时间相同
              }}
            >
              <X className="h-5 w-5 mr-2" />
              关闭
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 渲染卡片视图
  return (
    <Card className="p-4 w-11/12 max-w-md bg-background/90 backdrop-blur-sm shadow-lg relative animate-in fade-in slide-in-from-bottom origin-bottom scale-y-100 duration-300 ease-out">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-lg font-bold flex-shrink-0">{attraction.name}</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            handleCopyName();
          }}
          title="复制景点名称"
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
        <Badge
          className={cn(
            attractionTypeConfig[attraction.type]?.className ||
              attractionTypeConfig[AttractionType.OTHER].className
          )}
        >
          {attractionTypeConfig[attraction.type]?.label ||
            attractionTypeConfig[AttractionType.OTHER].label}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
        {attraction.description}
      </p>

      {/* 展开按钮 */}
      <div className="mt-2 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => {
            // 先设置内部状态
            setInternalExpanded(true);
            setIsClosing(false); // 确保没有关闭动画
            // 通知父组件卡片已展开
            onClose?.();
          }}
        >
          <span>展开</span>
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
