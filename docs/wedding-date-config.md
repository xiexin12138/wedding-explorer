# 婚礼日期配置说明

## 概述

首页的婚礼倒计时现在从系统字典读取 `beginDate` 配置项，而不是硬编码在代码中。这样可以通过管理后台灵活调整婚礼开始时间。

## 配置位置

### 方式一：通过管理后台配置

1. 登录系统（需要管理员权限）
2. 进入【设置】→【字典管理】页面
3. 找到或创建 `beginDate` 配置项
4. 设置值和保存

### 方式二：通过数据库直接配置

字典项存储在 `system_settings` 表（MySQL）或 CloudBase 的 `system_settings` 集合中。

## 配置格式

### 数据结构

```typescript
{
  key: 'beginDate',              // 配置键名（固定）
  displayName: '开始日期',        // 显示名称
  valueType: 'NUMBER',           // 值类型（推荐使用 NUMBER 存储时间戳）
  category: 'WEDDING',           // 分类
  value: '1729814400000',        // 时间戳（毫秒）
  isSystem: true,                // 是否为系统配置
  isEnabled: true,               // 是否启用
  sortOrder: 0,                  // 排序
}
```

### 值格式说明

`beginDate` 支持两种格式：

#### 1. 时间戳（推荐）

存储为数字字符串，表示从 1970-01-01 00:00:00 UTC 至该时间的毫秒数。

```javascript
// 示例：2025-10-25 06:00:00 的时间戳
value: '1729814400000'
```

**如何获取时间戳：**

```javascript
// 在浏览器控制台或 Node.js 中执行
const date = new Date('2025-10-25 06:00:00');
console.log(date.valueOf()); // 输出：1729814400000
```

#### 2. 日期字符串

也支持标准的日期字符串格式：

```javascript
value: '2025-10-25 06:00:00'
value: '2025-10-25T06:00:00.000Z'
```

## 初始化配置

### 使用 Prisma Seed

项目中已经包含了初始化脚本 `prisma/seed.ts`，会自动创建 `beginDate` 配置：

```typescript
const setting: Prisma.SystemSettingCreateInput[] = [
  {
    key: 'beginDate',
    displayName: '开始日期',
    valueType: 'NUMBER',
    category: 'WEDDING',
    value: (new Date('2025-10-25 00:00')).valueOf() + '',
    isSystem: true,
    isEnabled: true,
  },
]
```

**运行初始化：**

```bash
pnpm prisma db seed
```

### 手动创建

如果需要手动创建或更新，可以使用 Prisma Studio：

```bash
pnpm prisma studio
```

或者通过 SQL（MySQL）：

```sql
INSERT INTO system_settings (
  id, 
  `key`, 
  displayName, 
  valueType, 
  category, 
  value, 
  isSystem, 
  isEnabled, 
  sortOrder, 
  createdAt, 
  updatedAt
) VALUES (
  'clxxxxxxxxxxxxxx',  -- 生成一个唯一 ID
  'beginDate',
  '开始日期',
  'NUMBER',
  'WEDDING',
  '1729814400000',     -- 你的时间戳
  1,
  1,
  0,
  NOW(),
  NOW()
);
```

## 修改配置

### 方式一：管理后台

1. 进入【设置】→【字典管理】
2. 找到 `beginDate` 配置项
3. 点击【编辑】
4. 修改 `value` 字段为新的时间戳或日期字符串
5. 保存

### 方式二：Prisma Studio

```bash
pnpm prisma studio
```

在浏览器中打开，找到 `SystemSetting` 表，编辑 `beginDate` 记录。

### 方式三：数据库 SQL

```sql
-- 更新为新的时间戳
UPDATE system_settings 
SET value = '1730000000000',  -- 新的时间戳
    updatedAt = NOW()
WHERE `key` = 'beginDate';
```

## 时间戳转换工具

### JavaScript / TypeScript

```javascript
// 日期转时间戳
const date = new Date('2025-10-25 06:00:00');
const timestamp = date.valueOf();
console.log(timestamp); // 1729814400000

// 时间戳转日期
const date = new Date(1729814400000);
console.log(date.toLocaleString('zh-CN')); // 2025/10/25 06:00:00
```

### 在线工具

