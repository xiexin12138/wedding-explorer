"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import gcoord from "gcoord";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  List,
  Loader2,
  Trash2,
  Filter,
  ArrowUpDown,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AttractionForm } from "@/components/AttractionForm";
import { cn } from "@/lib/utils";
import { useUser } from "@/components/UserProvider";
import { useToast } from "@/components/ui/use-toast";
import { getAllAttractions } from "@/lib/services/attractions.service";
// import { cache, CACHE_KEYS } from "@/lib/cache";

// 景点数据缓存键
// const ATTRACTIONS_CACHE_KEY = CACHE_KEYS.ATTRACTIONS_DATA;

// 导入新的 AttractionCard 组件和相关类型
import {
  AttractionCard,
  AttractionType,
  AttractionDetail,
} from "@/components/AttractionCard";

// 使用新的景点类型
type Attraction = AttractionDetail;

// 导出类型配置供其他组件使用
export const attractionTypeConfig: Record<AttractionType, { label: string; className: string }> = {
  [AttractionType.SCENIC]: {
    label: "景点",
    className:
      "bg-blue-500/90 hover:bg-blue-500 text-white border-transparent",
  },
  [AttractionType.FOOD]: {
    label: "美食",
    className:
      "bg-orange-500/90 hover:bg-orange-500 text-white border-transparent",
  },
  [AttractionType.SHOPPING]: {
    label: "购物",
    className:
      "bg-purple-500/90 hover:bg-purple-500 text-white border-transparent",
  },
  [AttractionType.OTHER]: {
    label: "其他",
    className:
      "bg-slate-500/90 hover:bg-slate-500 text-white border-transparent",
  },
};

// 获取景点类型配置的辅助函数
export const getAttractionTypeConfig = (type: AttractionType) => {
  return attractionTypeConfig[type];
};

// 示例景点数据 - 作为后备数据使用
const SAMPLE_ATTRACTIONS: Attraction[] = [];

