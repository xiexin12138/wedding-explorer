/**
 * 数据库连接配置优化
 * 针对中国大陆访问 Supabase 的优化配置
 */

export const dbConfig = {
  // 连接池配置
  connectionPool: {
    // 最大连接数
    maxConnections: 20,
    // 最小连接数
    minConnections: 2,
    // 连接超时时间（毫秒）
    connectionTimeout: 10000,
    // 查询超时时间（毫秒）
    queryTimeout: 30000,
    // 空闲连接超时时间（毫秒）
    idleTimeout: 300000, // 5分钟
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

// 生成优化的数据库连接 URL
export function getOptimizedDatabaseUrl(): string {
  const baseUrl = process.env.POSTGRES_PRISMA_URL;
  if (!baseUrl) {
    throw new Error('POSTGRES_PRISMA_URL is not defined');
  }

  // 添加连接池参数
  const url = new URL(baseUrl);
  url.searchParams.set('connection_limit', dbConfig.connectionPool.maxConnections.toString());
  url.searchParams.set('pool_timeout', dbConfig.connectionPool.connectionTimeout.toString());
  url.searchParams.set('connect_timeout', '10');
  url.searchParams.set('statement_timeout', '30000');
  url.searchParams.set('idle_in_transaction_session_timeout', '300000');

  return url.toString();
}

// 生成非池化连接 URL（用于迁移等操作）
export function getDirectDatabaseUrl(): string {
  const baseUrl = process.env.POSTGRES_URL_NON_POOLING;
  if (!baseUrl) {
    throw new Error('POSTGRES_URL_NON_POOLING is not defined');
  }

  const url = new URL(baseUrl);
  url.searchParams.set('connect_timeout', '10');
  url.searchParams.set('statement_timeout', '30000');

  return url.toString();
}
