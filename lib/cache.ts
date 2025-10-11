/**
 * 数据缓存服务
 * 用于缓存数据字典等相对静态的数据，减少数据库查询
 * 
 * 优化策略：
 * 1. 增加缓存统计 - 监控缓存命中率
 * 2. 支持缓存预热 - 提前加载常用数据
 * 3. 分级缓存 - 不同数据不同TTL
 * 4. 内存限制 - 避免内存溢出
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // 生存时间（毫秒）
  accessCount: number; // 访问次数
  lastAccessTime: number; // 最后访问时间
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<unknown>>();
  private readonly defaultTTL = 3 * 60 * 1000; // 默认3分钟（减少以保证数据新鲜度）
  private readonly maxCacheSize = 1000; // 最大缓存条目数
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
  };

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // 检查缓存大小限制
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU(); // 驱逐最少使用的条目
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessTime: Date.now(),
    });
    
    this.stats.sets++;
    this.stats.size = this.cache.size;
    
    // 性能日志（仅开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 缓存写入: ${key} (TTL: ${ttl}ms)`);
    }
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }

    // 更新访问统计
    item.accessCount++;
    item.lastAccessTime = now;
    this.stats.hits++;

    return item.data as T;
  }

  delete(key: string): void {
    if (this.cache.delete(key)) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️  缓存删除: ${key}`);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    console.log('🧹 缓存已清空');
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    this.stats.size = this.cache.size;
    
    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个过期缓存条目`);
    }
  }

  // LRU 驱逐策略 - 驱逐最少使用的条目
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessTime < oldestTime) {
        oldestTime = item.lastAccessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️  LRU驱逐: ${oldestKey}`);
    }
  }

  // 获取缓存统计
  getStats(): CacheStats & { hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 
      ? ((this.stats.hits / total) * 100).toFixed(2) 
      : '0.00';
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
    };
  }

  // 打印缓存统计
  printStats(): void {
    const stats = this.getStats();
    console.log('\n' + '📊'.repeat(20));
    console.log('📊 缓存统计报告');
    console.log('📊'.repeat(20));
    console.log(`✅ 命中: ${stats.hits}`);
    console.log(`❌ 未命中: ${stats.misses}`);
    console.log(`📈 命中率: ${stats.hitRate}`);
    console.log(`💾 写入次数: ${stats.sets}`);
    console.log(`🗑️  删除次数: ${stats.deletes}`);
    console.log(`📦 当前大小: ${stats.size}/${this.maxCacheSize}`);
    console.log('='.repeat(40) + '\n');
  }

  // 获取所有缓存键（用于调试）
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // 检查缓存健康状态
  healthCheck(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];
    const stats = this.getStats();

    // 检查缓存大小
    if (this.cache.size > this.maxCacheSize * 0.9) {
      issues.push(`缓存接近上限: ${this.cache.size}/${this.maxCacheSize}`);
    }

    // 检查命中率
    const hitRate = parseFloat(stats.hitRate);
    if (hitRate < 50 && stats.hits + stats.misses > 100) {
      issues.push(`命中率较低: ${stats.hitRate}`);
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
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

  // 定期打印缓存统计（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      cache.printStats();
    }, 5 * 60 * 1000); // 每5分钟打印一次
  }
}

// 缓存键常量
export const CACHE_KEYS = {
  DICTIONARY_ITEMS: 'dictionary:items',
  DICTIONARY_ITEM: (id: string) => `dictionary:item:${id}`,
  DICTIONARY_BY_KEY: (key: string) => `dictionary:key:${key}`,
  DICTIONARY_BY_CATEGORY: (category: string) => `dictionary:category:${category}`,
  ATTRACTIONS_DATA: 'attractions:data',
  ATTRACTIONS_CLIENT: 'attractions:client',
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_RANK: (userId: string) => `user:rank:${userId}`,
  LEADERBOARD: (limit: number, offset: number) => `leaderboard:${limit}:${offset}`,
  ATTRACTION_CHECKIN_STATUS: (userId: string, attractionId: string) => 
    `attraction:checkin:${userId}:${attractionId}`,
  // 用户认证缓存键
  USER_BY_AUTHING_ID: (authingId: string) => `user:authing:${authingId}`,
  USER_BY_UNION_ID: (unionId: string) => `user:union:${unionId}`,
  USER_BY_OPEN_ID: (openId: string) => `user:open:${openId}`,
} as const;

// 缓存 TTL 配置（毫秒）
export const CACHE_TTL = {
  SHORT: 30 * 1000, // 30秒 - 用于快速变化的数据
  MEDIUM: 3 * 60 * 1000, // 3分钟 - 默认
  USER_AUTH: 5 * 60 * 1000, // 5分钟 - 用户认证信息缓存
  LONG: 10 * 60 * 1000, // 10分钟 - 用于相对稳定的数据
  VERY_LONG: 30 * 60 * 1000, // 30分钟 - 用于很少变化的数据
} as const;

/**
 * 缓存包装器 - 简化缓存使用
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  // 先尝试从缓存获取
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // 缓存未命中，执行获取函数
  const data = await fetcher();
  
  // 写入缓存
  cache.set(key, data, ttl);
  
  return data;
}

/**
 * 同步缓存包装器
 */
export function withCacheSync<T>(
  key: string,
  fetcher: () => T,
  ttl: number = CACHE_TTL.MEDIUM
): T {
  // 先尝试从缓存获取
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // 缓存未命中，执行获取函数
  const data = fetcher();
  
  // 写入缓存
  cache.set(key, data, ttl);
  
  return data;
}
