"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCallback, useEffect, useRef, useState } from "react";
import { getDictionaryValueByKey } from "@/features/dictionary";
import { cn } from "@/lib/utils";

interface TimelineItem {
  title: string;
  date: string;
  description: string;
  tag: string;
  variant?: "default" | "secondary" | "destructive" | null | undefined;
}

// 默认的兜底数据（空数组，用于显示空状态）
const defaultTimelineData: TimelineItem[] = [];

function Timeline() {
  const timelineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 设置页面标题
  useEffect(() => {
    document.title = "活动时间安排 - Xie & Feng Wedding";
  }, []);

  // 解析日期字符串为Date对象
  const parseDate = (dateStr: string): Date => {
    // 处理不同的日期格式
    const cleanDateStr = dateStr.trim();

    // 如果只有日期没有时间，添加默认时间
    if (cleanDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(cleanDateStr + " 00:00");
    }

    // 如果有日期和时间
    if (cleanDateStr.match(/^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}$/)) {
      return new Date(cleanDateStr);
    }

    return new Date(cleanDateStr);
  };

  // 找到当前应该高亮的时间线项目
  const getCurrentTimelineIndex = useCallback((): number => {
    const now = new Date();

    // 找到最接近当前时间且不超过当前时间的项目
    let currentIndex = -1;
    let closestPastDate: Date | null = null;

    timelineData.forEach((item, index) => {
      const itemDate = parseDate(item.date);

      if (itemDate <= now) {
        if (!closestPastDate || itemDate > closestPastDate) {
          closestPastDate = itemDate;
          currentIndex = index;
        }
      }
    });

    // 如果没有找到过去的日期，返回第一个未来的日期
    if (currentIndex === -1) {
      for (let i = 0; i < timelineData.length; i++) {
        const itemDate = parseDate(timelineData[i].date);
        if (itemDate > now) {
          return i;
        }
      }
    }

    return currentIndex;
  }, [timelineData]);

  // 加载时间线数据
  useEffect(() => {
    const loadTimelineData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 从数据字典获取timeline数据
        const timelineValue = await getDictionaryValueByKey("timeline");

        if (timelineValue?.value) {
          // 解析JSON数据
          const parsedData = JSON.parse(timelineValue.value) as TimelineItem[];
          setTimelineData(parsedData);
        } else {
          // 如果没有数据，使用默认数据
          setTimelineData(defaultTimelineData);
        }
      } catch (error) {
        console.error("加载时间线数据失败:", error);
        setError("加载时间线数据失败");
        // 出错时使用默认数据
        setTimelineData(defaultTimelineData);
      } finally {
        setLoading(false);
      }
    };

    loadTimelineData();
  }, []);

  // 自动滚动到当前时间线项目
  useEffect(() => {
    if (loading || timelineData.length === 0) return;

    const currentIndex = getCurrentTimelineIndex();

    if (currentIndex >= 0 && timelineRefs.current[currentIndex]) {
      // 延迟滚动以确保组件已完全渲染
      setTimeout(() => {
        timelineRefs.current[currentIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    }
  }, [loading, timelineData, getCurrentTimelineIndex]);

  const currentIndex = getCurrentTimelineIndex();

  // 加载状态
  if (loading) {
    return (
      <div className="relative p-4 pl-8">
        <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-8">
          {[1, 2, 3].map((index) => (
            <div key={index} className="relative">
              <div className="absolute left-[-34px] top-1 h-4 w-4 rounded-full bg-gray-300 border-4 border-background shadow-md animate-pulse" />
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="h-6 bg-gray-300 rounded w-32"></div>
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-300 rounded w-16"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 空状态
  if (!loading && timelineData.length === 0) {
    return (
      <div className="relative p-4 pl-8">
        <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            暂无时间线数据
          </h3>
          <p className="text-sm text-muted-foreground">
            {error || "请联系管理员添加时间线安排"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-4 pl-8">
      {/* 垂直连接线 */}
      <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-8">
        {timelineData.map((item, index) => {
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;

          return (
            <div
              key={index}
              className="relative"
              ref={(el) => {
                timelineRefs.current[index] = el;
              }}
            >
              {/* 时间线上的节点 */}
              <div
                className={`absolute left-[-34px] top-1 h-4 w-4 rounded-full border-4 border-background shadow-md transition-colors duration-300 ${
                  isCurrent
                    ? "bg-green-500 animate-pulse"
                    : isPast
                    ? "bg-primary"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              />

              <Card
                className={cn(
                  "transition-all duration-300 hover:shadow-lg border border-transparent",
                  isCurrent
                    ? "bg-emerald-50/70 border-emerald-200 shadow-emerald-100/90 dark:bg-emerald-900/20 dark:border-emerald-700"
                    : "hover:border-muted shadow-sm"
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle
                      className={cn(
                        "text-lg transition-colors",
                        isCurrent && "text-emerald-700 dark:text-emerald-300"
                      )}
                    >
                      {item.title}
                    </CardTitle>
                    <time
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isCurrent
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.date}
                    </time>
                  </div>
                  <Badge
                    variant={isCurrent ? "secondary" : item.variant || undefined}
                    className={cn(
                      "w-fit transition-colors",
                      isCurrent &&
                        "bg-emerald-500/90 text-white hover:bg-emerald-600 dark:bg-emerald-500"
                    )}
                  >
                    {item.tag}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TimelinePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">活动时间安排</h1>
        <p className="text-muted-foreground break-words overflow-wrap-anywhere">
          下面展示婚礼活动的时间安排，当前正在进行的活动将会高亮展示
        </p>
      </div>
      <Timeline />
    </div>
  );
}
