# 性能优化快速参考

## 🚀 快速开始

### 为 API 添加性能监控（2分钟）

```typescript
// 1. 导入包装器
import { withPerformanceMonitoring, monitorDatabaseOperation } from '@/lib/api-performance-wrapper';

// 2. 包装你的 API 处理函数
export const GET = withPerformanceMonitoring(async (
  request: NextRequest,
  { tracker, dbMonitor }
) => {
  // 3. 添加检查点
  tracker.checkpoint('开始处理');
  
  // 4. 包装数据库操作
  const data = await monitorDatabaseOperation(
    dbMonitor,
    'findMany',
    'User',
    () => db.user.findMany()
  );
  
  tracker.checkpoint('处理完成');
  return NextResponse.json({ data });
}, {
  name: 'API名称', // 在日志中显示的名称
});
```

### 添加缓存（1分钟）

```typescript
import { withCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// 包装任何异步函数
const data = await withCache(
  CACHE_KEYS.USER_PROFILE(userId),
  () => db.user.findUnique({ where: { id: userId } }),
  CACHE_TTL.MEDIUM // 3分钟
);
```

---

## 📊 日志符号说明

### 时间指示器
- 🟢 **绿色** < 500ms - 良好
- 🟡 **黄色** 500ms - 2000ms - 需要关注
- 🔴 **红色** > 2000ms - 需要优化

### 操作类型
- 🚀 API 请求开始/完成
- ⏱️ 性能统计
- 🐌 慢查询/慢操作警告
- 📊 数据库查询统计
- 🌐 外部服务调用
- 💾 缓存操作
- ❌ 错误

---

## 🔍 常见问题速查

### 问题：数据库查询很慢

**日志特征**：
```
🐌 [req_xxx] 慢查询检测 (1234ms): User.findMany
```

**解决方案**：
```typescript
// ❌ 不好
const users = await db.user.findMany();

// ✅ 好
const users = await db.user.findMany({
  select: { id: true, name: true }, // 只选择需要的字段
  take: 20,                          // 限制数量
  where: { isActive: true },         // 添加过滤条件
});
```

**立即行动**：
1. 检查是否有合适的索引
2. 添加 `select` 限制字段
3. 添加 `take` 限制数量
4. 启用缓存

---

### 问题：认证检查很慢

**日志特征**：
```
🟡 [req_xxx] 验证用户认证: 2500.00ms
```

**解决方案**：
```typescript
// 使用中间件传递的用户信息，避免重复验证
const { isLoggedIn, user } = await isRequestAuthenticated(request);
// 这个函数会优先使用中间件缓存的信息
```

**立即行动**：
1. 确保使用 `isRequestAuthenticated` 而不是直接调用 Authing API
2. 考虑缓存用户信息

---

### 问题：API 整体响应慢

**日志特征**：
```
🔴 API 请求完成 [req_xxx] - 8500.00ms
🐌 最慢操作: 数据库事务 (7800.00ms)
```

**分析步骤**：
1. 查看"最慢操作"是什么
2. 查看数据库查询总结
3. 查看外部服务调用总结

**常见原因和解决方案**：

| 最慢操作 | 原因 | 解决方案 |
|---------|------|---------|
| 数据库查询 | 查询复杂/无索引 | 优化查询、添加索引 |
| 外部 API | 网络延迟 | 添加超时、缓存结果 |
| 数据库事务 | 事务太大 | 拆分事务、并行处理 |
| 数据处理 | 循环查询 | 使用批量操作、并行处理 |

---

### 问题：缓存命中率低

**检查方法**：
```typescript
const stats = cache.getStats();
console.log('命中率:', stats.hitRate); // 期望 > 50%
```

**可能原因**：
1. TTL 设置太短
2. 缓存键设计不合理
3. 数据变化频繁

**解决方案**：
```typescript
// 根据数据特性选择合适的 TTL
import { CACHE_TTL } from '@/lib/cache';

cache.set(key, data, CACHE_TTL.SHORT);     // 30秒 - 排行榜
cache.set(key, data, CACHE_TTL.MEDIUM);    // 3分钟 - 用户资料
cache.set(key, data, CACHE_TTL.LONG);      // 10分钟 - 景点列表
cache.set(key, data, CACHE_TTL.VERY_LONG); // 30分钟 - 配置项
```

---

## 🎯 性能优化清单

### 数据库优化 ✅

