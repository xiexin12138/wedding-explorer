"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import gcoord from "gcoord";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  List,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/components/UserProvider";

// 导入新的 AttractionCard 组件和相关类型
import {
  AttractionCard,
  AttractionType,
  AttractionDetail,
} from "@/components/AttractionCard";

// 使用新的景点类型
type Attraction = AttractionDetail;

// 导出类型配置供其他组件使用
export const attractionTypeConfig = {
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

// 示例景点数据
const SAMPLE_ATTRACTIONS: Attraction[] = [
  {
    id: "1",
    name: "陈桥文化广场",
    position: [113.2815, 23.1231], // 这里使用示例坐标，需要替换为实际坐标
    description: "文化广场，提供休闲娱乐场所",
    type: AttractionType.SCENIC,
    media: [
      {
        type: "image",
        url: "https://example.com/images/cultural-square-1.jpg",
        title: "文化广场全景",
      },
      {
        type: "image",
        url: "https://example.com/images/cultural-square-2.jpg",
        title: "文化广场活动区",
      },
    ],
    unlockDistance: 100,
  },
  {
    id: "2",
    name: "陈桥村",
    position: [113.2825, 23.1241], // 示例坐标
    description: "历史悠久的村落",
    type: AttractionType.SCENIC,
    media: [
      {
        type: "image",
        url: "https://example.com/images/village-1.jpg",
        title: "村落全景",
      },
      {
        type: "video",
        url: "https://example.com/videos/village-history.mp4",
        title: "村落历史介绍",
      },
    ],
    unlockDistance: 150,
  },
  {
    id: "3",
    name: "人民美食广场",
    position: [113.2835, 23.1251], // 示例坐标
    description: "提供各种当地特色美食的广场",
    type: AttractionType.FOOD,
    media: [
      {
        type: "image",
        url: "https://example.com/images/food-court-1.jpg",
        title: "美食广场全景",
      },
      {
        type: "image",
        url: "https://example.com/images/food-court-2.jpg",
        title: "特色小吃",
      },
    ],
    unlockDistance: 80,
  },
  {
    id: "4",
    name: "深圳万象城",
    position: [114.11056116258436, 22.538851422581348], // 示例坐标
    description: "极尽奢华的超级老牌商场",
    type: AttractionType.SHOPPING,
    media: [
      {
        type: "image",
        url: "https://example.com/images/food-court-1.jpg",
        title: "美食广场全景",
      },
      {
        type: "image",
        url: "https://example.com/images/food-court-2.jpg",
        title: "特色小吃",
      },
    ],
    unlockDistance: 80,
  },
];

export function MapExplorer() {
  const mapRef = useRef<HTMLDivElement>(null);

  // 所有状态声明放在组件顶部
  const [map, setMap] = useState<AMap.Map | null>(null);
  const [AMapInstance, setAMapInstance] = useState<typeof AMap | null>(null);
  const [attractions, setAttractions] =
    useState<Attraction[]>(SAMPLE_ATTRACTIONS);
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
  const { theme } = useTheme();
  const { user } = useUser();

  // 在客户端挂载后更新状态
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // 单独处理当前景点变化时的地图中心设置
  useEffect(() => {
    if (!map || attractions.length === 0 || currentAttractionIndex < 0) return;
    map.setCenter(attractions[currentAttractionIndex].position);
  }, [map, attractions, currentAttractionIndex]);

  // 监听主题变化
  useEffect(() => {
    if (!map || !mounted) return;
    map.setMapStyle(
      theme === "dark" ? "amap://styles/dark" : "amap://styles/normal"
    );
  }, [map, theme, mounted]);

  // 切换到下一个景点
  const goToNextAttraction = () => {
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
  };

  // 切换到上一个景点
  const goToPreviousAttraction = () => {
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
  };

  // 添加新景点
  const addNewAttraction = () => {
    // 确保代码只在客户端执行
    if (typeof window === "undefined") return;

    if (!map) return;

    const center = map.getCenter();
    const newAttraction: Attraction = {
      id: `new-${Date.now()}`,
      name: "新景点",
      position: [center.getLng(), center.getLat()],
      description: "新添加的景点",
      type: AttractionType.SCENIC, // 默认为景点类型
      unlockDistance: 100, // 默认解锁距离为100米
      media: [], // 默认没有媒体内容
    };

    setAttractions([...attractions, newAttraction]);
    setCurrentAttractionIndex(attractions.length);
  };

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

      {/* 景点信息浮框 - 使用新的 AttractionCard 组件 */}
      {attractions.length > 0 && currentAttractionIndex >= 0 && (
        <div
          className={
            cardExpanded
              ? "fixed inset-0 z-[200]"
              : "absolute left-0 right-0 flex justify-center"
          }
          style={!cardExpanded ? { bottom: 'max(6rem, calc(env(safe-area-inset-bottom, 2rem) + 4rem))' } : undefined}
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
      )}

      {/* 景点列表浮框 */}
      {showAttractionsList && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-sm shadow-lg">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">景点列表</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAttractionsList(false)}
                >
                  关闭
                </Button>
              </div>
              <div className="space-y-2">
                {attractions.map((attraction, index) => (
                  <div
                    key={attraction.id}
                    className={`p-3 rounded-lg cursor-pointer ${
                      index === currentAttractionIndex
                        ? "bg-primary/10 border border-primary"
                        : "bg-muted"
                    }`}
                    onClick={() => {
                      setCurrentAttractionIndex(index);
                      if (map) {
                        map.setCenter(attraction.position);
                      }
                      setShowAttractionsList(false);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{attraction.name}</h3>
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
                    <p className="text-sm text-muted-foreground truncate">
                      {attraction.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
