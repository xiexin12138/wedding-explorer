    # 从 Supabase PostgreSQL 迁移到腾讯云 MySQL 指南

本指南将帮助您完成从 Supabase PostgreSQL 到腾讯云 MySQL 的完整迁移。

## 一、为什么可以继续使用 Prisma？

**答案：完全可以！** Prisma 是一个强大的 ORM，原生支持多种数据库：
- PostgreSQL
- MySQL
- SQLite
- SQL Server
- MongoDB
- CockroachDB

只需修改 `prisma/schema.prisma` 中的 `datasource` 配置即可无缝切换数据库。

## 二、准备工作

### 1. 在腾讯云创建 MySQL 实例

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入【云数据库 MySQL】服务
3. 创建 MySQL 实例，建议配置：
   - 版本：MySQL 8.0
   - 地域：选择离您最近的区域（如华东-上海）
   - 实例规格：根据需求选择（开发环境可选基础版）
   - 存储空间：根据数据量选择（建议至少 20GB）

### 2. 配置数据库安全组

1. 在实例管理页面，配置安全组规则
2. 添加您的 IP 地址到白名单（开发环境）
3. 生产环境建议只允许服务器 IP 访问

### 3. 创建数据库

连接到 MySQL 实例后，创建项目数据库：

```sql
CREATE DATABASE wedding_explorer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 三、配置步骤

### 1. 更新环境变量

在 `.env` 文件中添加或替换数据库配置：

```bash
# ======== 腾讯云 MySQL 配置 ========
# 格式：mysql://用户名:密码@主机地址:端口/数据库名
DATABASE_URL="mysql://用户名:密码@host.tencentcdb.com:3306/wedding_explorer"

# 示例：
# DATABASE_URL="mysql://root:your_password@gz-cdb-xxxxx.sql.tencentcdb.com:3306/wedding_explorer"
```

**重要提示：**
- 替换 `用户名`、`密码`、`主机地址` 为您的实际配置
- 主机地址可在腾讯云控制台的实例详情页找到
- 确保添加了 SSL 参数以保证连接安全

### 2. 已完成的配置文件修改

以下文件已自动更新，无需手动修改：

✅ `prisma/schema.prisma` - 数据源已改为 MySQL
✅ `lib/db-config.ts` - 连接配置已适配 MySQL

### 3. 环境变量清理（可选）

迁移完成后，可以删除或注释掉旧的 Supabase 配置：

```bash
# 以下配置可以删除或注释
# POSTGRES_URL=...
# POSTGRES_PRISMA_URL=...
# POSTGRES_URL_NON_POOLING=...
# SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# 等等
```

## 四、数据迁移步骤

### 方案一：全新部署（推荐用于开发环境）

如果是开发环境或数据不重要，直接重新创建数据库：

```bash
# 1. 重新生成 Prisma Client
pnpm prisma generate

# 2. 创建迁移文件
pnpm prisma migrate dev --name init_mysql

# 3. 运行种子数据（如果有）
pnpm prisma db seed
```

### 方案二：迁移现有数据（生产环境）

#### 步骤 1：导出 Supabase 数据

```bash
# 使用 pg_dump 导出 PostgreSQL 数据（需要安装 PostgreSQL 客户端）
pg_dump "YOUR_SUPABASE_CONNECTION_STRING" \
  --data-only \
  --format=plain \
  --file=backup.sql
```

#### 步骤 2：转换数据格式

由于 PostgreSQL 和 MySQL 的 SQL 语法有差异，需要进行转换。可以使用在线工具或手动调整：

**主要差异：**
- PostgreSQL 使用 `SERIAL`，MySQL 使用 `AUTO_INCREMENT`
- PostgreSQL 使用 `TEXT`，MySQL 建议使用 `VARCHAR` 或 `TEXT`
- 时间戳格式可能需要调整
- Enum 类型处理方式不同

#### 步骤 3：导入到 MySQL

```bash
# 1. 首先运行 Prisma 迁移创建表结构
pnpm prisma migrate deploy

# 2. 导入转换后的数据
mysql -h your-host -u your-user -p wedding_explorer < converted_data.sql
```

### 方案三：使用数据迁移工具

推荐使用专业的数据迁移工具：
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- 腾讯云 DTS（数据传输服务）
- [pgloader](https://github.com/dimitri/pgloader) - 支持 PostgreSQL 到 MySQL 的自动转换

## 五、验证迁移

### 1. 测试数据库连接

创建测试脚本 `test-db.ts`：

```typescript
import { db } from '@/lib/db'

