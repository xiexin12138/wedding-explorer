/**
 * 字典服务 - 客户端API
 */

import { SystemSetting } from "@/app/generated/prisma";
import { cache, CACHE_KEYS } from "@/lib/cache";

// 获取所有字典项
export async function getAllDictionaryItems() {
  // 先尝试从缓存获取
  const cached = cache.get<SystemSetting[]>(CACHE_KEYS.DICTIONARY_ITEMS);
  if (cached) {
    return cached;
  }

  const response = await fetch("/api/admin/settings/dictionary", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "获取字典项失败");
  }

  const data = await response.json();
  
  // 缓存结果（缓存10分钟）
  cache.set(CACHE_KEYS.DICTIONARY_ITEMS, data, 10 * 60 * 1000);
  
  return data;
}

// 获取单个字典项
export async function getDictionaryItem(id: string) {
  const response = await fetch(`/api/admin/settings/dictionary/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "获取字典项失败");
  }

  return response.json();
}

// 通过key获取字典项的值
export async function getDictionaryValueByKey(key: string) {
  const response = await fetch(`/api/admin/settings/dictionary/key/${key}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "获取字典项失败");
  }

  const result = await response.json();
  return result.value; // 直接返回值而不是整个对象
}

// 创建字典项
export async function createDictionaryItem(data: {
  key: string;
  displayName: string;
  value?: string;
  description?: string;
  valueType?: string;
}) {
  const response = await fetch("/api/admin/settings/dictionary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "创建字典项失败");
  }

  return response.json();
}

// 更新字典项
export async function updateDictionaryItem(
  id: string,
  data: Partial<{
    key: string;
    displayName: string;
    value: string;
    description: string;
    valueType: string;
    isEnabled: boolean;
    sortOrder: number;
  }>
) {
  const response = await fetch(`/api/admin/settings/dictionary/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "更新字典项失败");
  }

  return response.json();
}

// 删除字典项
export async function deleteDictionaryItem(id: string) {
  const response = await fetch(`/api/admin/settings/dictionary/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "删除字典项失败");
  }

  return response.json();
}

// 按分类获取字典项
export async function getDictionaryItemsByCategory() {
  const items = await getAllDictionaryItems();
  
  // 按分类分组
  const groupedItems = items.reduce((acc: Record<string, SystemSetting[]>, item: SystemSetting) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});
  
  return groupedItems;
}

// 获取系统设置字典项
export async function getSystemDictionaryItems() {
  try {
    const items = await getAllDictionaryItems();
    return items.filter((item: SystemSetting) => item.category === 'SYSTEM');
  } catch (error) {
    console.error('获取系统设置字典项失败:', error);
    throw error;
  }
}