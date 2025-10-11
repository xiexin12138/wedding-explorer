# 数据迁移问题记录

## 问题 1: 缺少 ATTRACTIONS 枚举值

### 问题描述

**时间**: 2025-10-11  
**错误**: 迁移 `attractions_list` 时失败

```
Invalid value for argument `category`. Expected SettingCategory.
category: "ATTRACTIONS"
          ~~~~~~~~~~~~~
```

**原因**: CloudBase 中的数据使用了 `ATTRACTIONS` 作为 category，但 Prisma schema 的 `SettingCategory` 枚举中没有这个值。

### 解决方案

1. **修改 Prisma Schema**:

```prisma
enum SettingCategory {
  SYSTEM
  SECURITY
  NOTIFICATION
  WEDDING
  VENUE
  GUEST
  SCHEDULE
  MAP
  ATTRACTIONS  // ← 新增
  CHAT
  ANALYTICS
  UI_UX

  @@map("setting_category")
}
```

2. **创建并应用迁移**:

```bash
npx prisma migrate dev --name add_attractions_category
```

3. **重新运行数据迁移脚本**:

```bash
npx tsx scripts/migrate-dictionary-from-cloudbase.ts
```

### 迁移结果

✅ **第一次运行** (修复前):
- 成功: 5 条
- 跳过: 0 条
- 失败: 1 条 (`attractions_list`)

✅ **第二次运行** (修复后):
- 成功: 1 条 (`attractions_list`)
- 跳过: 5 条 (已存在的记录)
- 失败: 0 条

✅ **最终结果**: 6 条记录全部成功迁移到 MySQL

### 迁移的数据清单

| key | displayName | category | valueType | 状态 |
|-----|-------------|----------|-----------|------|
| `beginDate` | 开始日期 | SYSTEM | STRING | ✅ |
| `game_coin_exchange_list` | 礼物兑换 | SYSTEM | JSON | ✅ |
| `game_coin_auction_list` | 礼物拍卖 | SYSTEM | JSON | ✅ |
| `LEADERBOARD_MIN_COIN_THRESHOLD` | 排行榜最低上榜金币数 | SYSTEM | STRING | ✅ |
| `timeline` | 活动时间线 | SYSTEM | JSON | ✅ |
| `attractions_list` | 景点列表 | ATTRACTIONS | JSON | ✅ |

### 经验总结

1. **枚举值对齐**: 迁移前需要确保目标数据库的枚举值包含源数据库中使用的所有值
2. **增量迁移**: 脚本设计为增量式，会自动跳过已存在的记录，可以安全地重复运行
3. **错误处理**: 脚本会记录失败的记录并继续处理，不会因为单个记录失败而中断整个迁移

## 数据验证

### 验证步骤

1. **检查记录数**:
```sql
SELECT COUNT(*) FROM system_settings;
-- 预期结果: 6
```

2. **查看所有记录**:
```sql
SELECT key, displayName, category, valueType FROM system_settings;
```

3. **使用 Prisma Studio**:
```bash
npx prisma studio
```

### 验证结果

✅ 所有 6 条记录已成功导入  
✅ 字段完整性验证通过  
✅ 数据格式正确  

## 相关文件

- `prisma/schema.prisma` - 添加了 ATTRACTIONS 枚举值
- `prisma/migrations/20251011042006_add_attractions_category/` - 数据库迁移
- `scripts/migrate-dictionary-from-cloudbase.ts` - 数据迁移脚本

## 下一步

迁移已全部完成，可以：

1. ✅ 部署到生产环境
2. ✅ 测试所有相关功能
3. ✅ 监控性能和稳定性
4. 🔄 (可选) 清理 CloudBase 旧数据

---

**状态**: ✅ 已解决  
**迁移完成时间**: 2025-10-11 12:20  
**总耗时**: ~5 分钟

