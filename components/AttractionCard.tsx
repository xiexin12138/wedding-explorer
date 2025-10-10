"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronUp,
  X,
  ChevronLeft,
  ChevronRight,
  Map,
  Loader2,
  Edit,
  Save,
  XCircle,
} from "lucide-react";
import { OptimizedImage } from "@/components/OptimizedImage";
import { OptimizedVideo } from "@/components/OptimizedVideo";
import { detectEnvironment } from "@/lib/environment-detector";
import { openMap } from "@/lib/map-launcher";
import { attractionTypeConfig } from "@/components/MapExplorer";
import { useToast } from "@/components/ui/use-toast";
import { getSignedUrl } from "@/lib/cos-url-signer";

// 定义景点类型枚举
export enum AttractionType {
  SCENIC = "scenic",
  FOOD = "food",
  SHOPPING = "shopping",
  OTHER = "other",
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
}

interface AttractionCardProps {
  attraction: AttractionDetail;
  userPosition?: [number, number] | null; // 用户当前位置
  onClose?: () => void; // 关闭展开视图的回调
  expanded?: boolean; // 是否展开，由父组件控制
  AMapInstance?: typeof AMap | null; // 高德地图实例
  onDescriptionUpdate?: (
    attractionId: string,
    newDescription: string,
    newName?: string
  ) => void; // 描述和标题更新回调
  isAdmin?: boolean; // 是否为管理员
}