export function MapExplorer() {
  const mapRef = useRef<HTMLDivElement>(null);

  // 所有状态声明放在组件顶部
  const [map, setMap] = useState<AMap.Map | null>(null);
  const [AMapInstance, setAMapInstance] = useState<typeof AMap | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [attractionsLoading, setAttractionsLoading] = useState<boolean>(true);
  const [currentAttractionIndex, setCurrentAttractionIndex] =
    useState<number>(0);
  const [showAttractionsList, setShowAttractionsList] =
    useState<boolean>(false);
  const [markers, setMarkers] = useState<AMap.Marker[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);
  // 景点打卡状态映射
  const [attractionCheckInStatus, setAttractionCheckInStatus] = useState<
    Record<string, boolean>
  >({});
  // 用于防抖的时间戳
  const lastLocationClickTimeRef = useRef<number>(0);
  // 用于跟踪定位是否正在进行中（与UI状态分开）
  const isLocationInProgressRef = useRef<boolean>(false);
  const locationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [userPositionMarker, setUserPositionMarker] =
    useState<AMap.Marker | null>(null);
  const [cardExpanded, setCardExpanded] = useState<boolean>(false);
  const [userPositionCircle, setUserPositionCircle] =
    useState<AMap.Circle | null>(null);
  const [showAttractionForm, setShowAttractionForm] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // 景点列表过滤和排序状态
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<AttractionType | 'ALL'>('ALL');
  const [checkInFilter, setCheckInFilter] = useState<'ALL' | 'CHECKED' | 'UNCHECKED'>('ALL');
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'DISTANCE' | 'CHECKINS'>('DEFAULT');
  
  // 滑动相关状态
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  
  // 使用 ref 存储触摸状态，避免闭包问题
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);
  
  // 跟踪上一次的景点索引，用于判断是否需要入场动画
  const prevAttractionIndexRef = useRef<number>(-1);
  
  const { theme } = useTheme();
  const { user } = useUser();
  const { toast } = useToast();

  // 在客户端挂载后更新状态
  useEffect(() => {
    setMounted(true);
  }, []);

  // 控制 Header 显示/隐藏
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (showAttractionsList) {
      document.body.classList.add('hide-header');
    } else {
      document.body.classList.remove('hide-header');
    }

    // 清理函数：组件卸载时移除类
    return () => {
      document.body.classList.remove('hide-header');
    };
  }, [showAttractionsList]);

  // 加载景点数据
  useEffect(() => {
    const loadAttractions = async () => {
      try {
        setAttractionsLoading(true);
        const attractionsData = await getAllAttractions();
        setAttractions(attractionsData);
        
        // 如果有景点数据，设置第一个为当前景点
        if (attractionsData.length > 0) {
          setCurrentAttractionIndex(0);
        }
      } catch (error) {
        console.error("加载景点数据失败:", error);
        // 如果加载失败，使用示例数据作为后备
        setAttractions(SAMPLE_ATTRACTIONS);
        if (SAMPLE_ATTRACTIONS.length > 0) {
          setCurrentAttractionIndex(0);
        }
        toast({
          title: "景点数据加载失败",
          description: "已切换到示例数据，部分功能可能受限",
          variant: "destructive",
        });
      } finally {
        setAttractionsLoading(false);
      }
    };

    loadAttractions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 加载所有景点的打卡状态
  useEffect(() => {
    const loadCheckInStatuses = async () => {
      if (!user || attractions.length === 0) return;

      try {
        // 并行获取所有景点的打卡状态
        const statusPromises = attractions.map(async (attraction) => {
          try {
            const response = await fetch(
              `/api/attractions/${attraction.id}/check-in-status`
            );
            const result = await response.json();
            return {
              id: attraction.id,
              hasCheckedIn: result.success && result.data.hasCheckedIn,
            };
          } catch (error) {
            console.error(`获取景点 ${attraction.id} 打卡状态失败:`, error);
            return { id: attraction.id, hasCheckedIn: false };
          }
        });

        const statuses = await Promise.all(statusPromises);
        const statusMap: Record<string, boolean> = {};
        statuses.forEach((status) => {
          statusMap[status.id] = status.hasCheckedIn;
        });
        setAttractionCheckInStatus(statusMap);
      } catch (error) {
        console.error("加载打卡状态失败:", error);
      }
    };

    loadCheckInStatuses();
  }, [user, attractions]);

  // 定时更新用户位置
  useEffect(() => {
    // 确保代码只在客户端执行
    if (typeof window === "undefined") return;

    // 确保地图和高德地图实例已加载
    if (!map || !AMapInstance) return;

    // 更新用户位置的函数 - 直接使用高德定位
    const updateUserLocation = () => {
      // 如果上一次定位请求还未完成，则跳过本次更新
      if (isLocationInProgressRef.current) {
        console.log("上一次定位请求尚未完成，跳过本次更新");
        return;
      }

      // 防抖处理：如果距离上次定位不足2秒，则跳过本次更新
      const now = Date.now();
      if (now - lastLocationClickTimeRef.current < 2000) {
        console.log("定时更新：距离上次定位时间过短，跳过本次更新");
        return;
      }
      lastLocationClickTimeRef.current = now;

      // 不在定时更新时设置isLocating为true，避免影响UI
      // 但我们仍然使用lastLocationClickTimeRef进行防抖
      // 只有在手动点击定位按钮时才设置isLocating为true

      // 标记定位正在进行中
      isLocationInProgressRef.current = true;

      // 直接使用高德定位
      const geolocation = new AMapInstance.Geolocation({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        showButton: false,
        showMarker: false,
        showCircle: false,
        panToLocation: false,
        zoomToAccuracy: false,
        convert: false, // 不使用高德自动转换，用gcoord手动转换
      });

      geolocation.getCurrentPosition(
        (
          status: AMap.Geolocation.SearchStatus,
          result:
            | AMap.Geolocation.GeolocationResult
            | AMap.Geolocation.ErrorStatus
        ) => {
          // 标记定位已完成
          isLocationInProgressRef.current = false;

          if (status === "complete" && "position" in result) {
            const position = result.position;
            const wgs84Point: [number, number] = [
              position.getLng(),
              position.getLat(),
            ];
            // 使用gcoord将WGS84坐标转换为GCJ02坐标
            const gcj02Point = gcoord.transform(
              wgs84Point,
              gcoord.WGS84,
              gcoord.GCJ02
            ) as [number, number];
            setUserPosition(gcj02Point);

            // 获取定位精度
            const geolocationResult =
              result as AMap.Geolocation.GeolocationResult;
            const accuracy = geolocationResult.accuracy || 100; // 默认精度为100米

            // 不再创建用户位置标记和精度圈，只更新位置状态
            console.log("高德定位成功，更新用户位置，精度：", accuracy, "米");
          } else {
            const errorResult = result as AMap.Geolocation.ErrorStatus;
            console.error("高德定位失败，错误信息：", errorResult.message);
          }
        }
      );
    };

    // 初始更新一次位置
    updateUserLocation();

    // 设置定时器，每 5 秒更新一次位置
    locationTimerRef.current = setInterval(updateUserLocation, 5000);

    // 清理函数
    return () => {
      if (locationTimerRef.current) {
        clearInterval(locationTimerRef.current);
        locationTimerRef.current = null;
      }

      // 清理用户位置标记和精度圈
      if (map) {
        if (userPositionMarker) {
          map.remove(userPositionMarker);
          setUserPositionMarker(null);
        }
        if (userPositionCircle) {
          map.remove(userPositionCircle);
          setUserPositionCircle(null);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, AMapInstance]); // 依赖项只包括地图实例，不包括定位状态

  // 初始化地图
  useEffect(() => {
    // 确保代码只在客户端执行
    if (typeof window === "undefined") return;

    if (!mapRef.current) return;

    // 确保只初始化一次地图
    if (map) return;

    let mapInstance: AMap.Map | null = null;

    // 动态加载高德地图
    const loadAMap = async () => {
      const AMapLoader = (await import("@amap/amap-jsapi-loader")).default;
      return AMapLoader.load({
        key: process.env.NEXT_PUBLIC_AMAP_KEY || "", // 使用环境变量中的API密钥
        version: "2.0",
        plugins: ["AMap.Scale", "AMap.ToolBar", "AMap.Geolocation"],
      });
    };

    loadAMap()
      .then((AMap) => {
        // 保存AMap对象以便后续使用
        setAMapInstance(AMap);

        // 创建地图实例
        const instance = new AMap.Map(mapRef.current, {
          zoom: 15,
          center: [113.2815, 23.1231], // 初始中心点，需要替换为实际坐标
          resizeEnable: true,
          mapStyle:
            theme === "dark" ? "amap://styles/dark" : "amap://styles/normal", // 根据主题设置地图样式
        });

        mapInstance = instance;

        // 添加比例尺控件
        instance.addControl(new AMap.Scale());

        // 添加工具条控件
        const toolbar = new AMap.ToolBar({
          position: "RT", // 设置工具栏在右上角
        });
        instance.addControl(toolbar);

        setMap(instance);
        console.log("✅ 地图加载完成");
      })
      .catch((e) => {
        console.error("❌ 地图加载失败", e);
      });

    // 清理函数
    return () => {
      // 清理用户位置标记和精度圈
      if (userPositionMarker) {
        mapInstance?.remove(userPositionMarker);
      }
      if (userPositionCircle) {
        mapInstance?.remove(userPositionCircle);
      }

      if (mapInstance) {
        mapInstance.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时初始化一次

  // 添加景点标记
  useEffect(() => {
    // 确保代码只在客户端执行
    if (typeof window === "undefined") return;

    if (!map || !AMapInstance) return;

    // 清除现有标记
    markers.forEach((marker) => {
      map.remove(marker);
    });

    const newMarkers = attractions.map((attraction, index) => {
      const marker = new AMapInstance.Marker({
        position: attraction.position,
        title: attraction.name,
        clickable: true,
      });

      marker.on("click", () => {
        setCurrentAttractionIndex(index);
        map.setCenter(attraction.position);
      });

      map.add(marker);
      return marker;
    });

    setMarkers(newMarkers);

    // 清理函数
    return () => {
      newMarkers.forEach((marker) => {
        if (map) {
          map.remove(marker);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, AMapInstance, attractions]); // 移除markers依赖项以避免无限循环

  // 单独处理当前景点变化时的地图中心设置和入场动画
  useEffect(() => {
    if (!map || attractions.length === 0 || currentAttractionIndex < 0) return;
    map.setCenter(attractions[currentAttractionIndex].position);
    
    // 触发入场动画
    if (!swipeDirection) {
      // 只在非滑动切换时才需要重置动画状态
      setDragOffset(0);
      setIsTransitioning(false);
    }
  }, [map, attractions, currentAttractionIndex, swipeDirection]);

  // 更新上一个景点索引，用于判断切换方向
  useEffect(() => {
    // 使用 setTimeout 确保在动画开始前更新
    const timer = setTimeout(() => {
      prevAttractionIndexRef.current = currentAttractionIndex;
    }, 400); // 动画完成后更新

    return () => clearTimeout(timer);
  }, [currentAttractionIndex]);

  // 监听主题变化
  useEffect(() => {
    if (!map || !mounted) return;
    map.setMapStyle(
      theme === "dark" ? "amap://styles/dark" : "amap://styles/normal"
    );
  }, [map, theme, mounted]);

  // 切换到下一个景点
  const goToNextAttraction = useCallback(() => {
    // 确保代码只在客户端执行
    if (typeof window === "undefined") return;

    if (attractions.length === 0 || !map) return;
    // 如果当前没有选中景点，则选中第一个景点
    const nextIndex =
      currentAttractionIndex < 0
        ? 0
        : (currentAttractionIndex + 1) % attractions.length;
    setCurrentAttractionIndex(nextIndex);
    map.setCenter(attractions[nextIndex].position);
  }, [attractions, map, currentAttractionIndex]);

  // 切换到上一个景点
  const goToPreviousAttraction = useCallback(() => {
    // 确保代码只在客户端执行
    if (typeof window === "undefined") return;

    if (attractions.length === 0 || !map) return;
    // 如果当前没有选中景点，则选中最后一个景点
    const prevIndex =
      currentAttractionIndex < 0
        ? attractions.length - 1
        : (currentAttractionIndex - 1 + attractions.length) %
          attractions.length;
    setCurrentAttractionIndex(prevIndex);
    map.setCenter(attractions[prevIndex].position);
  }, [attractions, map, currentAttractionIndex]);

  // 处理触摸开始
  const handleTouchStart = useCallback((e: TouchEvent) => {
    // 如果卡片已展开或正在过渡，不处理滑动
    if (cardExpanded || isTransitioning) return;
    
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    touchEndRef.current = null;
    setDragOffset(0);
  }, [cardExpanded, isTransitioning]);

  // 处理触摸移动
  const handleTouchMove = useCallback((e: TouchEvent) => {
    // 如果卡片已展开或正在过渡，不处理滑动
    if (cardExpanded || isTransitioning || !touchStartRef.current) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    
    touchEndRef.current = {
      x: currentX,
      y: currentY,
    };

    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = currentY - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // 只有当水平滑动距离大于垂直滑动距离时，才更新拖拽偏移
    if (absDeltaX > absDeltaY) {
      // 阻止默认的滚动行为
      e.preventDefault();
      
      // 添加阻力效果：拖拽距离越大，阻力越大
      const resistance = 0.5;
      const maxDrag = 150; // 最大拖拽距离
      const offset = deltaX * resistance;
      setDragOffset(Math.max(-maxDrag, Math.min(maxDrag, offset)));
    }
  }, [cardExpanded, isTransitioning]);

  // 处理触摸结束
  const handleTouchEnd = useCallback(() => {
    // 如果卡片已展开或正在过渡，不处理滑动
    if (cardExpanded || isTransitioning) return;
    
    if (!touchStartRef.current || !touchEndRef.current) {
      setDragOffset(0);
      touchStartRef.current = null;
      touchEndRef.current = null;
      return;
    }

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // 最小滑动距离阈值
    const minSwipeDistance = 50;

    // 只有当水平滑动距离大于垂直滑动距离，并且超过阈值时，才认为是有效的水平滑动
    if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
      setIsTransitioning(true);
      
      if (deltaX > 0) {
        // 向右滑动 - 上一个景点
        setSwipeDirection('right');
        setTimeout(() => {
          goToPreviousAttraction();
          setDragOffset(0);
          setSwipeDirection(null);
          setIsTransitioning(false);
        }, 300);
      } else {
        // 向左滑动 - 下一个景点
        setSwipeDirection('left');
        setTimeout(() => {
          goToNextAttraction();
          setDragOffset(0);
          setSwipeDirection(null);
          setIsTransitioning(false);
        }, 300);
      }
    } else {
      // 回弹动画
      setDragOffset(0);
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [cardExpanded, isTransitioning, goToPreviousAttraction, goToNextAttraction]);

  // 添加和移除原生触摸事件监听器
  useEffect(() => {
    const container = cardContainerRef.current;
    if (!container) {
      console.log('Container not ready for touch events');
      return;
    }

    console.log('Adding touch event listeners to container');

    // 使用 { passive: false } 允许 preventDefault
    const options = { passive: false };

    container.addEventListener('touchstart', handleTouchStart as EventListener, options);
    container.addEventListener('touchmove', handleTouchMove as EventListener, options);
    container.addEventListener('touchend', handleTouchEnd as EventListener, options);

    return () => {
      console.log('Removing touch event listeners');
      container.removeEventListener('touchstart', handleTouchStart as EventListener);
      container.removeEventListener('touchmove', handleTouchMove as EventListener);
      container.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, attractionsLoading, currentAttractionIndex]);

  // 显示添加景点表单
  const addNewAttraction = () => {
    // 确保代码只在客户端执行
    if (typeof window === "undefined") return;

    if (!map) return;

    setShowAttractionForm(true);
  };

  // 处理景点表单提交
  const handleAttractionSubmit = useCallback((newAttraction: Attraction) => {
    setAttractions(prev => {
      const updated = [...prev, newAttraction];
      setCurrentAttractionIndex(updated.length - 1);
      return updated;
    });
    setShowAttractionForm(false);
    
    // 将地图中心移动到新添加的景点
    if (map) {
      map.setCenter(newAttraction.position);
    }

    // 显示成功提示
    toast({
      title: "景点添加成功",
      description: `景点「${newAttraction.name}」已成功添加到地图中`,
    });
  }, [map, toast]);

  // 处理景点表单取消
  const handleAttractionCancel = useCallback(() => {
    setShowAttractionForm(false);
  }, []);


  // 处理删除景点
  const handleDeleteAttraction = useCallback(async (attractionId: string) => {
    setIsDeleting(true);
    try {
      console.log('🗑️ 开始删除景点，ID:', attractionId);
      
      const response = await fetch(`/api/attractions/${attractionId}`, {
        method: 'DELETE',
      });

      console.log('📡 删除请求响应状态:', response.status);

      let result;
      try {
        const text = await response.text();
        console.log('📄 响应内容:', text);
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ 解析响应失败:', parseError);
        throw new Error('服务器返回了无效的响应格式');
      }

      if (!response.ok) {
        throw new Error(result.error || '删除景点失败');
      }

      console.log('✅ 景点删除成功');

      // 从列表中移除已删除的景点
      setAttractions(prev => prev.filter(a => a.id !== attractionId));
      
      // 如果删除的是当前景点，重置选中索引
      const deletedIndex = attractions.findIndex(a => a.id === attractionId);
      if (deletedIndex === currentAttractionIndex) {
        setCurrentAttractionIndex(0);
      } else if (deletedIndex < currentAttractionIndex) {
        setCurrentAttractionIndex(prev => Math.max(0, prev - 1));
      }

      toast({
        title: "删除成功",
        description: "景点已成功删除",
      });

      setDeleteConfirmId(null);
    } catch (error) {
      console.error('❌ 删除景点失败:', error);
      const errorMessage = error instanceof Error ? error.message : '删除景点失败';
      toast({
        title: "删除失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [attractions, currentAttractionIndex, toast]);

  // 更新用户位置标记和精度圈的函数
  const updateUserPositionMarkerAndCircle = (
    position: [number, number],
    accuracy: number
  ) => {
    if (!map || !AMapInstance) return;

    try {
      // 验证位置数据的有效性
      if (
        !position ||
        !Array.isArray(position) ||
        position.length !== 2 ||
        typeof position[0] !== "number" ||
        typeof position[1] !== "number" ||
        isNaN(position[0]) ||
        isNaN(position[1])
      ) {
        console.error("位置数据无效：", position);
        // 清除现有标记和圈，但不创建新的
        if (userPositionMarker) {
          map.remove(userPositionMarker);
          setUserPositionMarker(null);
        }
        if (userPositionCircle) {
          map.remove(userPositionCircle);
          setUserPositionCircle(null);
        }
        return;
      }

      // 确保精度值有效
      if (typeof accuracy !== "number" || isNaN(accuracy) || accuracy <= 0) {
        accuracy = 100; // 使用默认值
      }

      // 清除现有的用户位置标记和精度圈
      if (userPositionMarker) {
        map.remove(userPositionMarker);
      }
      if (userPositionCircle) {
        map.remove(userPositionCircle);
      }

      // 创建新的用户位置标记
      const marker = new AMapInstance.Marker({
        position: position,
        icon: new AMapInstance.Icon({
          // 使用自定义图标或高德默认图标
          size: new AMapInstance.Size(24, 24),
          image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
          imageSize: new AMapInstance.Size(24, 24),
        }),
        offset: new AMapInstance.Pixel(-12, -12),
        zIndex: 100,
        title: "当前位置",
      });

      // 创建精度圈
      const circle = new AMapInstance.Circle({
        center: position,
        radius: accuracy, // 使用定位精度作为半径
        strokeColor: "#3366FF",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#3366FF",
        fillOpacity: 0.2,
        zIndex: 50,
      });

      // 将标记和精度圈添加到地图
      map.add([marker, circle]);

      // 更新状态
      setUserPositionMarker(marker);
      setUserPositionCircle(circle);
    } catch (error) {
      console.error("更新位置标记和精度圈时出错：", error);
      // 发生错误时，确保清除现有标记和圈
      if (userPositionMarker) {
        map.remove(userPositionMarker);
        setUserPositionMarker(null);
      }
      if (userPositionCircle) {
        map.remove(userPositionCircle);
        setUserPositionCircle(null);
      }
    }
  };

  // 添加防抖的定位函数
  const goToCurrentLocation = () => {
    // 确保代码只在客户端执行
    if (typeof window === "undefined") return;

    if (!map || !AMapInstance) return;

    // 防抖处理：如果距离上次点击不足1秒，则忽略本次点击
    const now = Date.now();
    if (now - lastLocationClickTimeRef.current < 1000) {
      console.log("点击过于频繁，忽略本次定位请求");
      return;
    }
    lastLocationClickTimeRef.current = now;

    // 如果UI显示正在定位中，不要重复定位
    if (isLocating) {
      console.log("正在定位中，不要重复定位");
      return;
    }

    // 设置定位状态为true，按钮将显示加载中
    setIsLocating(true);

    // 设置景点索引为-1，表示不选中任何景点
    setCurrentAttractionIndex(-1);
    // 重置卡片展开状态
    setCardExpanded(false);

    // 无论是否有用户位置，都先清除之前的标记和圆圈
    if (userPositionMarker) {
      map.remove(userPositionMarker);
      setUserPositionMarker(null);
    }

    // 直接使用高德定位
    const geolocation = new AMapInstance.Geolocation({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
      showButton: false,
      showMarker: false, // 不使用默认标记，我们将创建自定义标记
      showCircle: false, // 不使用默认精度圈，我们将创建自定义精度圈
      panToLocation: true,
      zoomToAccuracy: true,
      convert: false, // 不使用高德自动转换，用gcoord手动转换
    });

    geolocation.getCurrentPosition(
      (
        status: AMap.Geolocation.SearchStatus,
        result:
          | AMap.Geolocation.GeolocationResult
          | AMap.Geolocation.ErrorStatus
      ) => {
        if (status === "complete" && "position" in result) {
          const position = result.position;
          const wgs84Point: [number, number] = [
            position.getLng(),
            position.getLat(),
          ];
          // 使用gcoord将WGS84坐标转换为GCJ02坐标
          const gcj02Point = gcoord.transform(
            wgs84Point,
            gcoord.WGS84,
            gcoord.GCJ02
          ) as [number, number];
          const geolocationResult =
            result as AMap.Geolocation.GeolocationResult;
          const accuracy = geolocationResult.accuracy || 100; // 默认精度为100米

          console.log("高德定位成功，精度：", accuracy, "米");
          console.log("WGS84坐标：", wgs84Point);
          console.log("转换后的GCJ02坐标：", gcj02Point);

          // 更新用户位置状态
          setUserPosition(gcj02Point);

          // 更新用户位置标记和精度圈
          updateUserPositionMarkerAndCircle(gcj02Point, accuracy);

          // 设置地图中心，向上偏移以适应底部空间栏
          // 将用户位置转换为像素坐标
          const pixel = map.lnglatToPixel(gcj02Point);
          // 向上偏移10像素，使用AMap.Pixel的正确方法
          const offsetPixel = new AMapInstance.Pixel(
            pixel.getX(),
            pixel.getY() + 10
          );
          // 将偏移后的像素坐标转回经纬度
          const offsetLngLat = map.pixelToLngLat(offsetPixel);
          map.setCenter(offsetLngLat);
          map.setZoom(17);

          // 重置当前选中的景点索引为-1，表示不选中任何景点
          // 注意：由于UI渲染需要有效索引，我们在渲染部分添加条件判断
        } else {
          const errorResult = result as AMap.Geolocation.ErrorStatus;
          console.error("高德定位失败，错误信息：", errorResult.message);
          console.error("错误详情：", result);

          // 即使定位失败，也要确保清除之前的标记和圈
          if (userPositionMarker) {
            map.remove(userPositionMarker);
            setUserPositionMarker(null);
          }
          if (userPositionCircle) {
            map.remove(userPositionCircle);
            setUserPositionCircle(null);
          }
        }
        setIsLocating(false);
      }
    );
  };

  // 定义控制按钮数组
  const controlButtons = [
    {
      icon: <ChevronLeft className="h-5 w-5" />,
      onClick: goToPreviousAttraction,
      label: "上一个景点",
      variant: "outline" as const,
      adminOnly: false, // 管理员和普通用户都可见
    },
    {
      icon: <ChevronRight className="h-5 w-5" />,
      onClick: goToNextAttraction,
      label: "下一个景点",
      variant: "outline" as const,
      adminOnly: false, // 管理员和普通用户都可见
    },
    {
      icon: isLocating ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <MapPin className="h-5 w-5" />
      ),
      onClick: goToCurrentLocation,
      label: isLocating ? "定位中..." : "定位当前位置",
      variant: "outline" as const,
      disabled: isLocating, // 定位中时禁用按钮
      adminOnly: false, // 管理员和普通用户都可见
    },
    {
      icon: <List className="h-5 w-5" />,
      onClick: () => setShowAttractionsList(!showAttractionsList),
      label: "景点列表",
      variant: "outline" as const,
      adminOnly: false, // 管理员和普通用户都可见
    },
    {
      icon: <Plus className="h-5 w-5" />,
      onClick: addNewAttraction,
      label: "添加新景点",
      variant: "default" as const,
      adminOnly: true, // 仅管理员可见
    },
  ];

  return (
    <div 
      className="relative w-full -mt-16 pt-16" 
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
      {/* 地图容器 */}
      <div ref={mapRef} className="w-full h-full" />

      {/* 底部控制栏 */}
      <div className={`absolute left-0 right-0 flex justify-center`} style={{ bottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
        <div className="flex space-x-2 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg">
          {/* 渲染控制按钮 - 先根据管理员权限过滤，再映射渲染 */}
          {controlButtons
            .filter(
              (button) =>
                !button.adminOnly || (button.adminOnly && user?.isAdmin)
            )
            .map((button, index) => (
              <Button
                key={index}
                variant={button.variant}
                size="icon"
                className="rounded-full"
                onClick={button.onClick}
                title={button.label}
                disabled={button.disabled}
              >
                {button.icon}
              </Button>
            ))}
        </div>
      </div>

      {/* 景点加载状态 */}
      {attractionsLoading && (
        <div className="absolute left-0 right-0 flex justify-center" style={{ bottom: 'max(6rem, calc(env(safe-area-inset-bottom, 2rem) + 4rem))' }}>
          <Card className="bg-background/95 backdrop-blur-sm shadow-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在加载景点数据...
            </div>
          </Card>
        </div>
      )}

      {/* 景点信息浮框 - 使用新的 AttractionCard 组件 */}
      {!attractionsLoading && attractions.length > 0 && currentAttractionIndex >= 0 && (
        <div
          ref={cardContainerRef}
          className={
            cardExpanded
              ? "fixed inset-0 z-[200]"
              : "absolute left-0 right-0 flex justify-center overflow-hidden"
          }
          style={!cardExpanded ? { bottom: 'max(6rem, calc(env(safe-area-inset-bottom, 2rem) + 4rem))' } : undefined}
        >
          <div
            key={`card-${currentAttractionIndex}`}
            className="relative w-full flex justify-center"
            style={
              !cardExpanded
                ? {
                    transform: swipeDirection 
                      ? swipeDirection === 'left' 
                        ? 'translateX(-120%) scale(0.9)' 
                        : 'translateX(120%) scale(0.9)'
                      : dragOffset !== 0
                        ? `translateX(${dragOffset}px) scale(${1 - Math.abs(dragOffset) / 600})`
                        : 'translateX(0) scale(1)', // 新卡片从正常位置开始
                    opacity: swipeDirection 
                      ? 0 
                      : Math.max(0.4, 1 - Math.abs(dragOffset) / 200),
                    transition: swipeDirection || (!touchStartRef.current && dragOffset !== 0)
                      ? 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      : 'none',
                    willChange: 'transform, opacity',
                    filter: dragOffset !== 0 ? `blur(${Math.abs(dragOffset) / 50}px)` : 'none',
                    // 新卡片的初始位置动画
                    animation: prevAttractionIndexRef.current !== currentAttractionIndex && prevAttractionIndexRef.current !== -1
                      ? (() => {
                          // 判断切换方向
                          const isForward = prevAttractionIndexRef.current < currentAttractionIndex || 
                                          (prevAttractionIndexRef.current === attractions.length - 1 && currentAttractionIndex === 0);
                          return isForward 
                            ? 'slideInFromRight 0.35s cubic-bezier(0.4, 0.0, 0.2, 1)' 
                            : 'slideInFromLeft 0.35s cubic-bezier(0.4, 0.0, 0.2, 1)';
                        })()
                      : 'none',
                  }
                : undefined // 展开时不应用变换样式
            }
          >
            <AttractionCard
              attraction={attractions[currentAttractionIndex]}
              userPosition={userPosition}
              expanded={cardExpanded}
              onClose={() => {
                // 直接切换状态，让 AttractionCard 组件负责动画
                setCardExpanded(!cardExpanded);
              }}
              AMapInstance={AMapInstance}
            />
          </div>
        </div>
      )}

      {/* 景点列表浮框 */}
      {showAttractionsList && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
          <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm shadow-lg flex flex-col gap-1" style={{ maxHeight: '85vh' }}>
            {/* 标题栏 - 紧凑版 */}
            <div className="px-4 py-2.5 border-b border-border/50">
              <h2 className="text-lg font-semibold">景点列表</h2>
            </div>
            
            {/* 过滤和排序栏 - 移动端优化版 */}
            <div className="px-4 py-2 border-b border-border/50">
              <div className="grid grid-cols-3 gap-2 sm:gap-1.5">
                {/* 类型过滤下拉菜单 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 sm:h-7 justify-between px-2 text-xs min-w-0 touch-manipulation">
                      <div className="flex items-center gap-1 min-w-0">
                        <Filter className="h-3 w-3 flex-shrink-0" />
                        <span className="text-xs truncate min-w-0">
                          {selectedTypeFilter === 'ALL' 
                            ? '全部' 
                            : attractionTypeConfig[selectedTypeFilter]?.label}
                        </span>
                      </div>
                      <ChevronDown className="h-3 w-3 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-28 sm:w-32" sideOffset={4}>
                    <DropdownMenuRadioGroup 
                      value={selectedTypeFilter} 
                      onValueChange={(value) => setSelectedTypeFilter(value as AttractionType | 'ALL')}
                    >
                      <DropdownMenuRadioItem value="ALL">
                        全部类型
                      </DropdownMenuRadioItem>
                      {Object.entries(attractionTypeConfig).map(([type, config]) => (
                        <DropdownMenuRadioItem key={type} value={type}>
                          {config.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* 打卡状态过滤 - 仅登录用户显示，未登录时显示占位 */}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 sm:h-7 justify-between px-2 text-xs min-w-0 touch-manipulation">
                        <div className="flex items-center gap-1 min-w-0">
                          <Check className="h-3 w-3 flex-shrink-0" />
                          <span className="text-xs truncate min-w-0">
                            {checkInFilter === 'ALL' && '全部'}
                            {checkInFilter === 'CHECKED' && '已打卡'}
                            {checkInFilter === 'UNCHECKED' && '未打卡'}
                          </span>
                        </div>
                        <ChevronDown className="h-3 w-3 flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-24 sm:w-28" sideOffset={4}>
                      <DropdownMenuRadioGroup 
                        value={checkInFilter} 
                        onValueChange={(value) => setCheckInFilter(value as 'ALL' | 'CHECKED' | 'UNCHECKED')}
                      >
                        <DropdownMenuRadioItem value="ALL">
                          全部
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="CHECKED">
                          已打卡
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="UNCHECKED">
                          未打卡
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="h-8 sm:h-7"></div>
                )}

                {/* 排序下拉菜单 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 sm:h-7 justify-between px-2 text-xs min-w-0 touch-manipulation">
                      <div className="flex items-center gap-1 min-w-0">
                        <ArrowUpDown className="h-3 w-3 flex-shrink-0" />
                        <span className="text-xs truncate min-w-0">
                          {sortBy === 'DEFAULT' && '默认'}
                          {sortBy === 'DISTANCE' && '距离'}
                          {sortBy === 'CHECKINS' && '人数'}
                        </span>
                      </div>
                      <ChevronDown className="h-3 w-3 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-28 sm:w-32" sideOffset={4}>
                    <DropdownMenuRadioGroup 
                      value={sortBy} 
                      onValueChange={(value) => setSortBy(value as 'DEFAULT' | 'DISTANCE' | 'CHECKINS')}
                    >
                      <DropdownMenuRadioItem value="DEFAULT">
                        默认排序
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="DISTANCE" disabled={!userPosition}>
                        距离排序
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="CHECKINS">
                        打卡人数
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* 景点列表区域 - 可滚动 */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <div className="space-y-1.5">
                {attractionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在加载景点数据...
                    </div>
                  </div>
                ) : (() => {
                  // 格式化距离显示
                  const formatDistance = (dist: number | null): string => {
                    if (dist === null) return "未知";
                    if (dist >= 1000) return `${(dist / 1000).toFixed(1)}km`;
                    return `${Math.round(dist)}m`;
                  };

                  // 计算每个景点的距离和打卡状态（用于过滤和排序）
                  const attractionsWithMeta = attractions.map((attraction, index) => {
                    let distance: number | null = null;
                    
                    if (userPosition && AMapInstance) {
                      const point1 = new AMapInstance.LngLat(userPosition[0], userPosition[1]);
                      const point2 = new AMapInstance.LngLat(attraction.position[0], attraction.position[1]);
                      distance = point1.distance(point2);
                    }

                    const hasCheckedIn = attractionCheckInStatus[attraction.id] || false;

                    return {
                      attraction,
                      index,
                      distance,
                      hasCheckedIn,
                    };
                  });

                  // 过滤
                  let filtered = attractionsWithMeta;
                  
                  // 类型过滤
                  if (selectedTypeFilter !== 'ALL') {
                    filtered = filtered.filter(item => item.attraction.type === selectedTypeFilter);
                  }
                  
                  // 打卡状态过滤
                  if (user && checkInFilter !== 'ALL') {
                    filtered = filtered.filter(item => {
                      if (checkInFilter === 'CHECKED') return item.hasCheckedIn;
                      if (checkInFilter === 'UNCHECKED') return !item.hasCheckedIn;
                      return true;
                    });
                  }

                  // 排序
                  if (sortBy === 'DISTANCE' && userPosition) {
                    filtered = [...filtered].sort((a, b) => {
                      if (a.distance === null) return 1;
                      if (b.distance === null) return -1;
                      return a.distance - b.distance;
                    });
                  } else if (sortBy === 'CHECKINS') {
                    // 注意：目前没有打卡人数数据，这里预留接口
                    // 后续可以通过 API 获取每个景点的打卡人数
                    filtered = [...filtered].sort((a, b) => {
                      // 临时使用打卡状态排序，已打卡的排在前面
                      if (a.hasCheckedIn === b.hasCheckedIn) return 0;
                      return a.hasCheckedIn ? -1 : 1;
                    });
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        没有符合条件的景点
                      </div>
                    );
                  }

                  return filtered.map(({ attraction, index, distance, hasCheckedIn }) => (
                    <div
                      key={attraction.id}
                      className={`p-2.5 rounded-lg transition-colors ${
                        index === currentAttractionIndex
                          ? "bg-primary/10 border border-primary"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <div 
                        className="cursor-pointer"
                        onClick={() => {
                          setCurrentAttractionIndex(index);
                          if (map) {
                            map.setCenter(attraction.position);
                          }
                          setShowAttractionsList(false);
                        }}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-medium flex-grow">{attraction.name}</h3>
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
                        <p className="text-sm text-muted-foreground truncate mb-1.5">
                          {attraction.description}
                        </p>
                        {/* 距离和打卡状态 */}
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            {formatDistance(distance)}
                          </Badge>
                          {user && (
                            <Badge 
                              variant={hasCheckedIn ? "default" : "secondary"}
                              className={cn(
                                "text-xs",
                                hasCheckedIn 
                                  ? "bg-green-500/90 hover:bg-green-500 text-white" 
                                  : "bg-gray-500/90 hover:bg-gray-500 text-white"
                              )}
                            >
                              {hasCheckedIn ? "已打卡" : "未打卡"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {user?.isAdmin && (
                        <div className="mt-1.5 pt-1.5 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(attraction.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除景点
                          </Button>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            {/* 底部关闭按钮 */}
            <div className="p-4 border-t border-border/50">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAttractionsList(false)}
              >
                <X className="h-4 w-4 mr-2" />
                关闭
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 添加景点表单 */}
      {showAttractionForm && map && (
        <AttractionForm
          position={[map.getCenter().getLng(), map.getCenter().getLat()]}
          onSubmitSuccess={handleAttractionSubmit}
          onCancel={handleAttractionCancel}
        />
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除景点</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除该景点数据，且无法恢复。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                if (deleteConfirmId) {
                  handleDeleteAttraction(deleteConfirmId);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  删除中...
                </>
              ) : (
                '确认删除'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
