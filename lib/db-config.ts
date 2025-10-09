/**
 * 数据库连接配置优化
 * 针对腾讯云 MySQL 的连接配置
 */

export const dbConfig = {
  // 连接池配置
  connectionPool: {
    // 最大连接数（Vercel 无服务器环境建议较小值）
    maxConnections: process.env.VERCEL ? 5 : 20,
    // 最小连接数
    minConnections: 1,
    // 连接超时时间（毫秒）
    connectionTimeout: 10000,
    // 查询超时时间（毫秒）
    queryTimeout: 30000,
    // 空闲连接超时时间（毫秒）
    idleTimeout: 60000, // Vercel 建议 1 分钟
  },

  // 重试配置
  retry: {
    // 最大重试次数
    maxRetries: 3,
    // 重试间隔（毫秒）
    retryDelay: 1000,
    // 指数退避因子
    backoffFactor: 2,
  },

  // 查询优化
  query: {
    // 启用查询缓存
    enableQueryCache: true,
    // 查询缓存时间（毫秒）
    queryCacheTTL: 300000, // 5分钟
    // 批量查询大小
    batchSize: 100,
  },

  // 监控配置
  monitoring: {
    // 启用慢查询日志
    enableSlowQueryLog: true,
    // 慢查询阈值（毫秒）
    slowQueryThreshold: 1000,
    // 启用连接池监控
    enablePoolMonitoring: true,
  },
};

// 生成优化的数据库连接 URL（腾讯云 MySQL）
export function getOptimizedDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  // MySQL 连接池参数配置
  const url = new URL(baseUrl);
  
  // 连接池配置
  url.searchParams.set('connection_limit', dbConfig.connectionPool.maxConnections.toString());
  url.searchParams.set('pool_timeout', Math.floor(dbConfig.connectionPool.connectionTimeout / 1000).toString());
  url.searchParams.set('connect_timeout', '10');
  
  // MySQL 特定优化参数
  url.searchParams.set('sslaccept', 'strict'); // SSL 连接
  
  return url.toString();
}

// 生成直连 URL（用于迁移等操作）
export function getDirectDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  const url = new URL(baseUrl);
  url.searchParams.set('connect_timeout', '10');
  
  return url.toString();
}
