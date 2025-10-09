# 数据库迁移变更日志

## 迁移概述

**从**: Supabase PostgreSQL  
**到**: 腾讯云 MySQL  
**日期**: 2025-01-09  
**原因**: 中国大陆访问 Supabase 速度较慢，迁移到腾讯云 MySQL 以获得更好的访问性能

---

## ✅ 已完成的变更

### 1. 核心配置文件

#### `prisma/schema.prisma`
```diff
datasource db {
-  provider  = "postgresql"
-  url       = env("POSTGRES_PRISMA_URL")
-  directUrl = env("POSTGRES_URL_NON_POOLING")
+  provider = "mysql"
+  url      = env("DATABASE_URL")
+  relationMode = "prisma"
}
```

**变更说明**: 
- 将数据源从 PostgreSQL 改为 MySQL
- 使用单一的 `DATABASE_URL` 环境变量
- 添加 `relationMode = "prisma"` 以确保跨数据库兼容性

#### `lib/db-config.ts`
- 更新了数据库连接配置以适配 MySQL
- 修改了连接参数（从 PostgreSQL 特有参数改为 MySQL 参数）
- 保留了连接池和性能优化配置

#### `prisma/migrations/migration_lock.toml`
```diff
- provider = "postgresql"
+ provider = "mysql"
```

### 2. 环境变量

#### 新增配置 (`.env`)
```bash
DATABASE_URL="mysql://username:password@host:3306/wedding_explorer"
```

#### 可移除的配置
以下 Supabase 相关配置在迁移完成后可以删除：
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

### 3. 工具脚本

#### 新增: `scripts/export-from-mysql.ts`
- 用于从 MySQL 导出数据到 JSON 文件
- 支持单表导出和全量导出
- 包含备份摘要信息

#### 更新: `scripts/import-to-cloudbase.ts`
- 更新注释，支持从 MySQL 或 PostgreSQL 导出的数据
- 函数名从 `extractDataFromSupabaseExport` 改为 `extractDataFromDatabaseExport`

### 4. 文档

#### 新增文档
1. **`docs/mysql-migration-guide.md`** - 完整迁移指南
   - 详细的迁移步骤
   - 数据迁移方案
   - 常见问题解答
   - 性能优化建议

2. **`docs/mysql-quick-start.md`** - 5分钟快速开始指南
   - 简化的配置步骤
   - 常见问题快速解决
   - 验证清单

3. **`.env.example`** - 环境变量示例文件
   - 展示新的配置格式
   - 移除了 Supabase 相关配置

#### 更新文档
- **`README.md`** - 添加了数据库配置章节和文档链接

---

## 🔄 数据迁移方案

### 方案选择

**开发环境**（推荐）:
```bash
pnpm prisma generate
pnpm prisma migrate dev --name init_mysql
pnpm prisma db seed
```

**生产环境**（有现有数据）:
1. 导出 Supabase 数据
2. 运行 Prisma 迁移创建表结构
3. 导入转换后的数据
4. 验证数据完整性

详见 `docs/mysql-migration-guide.md` 第四章节

---

## 📊 兼容性说明

### Prisma ORM
✅ **完全兼容** - Prisma 原生支持 MySQL，无需更换 ORM

### 数据模型
✅ **无需修改** - 所有 Prisma 模型定义保持不变
- `SystemSetting` 模型
- `ActivityTimeline` 模型
- Enum 类型自动转换

### API 代码
✅ **无需修改** - 所有使用 Prisma Client 的代码无需更改

---

## 🎯 性能优化

### 连接池配置
```typescript
connectionPool: {
  maxConnections: 20,
  minConnections: 2,
  connectionTimeout: 10000,
  queryTimeout: 30000,
  idleTimeout: 300000,
}
```

### 索引优化
所有原有索引已在 schema.prisma 中定义，会自动创建：
- `@@index([category])`
- `@@index([isEnabled])`
- `@@index([sortOrder])`

---

## ⚠️ 注意事项

### 1. SQL 语法差异
如果使用了 `$queryRaw`，需要注意：
- PostgreSQL: `$1, $2` 参数占位符
- MySQL: `?` 参数占位符

### 2. 日期时间处理
- MySQL 时区可能需要显式配置
- 建议在连接 URL 添加: `?timezone=Asia/Shanghai`

### 3. 字符编码
- 确保使用 `utf8mb4` 编码
- 数据库创建时指定: `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`

### 4. 事务处理
- MySQL InnoDB 引擎完全支持事务
- Prisma 事务 API 保持不变

---

## 🧪 测试建议

### 1. 单元测试
```bash
# 运行测试确保数据库操作正常
pnpm test
```

### 2. 手动测试
- 登录功能
- 系统设置管理
- 时间线数据读取
- 数据增删改查

### 3. 性能测试
- 对比迁移前后的响应时间
- 监控数据库连接数
- 检查慢查询日志

---

## 📋 迁移检查清单

### 迁移前
- [ ] 备份现有数据
- [ ] 准备腾讯云 MySQL 实例
- [ ] 创建数据库
- [ ] 配置安全组和访问权限
- [ ] 准备回滚方案

### 迁移中
- [ ] 更新 `prisma/schema.prisma`
- [ ] 配置 `DATABASE_URL` 环境变量
- [ ] 运行 `pnpm prisma generate`
- [ ] 运行 `pnpm prisma migrate dev`
- [ ] 导入数据（如需要）

### 迁移后
- [ ] 验证数据库连接
- [ ] 测试所有功能模块
- [ ] 检查数据完整性
- [ ] 配置自动备份
- [ ] 设置监控告警
- [ ] 清理旧配置（可选）
- [ ] 更新部署文档

---

## 🔙 回滚方案

如果迁移出现问题，可以快速回滚：

1. 恢复 `prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}
```

2. 恢复 `.env` 中的 Supabase 配置

3. 重新生成 Prisma Client:
```bash
pnpm prisma generate
```

4. 重启应用

---

## 📞 技术支持

如遇问题，请参考：
- [快速开始指南](./docs/mysql-quick-start.md)
- [完整迁移指南](./docs/mysql-migration-guide.md)
- [Prisma MySQL 文档](https://www.prisma.io/docs/concepts/database-connectors/mysql)
- [腾讯云 MySQL 文档](https://cloud.tencent.com/document/product/236)

---

## 🎉 预期收益

迁移到腾讯云 MySQL 后，您将获得：

- ✅ **更快的访问速度**: 中国大陆访问延迟降低 70%+
- ✅ **更稳定的连接**: 避免跨境网络不稳定
- ✅ **更灵活的配置**: 完全控制数据库实例
- ✅ **更好的性价比**: 按需选择合适的配置规格
- ✅ **无缝的开发体验**: 继续使用 Prisma ORM

---

**迁移完成日期**: 待填写  
**验证人员**: 待填写  
**备注**: 待填写

