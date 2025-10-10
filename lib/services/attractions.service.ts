/**
 * 景点数据服务 - 客户端API
 */

import { AttractionDetail } from "@/components/AttractionCard";
import { cache, CACHE_KEYS } from "@/lib/cache";

// 景点数据缓存键
const ATTRACTIONS_CACHE_KEY = CACHE_KEYS.ATTRACTIONS_CLIENT;

// 获取所有景点数据
export async function getAllAttractions(): Promise<AttractionDetail[]> {
  // 先尝试从缓存获取
  const cached = cache.get<AttractionDetail[]>(ATTRACTIONS_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const response = await fetch("/api/attractions", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "获取景点数据失败");
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || "获取景点数据失败");
  }

  // 新的数据结构已经是完整的景点对象数组
  const attractions = result.data as AttractionDetail[];
  
  // 缓存结果（缓存3分钟）
  cache.set(ATTRACTIONS_CACHE_KEY, attractions, 3 * 60 * 1000);
  
  return attractions;
}

// 创建新的景点数据（需要管理员权限）
export async function createAttraction(attractionData: {
  key: string;
  name: string;
  position: [number, number];
  description: string;
  type: string;
  media?: Array<{
    type: "image" | "video";
    url: string;
    title?: string;
  }>;
  unlockDistance?: number;
}): Promise<AttractionDetail> {
  const response = await fetch("/api/attractions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(attractionData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "创建景点数据失败");
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || "创建景点数据失败");
  }

  // 清除缓存
  cache.delete(ATTRACTIONS_CACHE_KEY);

  return result.data;
}

// 清除景点数据缓存
export function clearAttractionsCache() {
  cache.delete(ATTRACTIONS_CACHE_KEY);
}
