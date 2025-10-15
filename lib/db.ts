import { PrismaClient, Prisma } from '@/app/generated/prisma'
import { getOptimizedDatabaseUrl, dbConfig } from './db-config'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 配置 Prisma 日志级别
const logConfig: Prisma.LogLevel[] = process.env.NODE_ENV === 'development' 
  ? ['query', 'info', 'warn', 'error']
  : process.env.ENABLE_QUERY_LOGGING === 'true'
  ? ['warn', 'error']  // 生产环境可选启用警告日志
  : ['error'];

console.log('🔧 初始化 Prisma 客户端...');
console.log(`   环境: ${process.env.NODE_ENV}`);
console.log(`   日志级别: ${logConfig.join(', ')}`);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logConfig,
    datasources: {
      db: {
        url: getOptimizedDatabaseUrl(),
      },
    },
    // 添加 Prisma 性能优化配置
    errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
    // 事务配置 - 增加超时时间以应对连接池压力
    transactionOptions: {
      maxWait: 30000, // 最大等待时间 30秒（与连接池超时保持一致）
      timeout: 45000, // 事务超时 45秒（给事务更多执行时间）
      isolationLevel: undefined, // 使用默认隔离级别
    },
  })

// 监听 Prisma 查询事件（用于性能监控）
if (dbConfig.monitoring.enableVerboseLogging) {
  db.$on('query' as never, (e: {
    query: string;
    params: string;
    duration: number;
    target: string;
  }) => {
    // 只记录慢查询
    if (e.duration > dbConfig.monitoring.slowQueryThreshold) {
      console.warn(`🐌 慢查询检测 (${e.duration}ms):`, {
        query: e.query.substring(0, 100),
        duration: e.duration,
      });
    }
  });
}

// 连接池状态监控
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Prisma 客户端初始化完成');
}

// 数据库连接重试包装器
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  operationName: string = '数据库操作',
  maxRetries: number = dbConfig.retry.maxRetries
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // 检查是否是连接池相关错误
      const isConnectionError = 
        error instanceof Error && (
          error.message.includes('connection pool') ||
          error.message.includes('Timed out') ||
          error.message.includes('Connection terminated') ||
          error.message.includes('Connection refused')
        );
      
      if (!isConnectionError || attempt > maxRetries) {
        console.error(`❌ ${operationName}失败 (尝试 ${attempt}/${maxRetries + 1}):`, error);
        throw error;
      }
      
      const delay = dbConfig.retry.retryDelay * Math.pow(dbConfig.retry.backoffFactor, attempt - 1);
      console.warn(`⚠️ ${operationName}连接失败，${delay}ms后重试 (尝试 ${attempt}/${maxRetries + 1}):`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// 数据库连接健康检查
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('数据库健康检查失败:', error);
    return false;
  }
}

// 注意: 在 Next.js 的 serverless/edge 环境中，不需要手动管理连接关闭
// Prisma 客户端会在请求完成后自动清理连接
// process.on('beforeExit') 在 Edge Runtime 中不支持，已移除

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db