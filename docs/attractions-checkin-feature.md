# 景点打卡功能实现说明

## 概述

本次更新实现了景点数据从数据字典迁移到独立数据库表，并添加了用户景点打卡功能。

## 数据库设计

### 1. Attraction 表（景点表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 景点唯一标识符 |
| name | String | 景点名称 |
| description | String | 景点描述 |
| type | AttractionType | 景点类型（SCENIC/FOOD/SHOPPING/OTHER） |
| longitude | Float | 经度（GCJ02坐标系） |
| latitude | Float | 纬度（GCJ02坐标系） |
| unlockDistance | Int | 解锁距离（米，默认100） |
| media | String | 媒体资源（JSON格式） |
| rewardCoins | Int | 打卡奖励金币数（默认10） |
| isActive | Boolean | 是否启用 |
| sortOrder | Int | 排序权重 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |
| createdBy | String | 创建者ID |
| updatedBy | String | 更新者ID |

**索引**:
- type, isActive, sortOrder, longitude, latitude

### 2. UserAttractionCheckIn 表（用户景点打卡记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 记录唯一标识符 |
| userId | String | 用户ID |
| attractionId | String | 景点ID |
| checkedInAt | DateTime | 打卡时间 |
| distance | Float | 打卡时的距离（米） |
| coinsEarned | Int | 本次打卡获得的金币数 |
| longitude | Float | 打卡时的用户经度 |
| latitude | Float | 打卡时的用户纬度 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**唯一约束**: `userId` + `attractionId` (防止重复打卡)

**索引**:
- userId, attractionId, checkedInAt

## API 接口

### 1. 打卡景点

**请求**
```
POST /api/attractions/:id/check-in
```

