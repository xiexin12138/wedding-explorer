/**
 * 数据缓存服务
 * 用于缓存数据字典等相对静态的数据，减少数据库查询
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // 生存时间（毫秒）
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 默认5分钟

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 全局缓存实例
export const cache = new MemoryCache();

// 定期清理过期缓存
if (typeof window === 'undefined') {
  // 仅在服务端运行
  setInterval(() => {
    cache.cleanup();
  }, 60000); // 每分钟清理一次
}

// 缓存键常量
export const CACHE_KEYS = {
  DICTIONARY_ITEMS: 'dictionary:items',
  DICTIONARY_ITEM: (id: string) => `dictionary:item:${id}`,
  DICTIONARY_BY_KEY: (key: string) => `dictionary:key:${key}`,
  DICTIONARY_BY_CATEGORY: (category: string) => `dictionary:category:${category}`,
} as const;
