# 腾讯云 MySQL 快速开始指南

## 🚀 快速迁移步骤（5分钟完成）

### 1️⃣ 准备腾讯云 MySQL

**选项 A：使用现有实例**
- 在腾讯云控制台找到您的 MySQL 实例信息
- 记录：主机地址、端口、用户名、密码

**选项 B：创建新实例**
```bash
1. 访问：https://console.cloud.tencent.com/cdb
2. 点击【新建】创建 MySQL 8.0 实例
3. 选择地域：华东（上海）或就近区域
4. 记录连接信息
```

### 2️⃣ 创建数据库

连接到 MySQL 并创建数据库：

```sql
CREATE DATABASE wedding_explorer 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

### 3️⃣ 配置环境变量

在 `.env` 文件中添加（**重要**）：

```bash
# 替换为你的实际信息
DATABASE_URL="mysql://用户名:密码@MySQL主机地址:3306/wedding_explorer"

# 完整示例：
# DATABASE_URL="mysql://root:MyPass123@gz-cdb-a1b2c3.sql.tencentcdb.com:3306/wedding_explorer"
```

### 4️⃣ 运行迁移命令

```bash
# 1. 重新生成 Prisma Client（必须执行）
pnpm prisma generate

# 2. 创建数据库表结构
pnpm prisma migrate dev --name init_mysql

# 3. 运行种子数据（可选，如果有初始数据）
pnpm prisma db seed
```

### 5️⃣ 启动项目

```bash
pnpm dev
```

访问 `http://localhost:3000` 验证是否正常运行。

---

## ✅ 验证清单

- [ ] 腾讯云 MySQL 实例已创建
- [ ] 数据库 `wedding_explorer` 已创建
- [ ] `.env` 文件中已配置 `DATABASE_URL`
- [ ] 执行了 `pnpm prisma generate`
- [ ] 执行了 `pnpm prisma migrate dev`
- [ ] 项目启动成功，无数据库连接错误

---

## 🔧 常见问题快速解决

### 问题1: 连接超时

```bash
# 检查安全组是否允许你的 IP
# 在腾讯云控制台 -> MySQL 实例 -> 安全组 -> 添加你的 IP
```

### 问题2: 认证失败

```bash
# 检查用户名密码是否正确
# 检查 URL 中的特殊字符是否需要编码
# 例如：密码 P@ss 应写为 P%40ss
```

### 问题3: 数据库不存在

```bash
# 确保已创建数据库
mysql -h 你的主机 -u 用户名 -p
CREATE DATABASE wedding_explorer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 问题4: Prisma 迁移失败

```bash
# 清理并重试
pnpm prisma migrate reset  # 警告：会删除所有数据
pnpm prisma migrate dev --name init_mysql
```

---

## 📊 数据迁移（如果有生产数据）

### 从 Supabase 导出数据

**方式1：使用 Supabase 控制台**
1. 登录 Supabase Dashboard
2. 进入 Table Editor
3. 选择表 -> 导出 -> JSON 格式

**方式2：使用 SQL**
```sql
-- 在 Supabase SQL Editor 中执行
COPY (SELECT * FROM system_settings) TO STDOUT WITH CSV HEADER;
```

### 导入到 MySQL

```bash
# 1. 先创建表结构
pnpm prisma migrate deploy

# 2. 使用 Prisma Studio 手动导入（推荐）
pnpm prisma studio
# 打开浏览器，逐条添加或批量粘贴

# 3. 或使用脚本导入 JSON 数据
tsx scripts/import-to-cloudbase.ts path/to/your/data.json
```

---

## 🎯 测试数据库

创建测试脚本 `test-mysql.ts`：

```typescript
import { db } from '@/lib/db'

async function test() {
  console.log('🔍 测试 MySQL 连接...')
  
  try {
    // 测试基本查询
    const result = await db.$queryRaw`SELECT VERSION() as version`
    console.log('✅ MySQL 版本:', result)
    
    // 测试表查询
    const count = await db.systemSetting.count()
    console.log('✅ 系统设置数量:', count)
    
    console.log('🎉 数据库连接正常！')
  } catch (error) {
    console.error('❌ 连接失败:', error)
  } finally {
    await db.$disconnect()
  }
}

test()
```

运行测试：

```bash
npx tsx test-mysql.ts
```

---

## 📝 下一步

✅ 基础配置完成后，建议：

1. **配置备份策略**
   - 在腾讯云控制台配置自动备份
   - 建议每天备份，保留 7 天

2. **设置监控告警**
   - CPU 使用率 > 80%
   - 连接数告警
   - 慢查询告警

3. **优化性能**
   - 查看 [完整迁移指南](./mysql-migration-guide.md)
   - 根据实际情况调整连接池配置

4. **清理旧配置**
   - 确认迁移成功后
   - 删除 `.env` 中的 Supabase 相关配置

---

## 🆘 需要帮助？

- 详细迁移指南：`docs/mysql-migration-guide.md`
- 腾讯云 MySQL 文档：https://cloud.tencent.com/document/product/236
- Prisma MySQL 文档：https://www.prisma.io/docs/concepts/database-connectors/mysql

---

**提示**：首次迁移建议在开发环境测试无误后，再在生产环境执行。

