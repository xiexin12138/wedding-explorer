# 性能优化指南

## 概述

本文档详细说明了项目的性能监控和优化策略，特别针对从中国大陆访问 Vercel 部署的应用场景。

## 目录

1. [性能监控系统](#性能监控系统)
2. [数据库优化](#数据库优化)
3. [缓存策略](#缓存策略)
4. [API 性能优化](#api-性能优化)
5. [部署配置优化](#部署配置优化)
6. [性能排查指南](#性能排查指南)
7. [最佳实践](#最佳实践)

---

## 性能监控系统

### 1. 性能追踪工具

项目已集成全面的性能监控工具库（`lib/performance-monitor.ts`），提供以下功能：

#### 基本使用

```typescript
import { PerformanceTracker } from '@/lib/performance-monitor';

const tracker = new PerformanceTracker('req_123', 'API调用');

// 标记检查点
tracker.checkpoint('开始处理');
await someOperation();
tracker.checkpoint('处理完成', { itemCount: 10 });

// 完成追踪并输出总结
const summary = tracker.finish();
```

#### API 路由监控

使用 `withPerformanceMonitoring` 包装器自动监控 API 性能：

```typescript
import { withPerformanceMonitoring, monitorDatabaseOperation } from '@/lib/api-performance-wrapper';

export const GET = withPerformanceMonitoring(async (
  request: NextRequest,
  { tracker, dbMonitor, externalMonitor }
) => {
  // 自动记录检查点
  tracker.checkpoint('开始查询');
  
  // 监控数据库操作
  const data = await monitorDatabaseOperation(
    dbMonitor,
    'findMany',
    'User',
    () => db.user.findMany()
  );
  
  tracker.checkpoint('查询完成', { count: data.length });
  
  return NextResponse.json({ data });
}, {
  name: '获取用户列表',
  logRequestBody: false,
});
```

### 2. 日志输出示例

成功的 API 请求会输出详细的性能日志：

```
🚀🚀🚀🚀... (40个)
🚀 API 请求开始 [req_1697123456789_abc123]
🚀🚀🚀🚀... (40个)
📍 路由: 景点打卡
🌍 地区: CN
📱 User-Agent: Mozilla/5.0...
🔗 IP: 123.45.67.89

🟢 [req_1697123456789_abc123] 景点打卡 - 解析请求参数: 5.23ms
🟢 [req_1697123456789_abc123] 景点打卡 - 用户认证完成: 152.45ms {"userId":"user123"}
🟢 [req_1697123456789_abc123] 景点打卡 - 获取景点信息: 45.67ms {"attractionId":"attr1","found":true}
🟡 [req_1697123456789_abc123] 景点打卡 - 完成打卡事务: 1234.56ms {"coinsEarned":10}

================================================================================
🟡🟡 性能总结 [req_1697123456789_abc123] 景点打卡
================================================================================
⏱️  总耗时: 1456.78ms
📊 检查点数量: 5

📈 详细指标:
  1. 🟢 解析请求参数: 5.23ms
  2. 🟢 用户认证完成: 152.45ms
  3. 🟢 获取景点信息: 45.67ms
  4. 🟢 检查打卡状态: 34.56ms
  5. 🟡 完成打卡事务: 1234.56ms

🐌 最慢操作: 完成打卡事务 (1234.56ms)
================================================================================

--------------------------------------------------------------------------------
📊 数据库查询总结 [req_1697123456789_abc123]
--------------------------------------------------------------------------------
🔢 查询总数: 4
⏱️  总耗时: 1345.67ms
⏱️  平均耗时: 336.42ms
🐌 最慢查询: 1234.56ms
   Database.transaction...

⚠️  慢查询列表 (> 100ms):
  1. 234.56ms - User.findUnique
  2. 1234.56ms - Database.transaction
--------------------------------------------------------------------------------

✅ API 请求完成 [req_1697123456789_abc123] - 1456.78ms
================================================================================
```

---

## 数据库优化

### 1. 连接配置优化

针对从中国大陆访问新加坡腾讯云 MySQL 的场景，已优化配置（`lib/db-config.ts`）：

```typescript
export const dbConfig = {
  connectionPool: {
    maxConnections: 3,           // Vercel 环境减少连接数
    connectionTimeout: 20000,    // 20秒，适应跨地域延迟
    queryTimeout: 15000,         // 15秒，避免过长等待
    idleTimeout: 30000,          // 30秒
    maxLifetime: 300000,         // 5分钟，定期刷新连接
  },
  retry: {
    maxRetries: 2,               // 减少重试避免累积延迟
    retryDelay: 500,             // 快速重试
  },
  monitoring: {
    slowQueryThreshold: 500,     // 500ms 即视为慢查询
  },
};
```

### 2. Prisma 优化

已配置 Prisma 客户端优化（`lib/db.ts`）：

- **事务超时**：最大等待 5秒，超时 10秒
- **慢查询监控**：自动记录超过 500ms 的查询
- **优雅关闭**：生产环境自动断开连接

### 3. 查询优化建议

#### 使用索引
```sql
-- 确保常用查询字段有索引
CREATE INDEX idx_user_coins ON User(coins DESC);
CREATE INDEX idx_checkin_user_attraction ON UserAttractionCheckIn(userId, attractionId);
```

#### 减少 N+1 查询
```typescript
// ❌ 不好 - N+1 查询
const users = await db.user.findMany();
for (const user of users) {
  const checkIns = await db.userAttractionCheckIn.findMany({
    where: { userId: user.id }
  });
}

// ✅ 好 - 使用 include
const users = await db.user.findMany({
  include: {
    checkIns: true,
  }
});
```

#### 限制返回字段
```typescript
// ❌ 不好 - 返回所有字段
const users = await db.user.findMany();

// ✅ 好 - 只返回需要的字段
const users = await db.user.findMany({
  select: {
    id: true,
    nickname: true,
    coins: true,
  }
});
```

---

## 缓存策略

### 1. 内存缓存

项目使用增强的内存缓存系统（`lib/cache.ts`），支持：

- **LRU 驱逐策略**：自动清理最少使用的缓存
- **缓存统计**：监控命中率和性能
- **分级 TTL**：不同数据不同缓存时间

#### 基本使用

```typescript
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// 写入缓存
cache.set(CACHE_KEYS.USER_PROFILE('user123'), userData, CACHE_TTL.MEDIUM);

// 读取缓存
const cached = cache.get(CACHE_KEYS.USER_PROFILE('user123'));

// 删除缓存
cache.delete(CACHE_KEYS.USER_PROFILE('user123'));
```

#### 使用缓存包装器

```typescript
import { withCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

const userData = await withCache(
  CACHE_KEYS.USER_PROFILE(userId),
  async () => {
    // 这个函数只在缓存未命中时执行
    return await db.user.findUnique({ where: { id: userId } });
  },
  CACHE_TTL.MEDIUM
);
```

### 2. 缓存 TTL 配置

```typescript
export const CACHE_TTL = {
  SHORT: 30 * 1000,        // 30秒 - 频繁变化的数据（如排行榜）
  MEDIUM: 3 * 60 * 1000,   // 3分钟 - 默认（如用户资料）
  LONG: 10 * 60 * 1000,    // 10分钟 - 相对稳定的数据（如景点列表）
  VERY_LONG: 30 * 60 * 1000, // 30分钟 - 很少变化的数据（如配置项）
};
```

### 3. 缓存监控

```typescript
// 获取缓存统计
const stats = cache.getStats();
console.log('缓存命中率:', stats.hitRate);

// 打印详细统计
cache.printStats();

// 健康检查
const health = cache.healthCheck();
if (!health.healthy) {
  console.warn('缓存健康问题:', health.issues);
}
```

---

## API 性能优化

### 1. 已优化的 API

以下 API 已集成性能监控：

- ✅ `POST /api/attractions/[id]/check-in` - 景点打卡
- ✅ `GET /api/leaderboard` - 排行榜
- ✅ `GET /api/user/profile` - 用户资料
- ✅ `GET /api/auth/check` - 认证检查

### 2. 添加性能监控到新 API

```typescript
import { withPerformanceMonitoring, monitorDatabaseOperation } from '@/lib/api-performance-wrapper';

export const GET = withPerformanceMonitoring(async (
  request: NextRequest,
  { tracker, dbMonitor, externalMonitor }
) => {
  // 1. 记录检查点
  tracker.checkpoint('开始处理');
  
  // 2. 监控数据库操作
  const data = await monitorDatabaseOperation(
    dbMonitor,
    'findMany',
    'ModelName',
    () => db.model.findMany()
  );
  
  // 3. 监控外部服务调用
  const externalData = await monitorExternalService(
    externalMonitor,
    'ServiceName',
    () => fetch('https://api.example.com/data')
  );
  
  tracker.checkpoint('处理完成');
  
  return NextResponse.json({ success: true, data });
}, {
  name: 'API名称',
  logRequestBody: true,  // 是否记录请求体
  logResponseBody: false, // 是否记录响应体
});
```

### 3. 响应头

所有使用性能监控的 API 会自动添加以下响应头：

- `X-Request-ID`: 唯一请求 ID
- `X-Response-Time`: 响应时间（毫秒）

---

## 部署配置优化

### 1. Vercel 配置

#### 区域选择
由于中国大陆用户访问，建议：
- **首选**：Hong Kong (hkg1) - 延迟最低
- **备选**：Singapore (sin1) - 当前使用

#### vercel.json 配置建议

```json
{
  "regions": ["hkg1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

### 2. 环境变量配置

添加以下环境变量以启用性能日志：

```bash
# 生产环境启用查询日志（可选）
ENABLE_QUERY_LOGGING=true

# 数据库连接配置（确保已优化）
DATABASE_URL="mysql://user:pass@host:3306/db?connection_limit=3&connect_timeout=20&socket_timeout=15"
```

### 3. Next.js 配置

已优化的 `next.config.ts` 配置：

```typescript
export default {
  output: 'standalone',       // 独立输出
  compress: true,             // 启用压缩
  poweredByHeader: false,     // 移除 X-Powered-By
  
  // 优化包导入
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/...'],
  },
  
  // 图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};
```

---

## 性能排查指南

### 1. 识别慢接口

#### 查看 Vercel 日志

1. 登录 Vercel Dashboard
2. 选择项目 → Functions → Logs
3. 筛选响应时间 > 2000ms 的请求

#### 查看应用日志

在 Vercel 日志中搜索关键词：
- `🔴` - 超过 5秒的操作
- `🟡` - 超过 2秒的操作
- `🐌 慢查询检测` - 慢数据库查询
- `最慢操作` - 每个请求的性能瓶颈

### 2. 常见性能瓶颈

#### 数据库连接慢

**症状**：
```
🟡 [req_xxx] 用户认证完成: 2500.00ms
```

**原因**：
- 跨地域网络延迟（中国大陆 → 新加坡）
- 数据库连接超时配置不合理

**解决方案**：
1. 检查 `DATABASE_URL` 是否包含优化参数
2. 考虑使用更近的数据库区域（如香港）
3. 启用连接池复用

#### 慢查询

**症状**：
```
🐌 慢查询检测 (1234ms): SELECT * FROM User WHERE...
```

**原因**：
- 缺少索引
- 查询返回太多数据
- N+1 查询问题

**解决方案**：
1. 添加适当的数据库索引
2. 使用 `select` 限制返回字段
3. 使用 `include` 避免 N+1 查询
4. 添加 `limit` 限制返回数量

#### 外部服务慢

**症状**：
```
🐌 [req_xxx] 外部服务: Authing认证 - 3000.00ms
```

**原因**：
- 第三方服务响应慢
- 网络延迟

**解决方案**：
1. 实现请求超时
2. 添加重试机制
3. 考虑缓存认证结果
4. 使用中间件传递认证信息，避免重复验证

### 3. 性能分析流程

```
1. 识别慢接口
   ↓
2. 查看性能日志，找到最慢操作
   ↓
3. 确定瓶颈类型
   ├─ 数据库 → 优化查询/添加索引/启用缓存
   ├─ 外部服务 → 添加超时/缓存/异步处理
   └─ 业务逻辑 → 优化算法/减少计算
   ↓
4. 实施优化
   ↓
5. 验证效果（对比优化前后的日志）
```

---

## 最佳实践

### 1. 数据库查询

✅ **好的做法**：
```typescript
// 使用 select 限制字段
const users = await db.user.findMany({
  select: { id: true, nickname: true, coins: true },
  take: 10,
  orderBy: { coins: 'desc' },
});

// 使用缓存
const leaderboard = await withCache(
  CACHE_KEYS.LEADERBOARD(10, 0),
  () => db.user.findMany({ /* ... */ }),
  CACHE_TTL.SHORT
);
```

❌ **避免的做法**：
```typescript
// 返回所有字段
const users = await db.user.findMany();

// 没有限制数量
const allUsers = await db.user.findMany();

// N+1 查询
for (const user of users) {
  const profile = await db.profile.findUnique({ where: { userId: user.id } });
}
```

### 2. 缓存使用

✅ **应该缓存**：
- 数据字典配置
- 景点列表
- 排行榜（短时间缓存）
- 用户资料（中等时间缓存）
- 静态内容

❌ **不应该缓存**：
- 实时数据（如当前用户金币余额）
- 敏感信息
- 频繁变化的数据

### 3. API 设计

✅ **好的做法**：
```typescript
// 使用性能监控
export const GET = withPerformanceMonitoring(async (request, { tracker }) => {
  tracker.checkpoint('开始');
  // ... 业务逻辑
  tracker.checkpoint('完成');
  return response;
}, { name: 'API名称' });

// 分页查询
const limit = Math.min(Number(params.get('limit') || 10), 100);
const offset = Number(params.get('offset') || 0);

// 超时保护
const result = await Promise.race([
  fetchData(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 10000)
  ),
]);
```

❌ **避免的做法**：
```typescript
// 没有性能监控
export async function GET(request) {
  // ... 无法追踪性能
}

// 无限制查询
const allData = await db.model.findMany(); // 可能返回数万条

// 没有超时保护
const result = await fetch(externalApi); // 可能永久等待
```

### 4. 错误处理

```typescript
export const GET = withPerformanceMonitoring(async (request, { tracker }) => {
  try {
    // 业务逻辑
    tracker.checkpoint('处理完成');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    // 记录错误
    console.error('处理失败:', error);
    tracker.checkpoint('发生错误');
    
    // 返回友好错误
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '服务器错误' 
      },
      { status: 500 }
    );
  }
}, { name: 'API名称' });
```

---

## 性能基准

### 目标响应时间

| 操作类型 | 目标时间 | 警告阈值 | 危险阈值 |
|---------|---------|---------|---------|
| 简单查询 | < 100ms | 500ms | 1000ms |
| 复杂查询 | < 500ms | 1000ms | 2000ms |
| 事务操作 | < 1000ms | 2000ms | 5000ms |
| 外部 API | < 1000ms | 2000ms | 3000ms |
| 整体请求 | < 2000ms | 5000ms | 10000ms |

### 监控指标

#### 数据库
- 连接池使用率 < 80%
- 慢查询比例 < 5%
- 平均查询时间 < 200ms

#### 缓存
- 命中率 > 50%
- 缓存大小 < 1000 条目
- 内存使用 < 100MB

#### API
- 成功率 > 99%
- P95 响应时间 < 3000ms
- P99 响应时间 < 5000ms

---

## 持续优化建议

### 短期（1-2周）

1. ✅ **已完成**：添加性能监控系统
2. ✅ **已完成**：优化数据库连接配置
3. ✅ **已完成**：增强缓存策略
4. **待完成**：为所有 API 添加性能监控
5. **待完成**：添加数据库索引

### 中期（1-2月）

1. 考虑迁移数据库到香港区域
2. 实现 Redis 缓存（替代内存缓存）
3. 添加 CDN 加速静态资源
4. 实现请求队列和限流
5. 优化大型查询的分页策略

### 长期（3-6月）

1. 实现微服务架构拆分
2. 添加性能监控看板（如 Grafana）
3. 实现智能缓存预热
4. 考虑边缘计算方案
5. 实施数据库读写分离

---

## 故障排查清单

当遇到性能问题时，按以下顺序检查：

- [ ] 查看 Vercel 函数日志
- [ ] 检查性能监控日志中的 🔴 和 🟡 标记
- [ ] 查找"最慢操作"和"慢查询"
- [ ] 检查数据库连接状态
- [ ] 查看缓存命中率（`cache.printStats()`）
- [ ] 检查外部服务响应时间
- [ ] 验证网络连接质量
- [ ] 查看 Vercel 函数的内存和 CPU 使用情况
- [ ] 检查是否有死锁或长时间运行的事务

---

## 联系和支持

如有性能问题或优化建议，请：

1. 查看 Vercel 日志收集详细信息
2. 导出相关的性能监控日志
3. 记录问题发生的时间和频率
4. 联系技术团队进行分析

---

**文档版本**：v1.0.0  
**最后更新**：2025-01-11  
**维护者**：开发团队