async function testConnection() {
  try {
    // 测试查询
    const result = await db.$queryRaw`SELECT 1 as test`
    console.log('✅ 数据库连接成功:', result)
    
    // 测试表查询
    const settings = await db.systemSetting.findMany({ take: 1 })
    console.log('✅ 表查询成功:', settings)
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
  } finally {
    await db.$disconnect()
  }
}

testConnection()
```

运行测试：

```bash
npx tsx test-db.ts
```

### 2. 检查数据完整性

```bash
# 在 MySQL 中检查表和数据
mysql -h your-host -u your-user -p -e "
USE wedding_explorer;
SHOW TABLES;
SELECT COUNT(*) FROM system_settings;
SELECT COUNT(*) FROM ActivityTimeline;
"
```

## 六、性能优化建议

### 1. 启用查询缓存

MySQL 8.0+ 默认禁用查询缓存，但可以通过应用层缓存优化：

```typescript
// 已在 lib/db-config.ts 中配置
export const dbConfig = {
  query: {
    enableQueryCache: true,
    queryCacheTTL: 300000, // 5分钟
  }
}
```

### 2. 添加索引优化

确保常用查询字段有索引（已在 schema.prisma 中定义）：

```prisma
model SystemSetting {
  // ...
  @@index([category])
  @@index([isEnabled])
  @@index([sortOrder])
}
```

### 3. 连接池配置

已在 `lib/db-config.ts` 中优化配置：
- 最大连接数：20
- 连接超时：10秒
- 查询超时：30秒

### 4. SSL 连接

生产环境强烈建议启用 SSL：

```bash
DATABASE_URL="mysql://user:pass@host:3306/db?sslaccept=strict"
```

## 七、常见问题

### Q1: 迁移后出现字符编码问题？

**解决方案：**
确保数据库、表、字段都使用 `utf8mb4` 编码：

```sql
ALTER DATABASE wedding_explorer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Q2: 日期时间字段显示不正确？

**解决方案：**
检查时区设置，在连接 URL 中添加时区参数：

```bash
DATABASE_URL="mysql://...?timezone=Asia/Shanghai"
```

### Q3: Enum 类型迁移问题？

**解决方案：**
Prisma 会自动处理 Enum 类型，MySQL 中会创建对应的 ENUM 字段。如果有问题，可以在 schema.prisma 中显式指定：

```prisma
enum SettingValueType {
  STRING
  NUMBER
  BOOLEAN
  JSON
  ARRAY

  @@map("setting_value_type")
}
```

### Q4: 性能比 Supabase 慢？

**排查步骤：**
1. 检查网络延迟：`ping your-mysql-host`
2. 查看慢查询日志
3. 优化索引
4. 检查连接池配置
5. 考虑使用腾讯云 CDN 加速

### Q5: 连接数过多导致错误？

**解决方案：**
调整连接池配置或升级实例规格：

```typescript
// lib/db-config.ts
connectionPool: {
  maxConnections: 10, // 降低最大连接数
  minConnections: 2,
}
```

## 八、回滚方案

如果迁移遇到问题需要回滚：

### 1. 恢复 Prisma 配置

```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}
```

### 2. 恢复环境变量

使用原来的 Supabase 配置

### 3. 重新生成 Prisma Client

```bash
pnpm prisma generate
pnpm dev
```

## 九、后续维护

### 定期备份

设置腾讯云自动备份：
1. 进入实例管理页面
2. 配置自动备份策略
3. 建议每天备份，保留 7 天

### 监控告警

配置云监控告警：
- CPU 使用率 > 80%
- 内存使用率 > 80%
- 连接数告警
- 慢查询告警

### 性能优化

定期检查：
- 慢查询日志
- 索引使用情况
- 表碎片整理
- 连接池状态

## 十、相关资源

- [Prisma MySQL 文档](https://www.prisma.io/docs/concepts/database-connectors/mysql)
- [腾讯云 MySQL 文档](https://cloud.tencent.com/document/product/236)
- [MySQL 8.0 官方文档](https://dev.mysql.com/doc/refman/8.0/en/)
- [Prisma Migrate 指南](https://www.prisma.io/docs/concepts/components/prisma-migrate)

## 总结

迁移完成后，您将获得：
- ✅ 更快的访问速度（中国大陆）
- ✅ 更稳定的连接
- ✅ 更灵活的配置选项
- ✅ 更好的性价比
- ✅ 继续使用熟悉的 Prisma ORM

如有问题，请参考本文档或联系技术支持。

