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
  rewardCoins?: number;
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

// 打卡景点
export async function checkInAttraction(attractionId: string, data: {
  distance?: number;
  longitude?: number;
  latitude?: number;
}): Promise<{ success: boolean; coinsEarned: number }> {
  try {
    console.log('🎯 发起打卡请求:', { attractionId, data });
    
    const response = await fetch(`/api/attractions/${attractionId}/check-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log('📡 打卡响应状态:', response.status, response.statusText);

    // 读取响应内容
    const result = await response.json();
    console.log('📦 打卡响应数据:', result);

    if (!response.ok) {
      throw new Error(result.error || result.details || `打卡失败: ${response.statusText}`);
    }
    
    if (!result.success) {
      throw new Error(result.error || "打卡失败");
    }

    return result.data;
  } catch (error) {
    console.error('❌ 打卡服务错误:', error);
    throw error;
  }
}

// 获取打卡状态
export async function getCheckInStatus(attractionId: string): Promise<{
  hasCheckedIn: boolean;
  checkInData?: {
    checkedInAt: string;
    coinsEarned: number;
  };
}> {
  const response = await fetch(`/api/attractions/${attractionId}/check-in-status`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "获取打卡状态失败");
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || "获取打卡状态失败");
  }

  return result.data;
}
