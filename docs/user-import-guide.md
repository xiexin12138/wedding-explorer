# 用户数据导入指南

## 概述

本指南说明如何从 CSV 文件导入用户数据到婚礼探索系统数据库。

## 导入流程

### 1. 准备 CSV 文件

将用户数据 CSV 文件放置在 `public/` 目录下。CSV 文件应包含以下字段：

- 用户id
- 姓名
- 手机地区号
- 手机号
- 邮箱
- 用户名
- 原系统 ID（externalId）
- 性别
- 密码
- 国家
- 省份
- 城市
- 是否禁用账户
- 首次登录修改密码
- 所属部门

### 2. 字段映射规则

CSV 字段到数据库字段的映射关系：

| CSV 字段 | 数据库字段 | 说明 |
|---------|-----------|------|
| 用户id | id | 保留原系统用户 ID |
| 姓名 | name, nickname | 优先作为昵称显示 |
| 手机号 | - | 如无姓名，用手机号后4位生成昵称 |
| 邮箱 | email | 可选 |
| 是否禁用账户 | isActive | "是" 映射为 false，其他为 true |
| - | role | 默认设置为 GUEST（宾客） |
| - | coins | 初始游戏币为 0 |

### 3. 运行导入脚本

```bash
# 导入用户数据
pnpm run seed:import-users

# 或使用 npx
npx tsx prisma/seeds/import-users-from-csv.ts
```

### 4. 验证导入结果

```bash
# 查看导入的用户数据
pnpm run seed:verify-users

# 或使用 npx
npx tsx prisma/seeds/verify-users.ts
```

## 导入结果示例

成功导入后，你会看到类似以下的输出：

```
🚀 开始导入用户数据...

📄 读取 CSV 文件: /path/to/wedding-explorer-20251009213011.csv
📊 共找到 10 条用户记录

✅ 成功创建用户: Kelffy (ID: 687f0c0bff42b13663e8cde5)
✅ 成功创建用户: 谢大鑫 (ID: 687a12f979a475174042e2ac)
...

📈 导入统计:
  ✅ 成功: 10 条
  ⏭️  跳过: 0 条
  ❌ 失败: 0 条
  📊 总计: 10 条

🎉 用户数据导入完成！
```

## 注意事项

1. **重复导入**: 脚本会检查用户 ID 是否已存在，已存在的用户会被跳过，不会重复创建
2. **数据安全**: 导入前建议备份数据库
3. **字段缺失**: 如果 CSV 中某些字段为空，会使用默认值或设置为 null
4. **角色设置**: 所有导入的用户默认角色为 `GUEST`（宾客），可后续在管理后台调整
5. **游戏币**: 所有新用户初始游戏币为 0

## 相关文件

- **导入脚本**: `prisma/seeds/import-users-from-csv.ts`
- **验证脚本**: `prisma/seeds/verify-users-from-csv.ts`
- **CSV 文件**: `public/wedding-explorer-20251009213011.csv`

## 相关文档

- [用户游戏币系统](./user-coin-system.md)
- [Prisma Schema](../prisma/schema.prisma)