export function AttractionCard({
  attraction,
  userPosition,
  onClose,
  expanded: externalExpanded,
  AMapInstance,
  onDescriptionUpdate,
  isAdmin,
}: AttractionCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [openingMapType, setOpeningMapType] = useState<
    "amap" | "baidu" | "tencent" | null
  >(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(
    attraction.description
  );
  const [editedName, setEditedName] = useState(attraction.name);
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [signedFullscreenUrl, setSignedFullscreenUrl] = useState<string>("");
  const { toast } = useToast();

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

  // 处理媒体导航
  const goToNextMedia = () => {
    if (!attraction.media || attraction.media.length === 0) return;
    setCurrentMediaIndex((prev) => (prev + 1) % attraction.media!.length);
  };

  const goToPreviousMedia = () => {
    if (!attraction.media || attraction.media.length === 0) return;
    setCurrentMediaIndex(
      (prev) => (prev - 1 + attraction.media!.length) % attraction.media!.length
    );
  };

  // 处理描述和标题更新
  const handleUpdateDescription = async () => {
    // 验证输入
    if (!editedDescription.trim()) {
      toast({
        title: "错误",
        description: "描述内容不能为空",
        variant: "destructive",
      });
      return;
    }

    if (!editedName.trim()) {
      toast({
        title: "错误",
        description: "标题不能为空",
        variant: "destructive",
      });
      return;
    }

    // 检查是否有变化
    if (
      editedDescription.trim() === attraction.description &&
      editedName.trim() === attraction.name
    ) {
      setIsEditingDescription(false);
      return;
    }

    setIsUpdatingDescription(true);
    try {
      const updateData: any = {};

      if (editedDescription.trim() !== attraction.description) {
        updateData.description = editedDescription.trim();
      }

      if (editedName.trim() !== attraction.name) {
        updateData.name = editedName.trim();
      }

      const response = await fetch(`/api/attractions/${attraction.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "更新景点信息失败");
      }

      const result = await response.json();

      toast({
        title: "更新成功",
        description: "景点信息已更新",
      });

      // 调用回调通知父组件
      if (onDescriptionUpdate) {
        onDescriptionUpdate(
          attraction.id,
          editedDescription.trim(),
          editedName.trim()
        );
      }

      setIsEditingDescription(false);
    } catch (error) {
      console.error("更新景点信息失败:", error);
      const errorMessage =
        error instanceof Error ? error.message : "更新景点信息失败";
      toast({
        title: "更新失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingDescription(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditedDescription(attraction.description);
    setEditedName(attraction.name);
    setIsEditingDescription(false);
  };

  // 当 attraction 变化时，更新编辑的值
  useEffect(() => {
    setEditedDescription(attraction.description);
    setEditedName(attraction.name);
  }, [attraction.description, attraction.name]);

  // 获取全屏图片的签名 URL
  useEffect(() => {
    if (!fullscreenImage) {
      setSignedFullscreenUrl("");
      return;
    }

    let isMounted = true;

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
      // 记录初始两指距离
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      (e.currentTarget as any).initialPinchDistance = distance;
      (e.currentTarget as any).initialScale = imageScale;
    } else if (e.touches.length === 1) {
      // 单指拖拽
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - imagePosition.x,
        y: e.touches[0].clientY - imagePosition.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 双指缩放
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const initialDistance = (e.currentTarget as any).initialPinchDistance;
      const initialScale = (e.currentTarget as any).initialScale || 1;

      if (initialDistance) {
        const scale = (distance / initialDistance) * initialScale;
        setImageScale(Math.min(Math.max(scale, 0.5), 5));
      }
    } else if (e.touches.length === 1 && isDragging) {
      // 单指拖拽
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

  // 渲染媒体
  const renderMedia = () => {
    if (!expanded || !attraction.media || attraction.media.length === 0) {
      return null;
    }

    // 如果未解锁，显示锁定提示
    if (!isUnlocked) {
      return (
        <div className="w-full h-[40vh] relative overflow-hidden bg-black flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-xl font-bold mb-2">内容已锁定</div>
            <div className="text-sm text-muted-foreground">
              需要靠近此位置才能查看媒体内容
            </div>
          </div>
        </div>
      );
    }

    const currentMedia = attraction.media[currentMediaIndex];

    return (
      <div className="w-full">
        {/* 媒体显示区域 - 不覆盖任何控制按钮 */}
        <div className="w-full h-[40vh] relative overflow-hidden bg-black">
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
          {signedFullscreenUrl && (
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
              }}
              draggable={false}
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
            <h2 className="text-2xl font-bold mr-2">{attraction.name}</h2>
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
            {/* 描述区域 - 支持管理员编辑 */}
            {isEditingDescription ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    景点标题
                  </label>
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="请输入景点标题"
                    disabled={isUpdatingDescription}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    景点描述
                  </label>
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="min-h-[100px] resize-none"
                    placeholder="请输入景点描述"
                    disabled={isUpdatingDescription}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateDescription}
                    disabled={isUpdatingDescription}
                    size="sm"
                    className="flex-1"
                  >
                    {isUpdatingDescription ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        保存
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    disabled={isUpdatingDescription}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="prose dark:prose-invert">
                  <p>{attraction.description}</p>
                </div>
                {isAdmin && (
                  <Button
                    onClick={() => setIsEditingDescription(true)}
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    编辑信息
                  </Button>
                )}
              </div>
            )}

            {/* 地图中打开按钮 */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { type: "amap" as const, label: "高德地图" },
                  { type: "baidu" as const, label: "百度地图" },
                  { type: "tencent" as const, label: "腾讯地图" },
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
                      {isCurrentLoading ? "打开中..." : mapProvider.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {!isUnlocked && (
              <div className="mt-6 flex flex-col items-center justify-center p-4 border border-dashed border-muted-foreground/50 rounded-lg text-center">
                <div className="text-muted-foreground mb-2">
                  需要靠近此位置才能查看完整内容
                </div>
                <div className="text-sm text-muted-foreground">
                  距离解锁还需要{" "}
                  {userPosition
                    ? (() => {
                        const distance = Math.max(
                          0,
                          Math.round(
                            calculateDistance(
                              userPosition[0],
                              userPosition[1],
                              attraction.position[0],
                              attraction.position[1]
                            ) - (attraction.unlockDistance || 100)
                          )
                        );
                        return distance >= 1000
                          ? `${(distance / 1000).toFixed(1)} 千米`
                          : `${distance} 米`;
                      })()
                    : "未知"}
                </div>
              </div>
            )}

            {/* 这里可以添加更多详细内容，仅在解锁后显示 */}
            {/* {isUnlocked && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">详细信息</h3>
                <p className="text-muted-foreground">
                  您已解锁此位置的详细内容。这里可以显示更多关于
                  {attraction.name}的详细信息。
                </p>
              </div>
            )} */}
          </div>
        </div>

        {/* 底部关闭按钮 */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-background/0 pointer-events-none">
          <div className="pointer-events-auto">
            <Button
              variant="outline"
              className="w-full h-12 text-base font-medium"
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
        <h3 className="text-lg font-bold">{attraction.name}</h3>
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
      <p className="text-sm text-muted-foreground">{attraction.description}</p>

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
