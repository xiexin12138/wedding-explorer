"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, ChevronLeft, ChevronRight, MapPin, List } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import gcoord from "gcoord";

// 定义景点类型
interface Attraction {
  id: string;
  name: string;
  position: [number, number]; // 经纬度坐标
  description: string;
}

// 示例景点数据
const SAMPLE_ATTRACTIONS: Attraction[] = [
  {
    id: "1",
    name: "陈桥文化广场",
    position: [113.2815, 23.1231], // 这里使用示例坐标，需要替换为实际坐标
    description: "文化广场，提供休闲娱乐场所",
  },
  {
    id: "2",
    name: "陈桥村",
    position: [113.2825, 23.1241], // 示例坐标
    description: "历史悠久的村落",
  },
  {
    id: "3",
    name: "人民广场",
    position: [113.2835, 23.1251], // 示例坐标
    description: "城市中心广场",
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
  const { user } = useUser();

  // 初始化地图
  useEffect(() => {
    // 确保代码只在客户端执行
    if (typeof window === "undefined") return;

    if (!mapRef.current) return;

    // 确保只初始化一次地图
    if (map) return;

    let mapInstance: AMap.Map | null = null;

    // 设置安全密钥（如果有的话）
    if (process.env.NEXT_PUBLIC_AMAP_SECURITY_KEY) {
      (
        window as typeof window & {
          _AMapSecurityConfig?: { securityJsCode: string };
        }
      )._AMapSecurityConfig = {
        securityJsCode: process.env.NEXT_PUBLIC_AMAP_SECURITY_KEY,
      };
      console.log(
        "window._AMapSecurityConfig",
        (
          window as typeof window & {
            _AMapSecurityConfig?: { securityJsCode: string };
          }
        )._AMapSecurityConfig
      );
    } else {
      console.log("加载失败");
    }

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
        });

        mapInstance = instance;

        // 添加比例尺控件
        instance.addControl(new AMap.Scale());

        // 添加工具条控件
        const toolbar = new AMap.ToolBar({
          position: "RT", // 设置工具栏在右上角
        });
        instance.addControl(toolbar);

        // 添加定位控件
        const geolocation = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 15000, // 增加超时时间
          maximumAge: 0, // 不使用浏览器原生定位的缓存时间，毫秒
          convert: true, // 是否将定位结果转换为高德坐标
          position: "RT", // 右上角
          offset: [15, 85], // 缩略图距离悬停位置的像素距离
          panToLocation: true, // 定位成功后是否自动移动到响应位置
          zoomToAccuracy: true, // 定位成功后是否自动调整级别
        });

        // 添加定位回调
        geolocation.on("complete", (data: AMap.Geolocation.GeolocationResult) => {
          console.log("定位成功", data);
          // 可以在这里处理定位成功后的逻辑
          // 例如：显示当前位置标记、更新位置信息等
        });

        geolocation.on("error", (error: AMap.Geolocation.ErrorStatus) => {
          console.error("定位失败", error);
          // 可以在这里处理定位失败后的逻辑
          // 例如：显示错误提示、使用备用定位方案等
        });

        instance.addControl(geolocation);

        setMap(instance);
        
      })
      .catch((e) => {
        console.error("地图加载失败", e);
      })

    // 清理函数
    return () => {
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
    if (!map || attractions.length === 0) return;
    map.setCenter(attractions[currentAttractionIndex].position);
  }, [map, attractions, currentAttractionIndex]);

  // 切换到下一个景点
  const goToNextAttraction = () => {
    // 确保代码只在客户端执行
    if (typeof window === "undefined") return;

    if (attractions.length === 0 || !map) return;
    const nextIndex = (currentAttractionIndex + 1) % attractions.length;
    setCurrentAttractionIndex(nextIndex);
    map.setCenter(attractions[nextIndex].position);
  };

  // 切换到上一个景点
  const goToPreviousAttraction = () => {
    // 确保代码只在客户端执行
    if (typeof window === "undefined") return;

    if (attractions.length === 0 || !map) return;
    const prevIndex =
      (currentAttractionIndex - 1 + attractions.length) % attractions.length;
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
    };

    setAttractions([...attractions, newAttraction]);
    setCurrentAttractionIndex(attractions.length);
  };

  // 回到当前位置
  const goToCurrentLocation = () => {
    // 确保代码只在客户端执行
    if (typeof window === "undefined") return;

    if (!map || !AMapInstance) return;

    // 方案1: 使用浏览器原生定位API + gcoord转换
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const wgs84Point: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];

          // 使用gcoord转换为GCJ02坐标
          const gcj02Point = gcoord.transform(
            wgs84Point,
            gcoord.WGS84,
            gcoord.GCJ02
          ) as [number, number];

          console.log("浏览器定位成功，精度：", position.coords.accuracy, "米");
          console.log("原始坐标(WGS84)：", wgs84Point);
          console.log("转换后坐标(GCJ02)：", gcj02Point);

          // 创建标记显示当前位置
          const marker = new AMapInstance.Marker({
            position: gcj02Point,
            title: "当前位置",
            icon: "//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png",
          });
          map.add(marker);

          // 设置地图中心和缩放级别
          map.setCenter(gcj02Point);
          map.setZoom(16);
        },
        (error) => {
          console.error("浏览器定位失败：", error.message);
          // 降级到高德定位
          fallbackToAmapGeolocation();
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } else {
      // 浏览器不支持原生定位，使用高德定位
      fallbackToAmapGeolocation();
    }

    // 高德定位备用方案
    function fallbackToAmapGeolocation() {
      if (!map || !AMapInstance) {
        console.warn("地图实例或高德定位实例不存在，无法使用高德定位");
        return;
      }

      const geolocation = new AMapInstance.Geolocation({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        showButton: false,
        showMarker: true,
        showCircle: true,
        panToLocation: true,
        zoomToAccuracy: true,
        convert: true, // 让高德自动转换坐标
      });

      // 添加定位回调
      geolocation.on("complete", (data: AMap.Geolocation.GeolocationResult) => {
        console.log("高德定位回调成功", data);
        // 可以在这里处理定位成功后的逻辑
        if (data && data.position) {
          const position = data.position;
          const gcj02Point: [number, number] = [
            position.getLng(),
            position.getLat(),
          ];
          console.log("高德定位回调成功，精度：", data.accuracy, "米");
          console.log("高德回调转换后坐标(GCJ02)：", gcj02Point);
          
          // 创建标记显示当前位置
          const marker = new AMapInstance.Marker({
            position: gcj02Point,
            title: "当前位置",
            icon: "//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png",
          });
          map.add(marker);
          
          // 设置地图中心和缩放级别
          map.setCenter(gcj02Point);
          map.setZoom(16);
        }
      });

      geolocation.on("error", (error: AMap.Geolocation.ErrorStatus) => {
        console.error("高德定位回调失败", error);
        // 可以在这里处理定位失败后的逻辑
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
            const gcj02Point: [number, number] = [
              position.getLng(),
              position.getLat(),
            ];
            const geolocationResult =
              result as AMap.Geolocation.GeolocationResult;
            console.log(
              "高德定位成功，精度：",
              geolocationResult.accuracy,
              "米"
            );
            console.log("高德转换后坐标(GCJ02)：", gcj02Point);
            map.setCenter(gcj02Point);
          } else {
            const errorResult = result as AMap.Geolocation.ErrorStatus;
            console.error("高德定位失败，错误信息：", errorResult.message);
            console.error("错误详情：", result);
          }
        }
      );
    }
  };

  return (
    <div className="relative w-full h-screen -mt-16 pt-16">
      {/* 地图容器 */}
      <div ref={mapRef} className="w-full h-full" />

      {/* 底部控制栏 */}
      <div className={`absolute left-0 right-0 flex justify-center bottom-8`}>
        <div className="flex space-x-2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={goToPreviousAttraction}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={goToCurrentLocation}
          >
            <MapPin className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={goToNextAttraction}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setShowAttractionsList(!showAttractionsList)}
          >
            <List className="h-5 w-5" />
          </Button>
          {/* 添加景点按钮 */}
          {user?.isAdmin && (
            <Button
              variant="default"
              size="icon"
              className="rounded-full"
              onClick={addNewAttraction}
            >
              <Plus className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      {/* 景点信息浮框 */}
      {attractions.length > 0 && (
        <div className="absolute left-0 right-0 flex justify-center bottom-24">
          <Card className="p-4 w-11/12 max-w-md bg-white/90 backdrop-blur-sm shadow-lg">
            <h3 className="text-lg font-bold">
              {attractions[currentAttractionIndex].name}
            </h3>
            <p className="text-sm text-gray-600">
              {attractions[currentAttractionIndex].description}
            </p>
          </Card>
        </div>
      )}

      {/* 景点列表浮框 */}
      {showAttractionsList && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-sm shadow-lg">
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
                        : "bg-gray-100"
                    }`}
                    onClick={() => {
                      setCurrentAttractionIndex(index);
                      if (map) {
                        map.setCenter(attraction.position);
                      }
                      setShowAttractionsList(false);
                    }}
                  >
                    <h3 className="font-medium">{attraction.name}</h3>
                    <p className="text-sm text-gray-600 truncate">
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
