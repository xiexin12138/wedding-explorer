# 数据库连接重试机制优化

## 问题描述

**时间**：2025-10-15

**环境**：生产环境

**错误日志**：
```
❌ 查询用户映射失败 (尝试 1/3): Error [PrismaClientInitializationError]: 
Invalid `prisma.authingUser.findUnique()` invocation:

Can't reach database server at `sh-cynosdbmysql-grp-2gca0no0.sql.tencentcdb.com:29516`

Please make sure your database server is running at `sh-cynosdbmysql-grp-2gca0no0.sql.tencentcdb.com:29516`.
```

## 问题分析

### 错误原因

1. **数据库连接失败**：无法连接到腾讯云 MySQL 数据库服务器
2. **重试机制不完整**：`withDatabaseRetry` 函数的错误检测逻辑不包含 `Can't reach database server` 错误
3. **错误类型未识别**：`PrismaClientInitializationError` 错误没有被识别为可重试的连接错误

### 调用链

1. `GET /api/attractions/[id]/check-ins` → `requireAuth()`
2. `lib/auth.ts:requireAuth()` → `db.authingUser.findUnique()`
3. Prisma Client 尝试连接数据库
4. 数据库连接失败 → `PrismaClientInitializationError`
5. 重试机制未触发 → 直接抛出异常

### 问题影响

1. **用户体验受损**：景点打卡、排行榜等功能在数据库网络波动时完全不可用
2. **缺乏容错性**：单次网络波动就会导致请求失败
3. **错误信息不友好**：技术性错误信息直接暴露给用户

## 解决方案

### 方案概述

优化数据库连接重试机制，增强错误检测能力，提供更友好的错误提示。

### 修改内容

#### 1. 增强 `withDatabaseRetry` 错误检测逻辑

**文件**：`lib/db.ts`

**修改**：
- 扩展错误消息检测列表，包含更多连接错误类型
- 添加错误类型名称检测，识别 Prisma 特定错误
- 改进错误日志，显示完整的错误消息

```typescript
// 检查是否是连接相关错误（需要重试）
const errorMessage = error instanceof Error ? error.message : String(error);
const errorName = error instanceof Error ? error.constructor.name : '';

const isConnectionError = 
  errorMessage.includes('connection pool') ||
  errorMessage.includes('Timed out') ||
  errorMessage.includes('Connection terminated') ||
  errorMessage.includes('Connection refused') ||
  errorMessage.includes("Can't reach database server") ||  // 新增
  errorMessage.includes('ETIMEDOUT') ||                    // 新增
  errorMessage.includes('ECONNREFUSED') ||                 // 新增
  errorMessage.includes('ENOTFOUND') ||                    // 新增
  errorMessage.includes('ECONNRESET') ||                   // 新增
  errorName === 'PrismaClientInitializationError' ||       // 新增
  errorName === 'PrismaClientKnownRequestError';           // 新增
```

#### 2. 优化重试配置

**文件**：`lib/db-config.ts`

**修改**：
- 增加最大重试次数从 2 次到 3 次
- 增加重试间隔从 500ms 到 1000ms
- 提高指数退避因子从 1.5 到 2

```typescript
retry: {
  maxRetries: 3,           // 2 → 3
  retryDelay: 1000,        // 500ms → 1000ms
  backoffFactor: 2,        // 1.5 → 2
}
```

**重试时间线**：
- 第 1 次尝试：立即
- 第 2 次尝试：1000ms 后（1秒）
- 第 3 次尝试：2000ms 后（2秒）
- 第 4 次尝试：4000ms 后（4秒）
- 总计：最多 7 秒后失败

#### 3. 改进错误处理和日志

**文件**：`lib/auth.ts`

**修改**：
- 添加更详细的日志记录
- 区分数据库连接错误和其他错误
- 返回用户友好的错误信息

```typescript
try {
  console.log('🔍 开始查询用户映射:', user.sub)
  // ... 数据库查询 ...
} catch (error) {
  console.error('❌ 处理数据库用户ID失败:', error)
  
  // 检查是否是数据库连接错误
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (
    errorMessage.includes("Can't reach database server") ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('connection')
  ) {
    throw new Error('数据库连接失败，请稍后重试。如果问题持续存在，请联系管理员。')
  }
  
  throw new Error('用户信息同步失败，请稍后重试')
}
```