- [ ] 为常用查询字段添加索引
- [ ] 使用 `select` 限制返回字段
- [ ] 使用 `include` 避免 N+1 查询
- [ ] 添加 `take/limit` 限制返回数量
- [ ] 为大型查询实现分页
- [ ] 使用事务合并多个写操作
- [ ] 检查连接池配置

### 缓存优化 ✅

- [ ] 为常用查询添加缓存
- [ ] 选择合适的 TTL
- [ ] 监控缓存命中率
- [ ] 及时清理过期缓存
- [ ] 在数据更新时清除相关缓存

### API 优化 ✅

- [ ] 添加性能监控
- [ ] 记录关键检查点
- [ ] 实现超时机制
- [ ] 添加错误处理
- [ ] 验证输入参数
- [ ] 限制返回数据量

### 代码优化 ✅

- [ ] 避免在循环中执行数据库查询
- [ ] 使用批量操作代替单条操作
- [ ] 异步操作使用 Promise.all 并行执行
- [ ] 减少不必要的数据转换
- [ ] 优化复杂的业务逻辑

---

## 🛠️ 实用工具

### 查看缓存统计

```typescript
import { cache } from '@/lib/cache';

// 打印详细统计
cache.printStats();

// 获取统计数据
const stats = cache.getStats();
console.log('命中率:', stats.hitRate);
console.log('缓存大小:', stats.size);

// 健康检查
const health = cache.healthCheck();
if (!health.healthy) {
  console.warn('问题:', health.issues);
}

// 查看所有缓存键
console.log('缓存键:', cache.getKeys());
```

### 手动清理缓存

```typescript
// 清理特定缓存
cache.delete(CACHE_KEYS.USER_PROFILE('user123'));

// 清理所有缓存
cache.clear();

// 清理过期缓存
cache.cleanup();
```

### 性能测量

```typescript
import { measureAsync } from '@/lib/performance-monitor';

const result = await measureAsync(
  '操作名称',
  async () => {
    // 你的代码
    return await someOperation();
  }
);
// 自动输出: 🟢 操作名称: 123.45ms
```

---

## 📈 性能目标

| 指标 | 目标值 | 当前 | 状态 |
|-----|--------|------|------|
| API 响应时间 (P95) | < 2000ms | - | 监控中 |
| 数据库查询时间 | < 200ms | - | 监控中 |
| 缓存命中率 | > 50% | - | 监控中 |
| 慢查询比例 | < 5% | - | 监控中 |

---

## 🚨 紧急问题处理

### 数据库连接耗尽

**症状**：错误日志显示 "Too many connections"

**立即行动**：
```typescript
// 检查连接池配置
// lib/db-config.ts
maxConnections: 3 // 减少连接数

// 确保 Prisma 客户端正确关闭
await db.$disconnect();
```

### 内存溢出

**症状**：Vercel 函数超时或内存错误

**立即行动**：
1. 检查缓存大小（`cache.getStats()`）
2. 清理缓存（`cache.clear()`）
3. 减少单次查询返回的数据量
4. 检查是否有内存泄漏

### 请求超时

**症状**：API 响应时间 > 10秒

**立即行动**：
1. 查看性能监控日志找到瓶颈
2. 检查数据库连接状态
3. 验证外部服务是否正常
4. 添加超时保护：
```typescript
const result = await Promise.race([
  yourOperation(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 10000)
  ),
]);
```

---

## 📚 相关文档

- [完整性能优化指南](./performance-optimization-guide.md)
- [数据库优化最佳实践](./database-best-practices.md)（待创建）
- [缓存策略文档](./caching-strategy.md)（待创建）

---

## 💡 快速提示

### 开发环境调试

```typescript
// 启用详细日志
process.env.NODE_ENV = 'development';

// 打印性能统计
cache.printStats();

// 查看数据库查询日志
// Prisma 会自动记录所有查询
```

### 生产环境监控

```typescript
// 启用查询日志（添加到 .env）
ENABLE_QUERY_LOGGING=true

// 查看 Vercel 日志
// Dashboard → Functions → Logs
// 筛选: duration > 2000
```

### 性能测试

```bash
# 使用 Apache Bench
ab -n 100 -c 10 https://your-app.vercel.app/api/endpoint

# 使用 wrk
wrk -t4 -c100 -d30s https://your-app.vercel.app/api/endpoint
```

---

**记住**：持续监控 → 识别问题 → 优化 → 验证效果 → 重复

有问题？查看完整文档或联系技术团队！

