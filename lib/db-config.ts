/**
 * 数据库连接配置优化
 * 针对腾讯云 MySQL 的连接配置
 * 
 * 针对中国大陆访问优化：
 * 1. 调整连接超时时间 - 考虑跨地域网络延迟
 * 2. 启用连接池 - 减少重复建立连接的开销
 * 3. 优化查询超时 - 避免长时间等待
 */

export const dbConfig = {
  // 连接池配置
  connectionPool: {
    // 最大连接数（Vercel 无服务器环境建议较小值）
    // 减少连接数以避免数据库连接数耗尽
    maxConnections: process.env.VERCEL ? 3 : 10,
    // 最小连接数
    minConnections: 0,
    // 连接超时时间（毫秒）- 增加以适应跨地域延迟
    connectionTimeout: 20000, // 20秒，考虑中国大陆到新加坡的网络延迟
    // 查询超时时间（毫秒）- 调整为更合理的值
    queryTimeout: 15000, // 15秒，避免过长等待
    // 空闲连接超时时间（毫秒）
    idleTimeout: 30000, // 30秒，Vercel函数通常不会运行太久
    // 连接生命周期（毫秒）
    maxLifetime: 300000, // 5分钟，定期刷新连接
  },

  // 重试配置
  retry: {
    // 最大重试次数
    maxRetries: 2, // 减少重试次数，避免累积延迟
    // 重试间隔（毫秒）
    retryDelay: 500, // 减少重试间隔
    // 指数退避因子
    backoffFactor: 1.5,
  },

  // 查询优化
  query: {
    // 启用查询缓存
    enableQueryCache: true,
    // 查询缓存时间（毫秒）
    queryCacheTTL: 180000, // 3分钟，减少缓存时间保证数据新鲜度
    // 批量查询大小
    batchSize: 50, // 减小批量大小，避免单次查询过大
  },

  // 监控配置
  monitoring: {
    // 启用慢查询日志
    enableSlowQueryLog: true,
    // 慢查询阈值（毫秒）- 降低阈值以便更早发现问题
    slowQueryThreshold: 500, // 500ms
    // 启用连接池监控
    enablePoolMonitoring: true,
    // 启用详细日志（生产环境可关闭）
    enableVerboseLogging: process.env.NODE_ENV === 'development',
  },
  
  // 性能优化
  performance: {
    // 启用预编译语句（prepared statements）
    enablePreparedStatements: true,
    // 启用查询结果缓存
    enableResultCache: true,
    // 批量操作优化
    enableBatchOptimization: true,
  },
};

// 生成优化的数据库连接 URL（腾讯云 MySQL）
export function getOptimizedDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  try {
    // 如果 URL 已经包含参数，直接返回
    if (baseUrl.includes('?')) {
      console.log('📊 使用已配置的数据库连接参数');
      return baseUrl;
    }

    // 添加针对跨地域访问优化的连接参数
    const params = new URLSearchParams({
      // 连接池配置
      connection_limit: dbConfig.connectionPool.maxConnections.toString(),
      pool_timeout: Math.floor(dbConfig.connectionPool.idleTimeout / 1000).toString(), // 秒
      
      // 连接超时配置（针对跨地域优化）
      connect_timeout: Math.floor(dbConfig.connectionPool.connectionTimeout / 1000).toString(), // 20秒
      
      // Socket 配置
      socket_timeout: Math.floor(dbConfig.connectionPool.queryTimeout / 1000).toString(), // 15秒
      
      // MySQL 特定优化
      charset: 'utf8mb4', // 支持完整的 Unicode
      timezone: 'Z', // 使用 UTC 时区
      
      // 性能优化
      statement_cache_size: '100', // 启用语句缓存
    });

    const optimizedUrl = `${baseUrl}?${params.toString()}`;
    
    console.log('📊 数据库连接配置:');
    console.log(`   - 最大连接数: ${dbConfig.connectionPool.maxConnections}`);
    console.log(`   - 连接超时: ${dbConfig.connectionPool.connectionTimeout}ms`);
    console.log(`   - 查询超时: ${dbConfig.connectionPool.queryTimeout}ms`);
    console.log(`   - 空闲超时: ${dbConfig.connectionPool.idleTimeout}ms`);
    
    return optimizedUrl;
  } catch (error) {
    console.error('❌ 数据库 URL 解析失败，使用原始 URL:', error);
    // 如果解析失败，直接返回原始 URL
    return baseUrl;
  }
}

// 生成直连 URL（用于迁移等操作）
export function getDirectDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  // 直接返回原始 URL
  return baseUrl;
}