## 技术细节

### 重试策略

采用**指数退避（Exponential Backoff）**策略：
- 每次重试的等待时间呈指数增长
- 避免在短时间内大量重试导致服务器压力
- 给予数据库服务器恢复时间

### 错误分类

#### 可重试错误（Connection Errors）
- `Can't reach database server`
- `connection pool`
- `Timed out`
- `Connection terminated`
- `Connection refused`
- `ETIMEDOUT`
- `ECONNREFUSED`
- `ENOTFOUND`
- `ECONNRESET`
- `PrismaClientInitializationError`
- `PrismaClientKnownRequestError`

#### 不可重试错误
- 数据验证错误
- 权限错误
- 业务逻辑错误
- 其他非连接相关错误

### 性能影响

- **正常情况**：无额外开销
- **网络波动**：
  - 轻微波动：1-2秒额外延迟（1-2次重试）
  - 严重故障：最多7秒延迟（4次尝试全部失败）
- **用户体验**：
  - 提高成功率，减少因瞬时网络问题导致的失败
  - 延迟可接受，优于直接失败

## 监控建议

### 关键指标

1. **数据库连接成功率**
   - 监控 `withDatabaseRetry` 的重试次数分布
   - 关注第一次尝试的成功率

2. **重试统计**
   - 每天重试次数
   - 重试成功率
   - 平均重试延迟

3. **错误类型分布**
   - 统计各类连接错误的频率
   - 识别常见失败模式

### 日志关键字

```bash
# 正常查询
🔍 开始查询用户映射
✅ API层查询 dbUserId

# 重试日志
⚠️ 查询用户映射连接失败，1000ms后重试 (尝试 1/4)
⚠️ 查询用户映射连接失败，2000ms后重试 (尝试 2/4)

# 最终失败
❌ 查询用户映射失败 (尝试 4/4)
❌ 处理数据库用户ID失败
```

## 进一步优化建议

### 短期优化

1. **添加监控告警**
   - 当重试率超过 10% 时发送告警
   - 当连续失败超过 5 次时发送告警

2. **数据库健康检查**
   - 定期执行健康检查（每分钟一次）
   - 在连接失败时先检查健康状态
   - 如果健康检查失败，直接返回错误，避免无谓重试

### 长期优化

1. **连接池优化**
   - 考虑使用 PgBouncer 或类似连接池中间件
   - 优化连接池大小和超时配置

2. **缓存策略**
   - 对用户映射关系进行短期缓存（如 Redis）
   - 减少数据库查询频率

3. **数据库高可用**
   - 配置数据库主从复制
   - 考虑使用读写分离
   - 配置故障自动切换

4. **降级策略**
   - 在数据库完全不可用时，提供只读模式
   - 使用本地缓存或 CDN 缓存静态数据

## 相关文档

- [数据库配置优化](./db-config-optimization.md)
- [CloudBase 超时问题修复](./fix-cloudbase-timeout-issue.md)
- [性能监控指南](./performance-monitoring-README.md)

## 验证结果

✅ 构建成功  
✅ 类型检查通过  
✅ Linter 检查通过  
✅ 重试逻辑测试通过

## 部署建议

1. **部署前检查**
   - 确认数据库连接配置正确
   - 确认环境变量已正确设置
   - 确认数据库服务器可访问

2. **部署步骤**
   - 先在预发布环境验证
   - 观察日志，确认重试机制正常工作
   - 逐步灰度发布到生产环境

3. **部署后监控**
   - 密切关注数据库连接错误率
   - 监控重试次数和成功率
   - 观察用户反馈和错误报告

## 总结

本次优化主要解决了生产环境中数据库连接失败时缺乏有效重试机制的问题。通过：

1. **增强错误检测**：识别更多类型的连接错误
2. **优化重试策略**：增加重试次数和间隔时间
3. **改进错误处理**：提供更友好的用户提示

显著提高了系统在网络波动情况下的可用性和用户体验。

---

**修改人**: AI Assistant  
**修改时间**: 2025-10-15  
**影响范围**: 
- `lib/db.ts`
- `lib/db-config.ts`
- `lib/auth.ts`

