/**
 * 数据库连接配置优化
 * 针对腾讯云 MySQL 的连接配置
 * 
 * 针对中国大陆访问优化：
 * 1. 数据库在上海，Vercel 部署在香港
 * 2. 香港到上海延迟约 30-50ms，网络条件良好
 * 3. 可以使用更激进的超时配置
 */

export const dbConfig = {
  // 连接池配置
  connectionPool: {
    // 最大连接数（增加到20以应对高并发场景）
    maxConnections: 20,
    // 最小连接数（保持一定的预热连接）
    minConnections: 2,
    // 连接超时时间（毫秒）- 增加到30秒以应对网络波动
    connectionTimeout: 30000, // 30秒，给连接池更多等待时间
    // 查询超时时间（毫秒）- 增加单次查询超时
    queryTimeout: 15000, // 15秒，单次查询超时
    // 空闲连接超时时间（毫秒）- 减少空闲时间以释放连接
    idleTimeout: 20000, // 20秒，更快释放空闲连接
    // 连接生命周期（毫秒）- 减少连接生命周期以避免长连接问题
    maxLifetime: 180000, // 3分钟，更频繁地刷新连接
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
    // 如果 URL 已经包含参数，则进行合并并覆盖关键参数，确保使用我们的优化配置
    if (baseUrl.includes('?')) {
      try {
        const urlObj = new URL(baseUrl);
        const sp = urlObj.searchParams;

        // 覆盖/设置关键参数（单位均为秒）
        sp.set('connection_limit', dbConfig.connectionPool.maxConnections.toString());
        sp.set('pool_timeout', Math.floor(dbConfig.connectionPool.connectionTimeout / 1000).toString());
        sp.set('connect_timeout', Math.floor(dbConfig.connectionPool.connectionTimeout / 1000).toString());
        sp.set('socket_timeout', Math.floor(dbConfig.connectionPool.queryTimeout / 1000).toString());
        // 其他优化参数（若已有则覆盖为推荐值）
        sp.set('charset', 'utf8mb4');
        sp.set('timezone', 'Z');
        sp.set('statement_cache_size', '100');

        const mergedUrl = urlObj.toString();

        console.log('📊 已合并并覆盖数据库连接参数');
        console.log(`   - 最大连接数: ${dbConfig.connectionPool.maxConnections}`);
        console.log(`   - 连接超时(pool/connect): ${dbConfig.connectionPool.connectionTimeout}ms`);
        console.log(`   - 查询超时(socket): ${dbConfig.connectionPool.queryTimeout}ms`);
        console.log(`   - 空闲超时: ${dbConfig.connectionPool.idleTimeout}ms`);

        return mergedUrl;
      } catch (e) {
        console.warn('⚠️ 数据库 URL 合并失败，回退使用原始 URL:', e);
        return baseUrl;
      }
    }

    // 添加针对跨地域访问优化的连接参数
    const params = new URLSearchParams({
      // 连接池配置
      connection_limit: dbConfig.connectionPool.maxConnections.toString(),
      pool_timeout: Math.floor(dbConfig.connectionPool.connectionTimeout / 1000).toString(), // 秒
      
      // 连接超时配置（需要考虑连接池等待时间）
      connect_timeout: Math.floor(dbConfig.connectionPool.connectionTimeout / 1000).toString(), // 15秒
      
      // Socket 配置
      socket_timeout: Math.floor(dbConfig.connectionPool.queryTimeout / 1000).toString(), // 10秒
      
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