**请求体**
```json
{
  "distance": 50,      // 可选，打卡时的距离（米）
  "longitude": 114.11, // 可选，用户经度
  "latitude": 22.54    // 可选，用户纬度
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "success": true,
    "coinsEarned": 10,
    "newBalance": 110,
    "checkedInAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**错误响应**
- 404: 景点不存在
- 400: 景点未开放/已打卡过/距离太远
- 403: 未登录

### 2. 获取打卡状态

**请求**
```
GET /api/attractions/:id/check-in-status
```

**响应**
```json
{
  "success": true,
  "data": {
    "hasCheckedIn": true,
    "checkInData": {
      "checkedInAt": "2024-01-01T12:00:00.000Z",
      "coinsEarned": 10,
      "distance": 50
    }
  }
}
```

## 前端实现

### AttractionCard 组件更新

新增打卡功能UI:

1. **未打卡状态**
   - 用户在解锁范围内: 显示绿色"立即打卡"按钮
   - 用户在解锁范围外: 显示灰色"靠近后可打卡"按钮（禁用）

2. **已打卡状态**
   - 显示绿色卡片，包含打卡时间和获得的金币数

3. **打卡中状态**
   - 按钮显示加载动画

### 打卡流程

1. 用户进入景点详情页
2. 系统自动获取打卡状态
3. 如果用户未打卡且在解锁范围内，显示打卡按钮
4. 点击打卡按钮
5. 验证距离和状态
6. 调用打卡API
7. 成功后：
   - 更新用户金币余额
   - 创建金币交易记录
   - 显示成功提示
   - 更新UI为已打卡状态

## 数据迁移

### 从字典迁移到数据库表

执行迁移脚本:

```bash
npx tsx scripts/migrate-attractions-from-dictionary.ts
```

**迁移内容**:
- 从 `attractions_list` 字典项读取景点数据
- 转换数据格式（特别是景点类型枚举）
- 写入到 `attractions` 表
- 跳过已存在的景点

**注意事项**:
- 迁移前请备份数据库
- 脚本会自动跳过已存在的景点
- 检查迁移结果统计信息

## 金币奖励机制

### 打卡奖励

1. **奖励金额**: 
   - 由景点的 `rewardCoins` 字段决定（默认10金币）
   - 创建景点时可自定义，范围：1-1000金币
   - 建议根据景点重要程度设置不同奖励
2. **发放方式**: 
   - 更新用户 `coins` 余额
   - 更新用户 `totalCoinsEarned` 累计获得金币
   - 创建 `CoinTransaction` 交易记录
3. **防重复**: 通过数据库唯一约束防止重复打卡

### 金币交易记录

打卡成功后会创建交易记录:
```typescript
{
  type: TransactionType.EARN,
  amount: rewardCoins,
  description: `打卡景点「${attraction.name}」获得奖励`,
  businessType: "ATTRACTION_CHECK_IN",
  relatedBusinessId: attractionId
}
```

## 类型定义更新

### AttractionType 枚举

从小写改为大写，与 Prisma 保持一致:

**旧版本**:
```typescript
export enum AttractionType {
  SCENIC = "scenic",
  FOOD = "food",
  SHOPPING = "shopping",
  OTHER = "other",
}
```

**新版本**:
```typescript
export enum AttractionType {
  SCENIC = "SCENIC",
  FOOD = "FOOD",
  SHOPPING = "SHOPPING",
  OTHER = "OTHER",
}
```

## 文件变更清单

### 新增文件
1. `/app/api/attractions/[id]/check-in/route.ts` - 打卡API
2. `/app/api/attractions/[id]/check-in-status/route.ts` - 打卡状态API
3. `/scripts/migrate-attractions-from-dictionary.ts` - 数据迁移脚本
4. `/docs/attractions-checkin-feature.md` - 本文档

### 修改文件
1. `/prisma/schema.prisma` - 添加 Attraction 和 UserAttractionCheckIn 模型
2. `/lib/repositories/attractions.repository.ts` - 完全重构，使用 Prisma
3. `/lib/services/attractions.service.ts` - 新增打卡相关方法
4. `/app/api/attractions/route.ts` - 更新创建景点逻辑
5. `/components/AttractionCard.tsx` - 新增打卡UI和逻辑
6. `/components/AttractionForm.tsx` - 移除 key 字段，添加 rewardCoins
7. `/components/MapExplorer.tsx` - 更新类型配置，移除示例数据

### 数据库迁移
- `/prisma/migrations/20251011031310_add_attractions_and_check_ins/migration.sql`

## 测试建议

### 功能测试
1. ✅ 创建新景点
2. ✅ 查看景点列表
3. ✅ 景点详情展示
4. ✅ 距离计算和解锁状态
5. ✅ 打卡功能（首次打卡）
6. ✅ 防止重复打卡
7. ✅ 金币奖励发放
8. ✅ 打卡状态显示
9. ✅ 未登录用户处理

### 边界条件测试
1. ⚠️ 距离超出解锁范围
2. ⚠️ 景点被禁用
3. ⚠️ 网络异常处理
4. ⚠️ 并发打卡请求

## 后续优化建议

1. **性能优化**
   - 添加打卡状态缓存
   - 批量查询打卡状态

2. **功能扩展**
   - 打卡排行榜
   - 打卡成就系统
   - 打卡分享功能
   - 景点评论功能

3. **数据分析**
   - 景点热度统计
   - 用户打卡行为分析
   - 金币消耗分析

4. **用户体验**
   - 打卡成功动画效果
   - 金币获得动画
   - 打卡地图可视化

## 常见问题

### Q: 如何调整打卡距离限制？
A: 修改景点的 `unlockDistance` 字段，单位为米。

### Q: 如何修改打卡奖励金币数？
A: 修改景点的 `rewardCoins` 字段。

### Q: 用户能重复打卡吗？
A: 不能。数据库层面通过唯一约束 `userId + attractionId` 防止重复打卡。

### Q: 如何查看某个景点的所有打卡记录？
A: 使用 Prisma 查询:
```typescript
await db.userAttractionCheckIn.findMany({
  where: { attractionId: 'xxx' },
  include: { user: true }
})
```

### Q: 旧的字典数据会被删除吗？
A: 不会。迁移脚本只是读取字典数据并写入新表，不会删除原数据。建议迁移完成并验证无误后再手动清理。

## 相关文档

- [Prisma Schema 文档](https://www.prisma.io/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [高德地图 API](https://lbs.amap.com/)