- [Unix 时间戳转换](https://tool.lu/timestamp/)
- [时间戳转换器](https://www.unixtimestamp.com/)

## 组件实现

### WeddingCountdown 组件

位置：`components/WeddingCountdown.tsx`

**核心逻辑：**

1. 从字典服务获取 `beginDate` 配置
2. 自动识别时间戳或日期字符串格式
3. 如果获取失败或格式错误，使用默认日期（2025-10-25 06:00）
4. 每秒更新倒计时显示

**代码示例：**

```typescript
// 从字典读取开始日期
const beginDate = await getDictionaryValueByKey("beginDate");

// 支持时间戳和日期字符串
const timestamp = Number(beginDate);
const date = !isNaN(timestamp) 
  ? new Date(timestamp)  // 时间戳
  : new Date(beginDate); // 日期字符串
```

## 缓存处理

字典数据会被缓存 10 分钟，如果修改了配置但页面没有更新：

1. 等待 10 分钟缓存自动过期
2. 或者重启开发服务器
3. 或者清除浏览器缓存并刷新页面

## 故障排查

### 问题 1：首页显示"加载中..."

**原因：** 无法从字典获取 `beginDate` 配置

**解决：**
1. 检查数据库中是否存在 `beginDate` 配置
2. 检查配置的 `isEnabled` 是否为 `true`
3. 查看浏览器控制台是否有错误日志

```bash
# 检查数据库
pnpm prisma studio

# 或使用 MySQL 命令
mysql> SELECT * FROM system_settings WHERE `key` = 'beginDate';
```

### 问题 2：显示时间不正确

**原因：** 时间戳或日期格式有误

**解决：**
1. 检查 `value` 字段的值是否正确
2. 确认时间戳是毫秒级（13 位数字）
3. 日期字符串格式应为：`YYYY-MM-DD HH:mm:ss`

```javascript
// 验证时间戳
const timestamp = 1729814400000;
const date = new Date(timestamp);
console.log(date.toString()); // 应该显示正确的日期

// 如果显示不正确，可能是秒级时间戳，需要乘以 1000
const correctTimestamp = timestamp * 1000;
```

### 问题 3：时区问题

**原因：** 服务器时区和本地时区不一致

**解决：**
1. 使用带时区的 ISO 8601 格式：`2025-10-25T06:00:00+08:00`
2. 或者在数据库连接中配置时区：
   ```bash
   DATABASE_URL="mysql://...?timezone=Asia/Shanghai"
   ```

### 问题 4：修改后不生效

**原因：** 缓存未过期

**解决：**
1. 等待 10 分钟
2. 或在代码中清除缓存（开发环境）：
   ```typescript
   import { cache, CACHE_KEYS } from '@/lib/cache';
   cache.delete(CACHE_KEYS.DICTIONARY_ITEMS);
   ```

## 相关代码文件

- `components/WeddingCountdown.tsx` - 倒计时组件
- `features/dictionary/index.ts` - 字典服务入口
- `lib/services/dictionary.ts` - 字典客户端服务
- `lib/repositories/dictionary.repository.ts` - 字典数据仓储
- `app/api/admin/settings/dictionary/key/[key]/route.ts` - 获取字典值 API
- `prisma/seed.ts` - 数据库初始化脚本

## 扩展功能

如果需要支持更多婚礼相关的时间配置，可以添加：

```typescript
// 结束时间
{
  key: 'endDate',
  displayName: '结束日期',
  valueType: 'NUMBER',
  category: 'WEDDING',
  value: (new Date('2025-10-25 22:00')).valueOf() + '',
  isSystem: true,
  isEnabled: true,
}

// 签到开始时间
{
  key: 'checkInStartTime',
  displayName: '签到开始时间',
  valueType: 'NUMBER',
  category: 'WEDDING',
  value: (new Date('2025-10-25 05:30')).valueOf() + '',
  isSystem: true,
  isEnabled: true,
}
```

## 总结

- ✅ 支持时间戳和日期字符串两种格式
- ✅ 自动容错，配置错误时使用默认值
- ✅ 通过管理后台灵活配置
- ✅ 有完善的初始化和种子数据
- ✅ 10 分钟缓存提升性能

如有问题，请查看浏览器控制台日志或联系开发人员。

