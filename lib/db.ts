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
    // 事务配置
    transactionOptions: {
      maxWait: 15000, // 最大等待时间 15秒（增加等待时间）
      timeout: 20000, // 事务超时 20秒（增加超时时间）
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

// 注意: 在 Next.js 的 serverless/edge 环境中，不需要手动管理连接关闭
// Prisma 客户端会在请求完成后自动清理连接
// process.on('beforeExit') 在 Edge Runtime 中不支持，已移除

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db