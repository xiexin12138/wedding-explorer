# 用户游戏币系统使用文档

## 概述

本系统实现了完整的用户游戏币管理和兑奖功能，包括：

- 用户信息管理（支持微信登录）
- 游戏币余额管理
- 游戏币流水记录
- 兑奖功能
- 排行榜功能
- 全局统计功能

## 数据库表结构

### 1. 用户表 (users)

存储用户基本信息和游戏币数据：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 用户唯一标识符 |
| openId | String | 微信 OpenID |
| unionId | String | 微信 UnionID |
| nickname | String | 用户昵称 |
| avatar | String | 用户头像 |
| coins | Int | 当前游戏币余额 |
| totalCoinsEarned | Int | 累计获得游戏币总数（用于排行榜） |
| totalCoinsSpent | Int | 累计消费游戏币总数 |
| role | UserRole | 用户角色 |
| isActive | Boolean | 是否活跃 |

### 2. 兑奖记录表 (prize_exchange_records)

存储所有兑奖记录：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 记录唯一标识符 |
| userId | String | 用户ID |
| prizeName | String | 奖品名称 |
| prizeDesc | String | 奖品描述 |
| coinsSpent | Int | 消耗游戏币数量 |
| userCoinsSnapshot | Int | 兑换时用户余额快照 |
| status | ExchangeStatus | 兑换状态 |
| remarks | String | 备注信息 |
| exchangedAt | DateTime | 兑换时间 |
| processedAt | DateTime | 处理时间 |

### 3. 游戏币流水表 (coin_transactions)

记录所有游戏币变动：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 记录唯一标识符 |
| userId | String | 用户ID |
| type | TransactionType | 变动类型 |
| amount | Int | 变动金额（正数增加，负数减少） |
| balanceBefore | Int | 变动前余额 |
| balanceAfter | Int | 变动后余额 |
| description | String | 变动描述 |
| businessType | String | 业务类型 |
| relatedExchangeId | String | 关联的兑奖记录ID |

## 使用示例

### 用户登录/注册

```typescript
import * as userService from '@/lib/services/user.service';

// 微信登录场景
const user = await userService.loginOrRegister({
  openId: 'wx_openid_xxx',
  unionId: 'wx_unionid_xxx',
  nickname: '张三',
  avatar: 'https://...',
});
```

### 获取用户信息（含排名）

```typescript
import * as userService from '@/lib/services/user.service';

const { user, rank } = await userService.getUserProfile(userId);
console.log(`用户当前排名：第 ${rank} 名`);
console.log(`游戏币余额：${user.coins}`);
```

### 增加用户游戏币

```typescript
import * as userService from '@/lib/services/user.service';

// 完成任务奖励游戏币
const result = await userService.addCoins({
  userId: 'user_id',
  amount: 100,
  description: '完成每日签到任务',
  type: 'EARN',
  businessType: 'DAILY_SIGN_IN',
  relatedBusinessId: 'sign_in_2024_01_01',
});

console.log(`当前余额：${result.user.coins}`);
```

### 兑换奖品

```typescript
import * as prizeService from '@/lib/services/prize-exchange.service';

try {
  const exchange = await prizeService.exchangePrize({
    userId: 'user_id',
    prizeName: '精美礼品A',
    prizeDesc: '限量版纪念品',
    coinsRequired: 500,
    remarks: '收货地址：xxx',
  });
  
  console.log('兑换成功！订单号：', exchange.id);
} catch (error) {
  console.error('兑换失败：', error.message);
  // 可能的错误：游戏币余额不足
}
```

### 管理员处理兑奖

```typescript
import * as prizeService from '@/lib/services/prize-exchange.service';

// 完成兑奖
await prizeService.updateExchangeStatus({
  exchangeId: 'exchange_id',
  status: 'COMPLETED',
  operatorId: 'admin_id',
  remarks: '已发货，快递单号：xxx',
});

// 拒绝兑奖（会退回游戏币）
await prizeService.updateExchangeStatus({
  exchangeId: 'exchange_id',
  status: 'REJECTED',
  operatorId: 'admin_id',
  remarks: '奖品库存不足',
});
```

### 获取游戏币排行榜

```typescript
import * as userService from '@/lib/services/user.service';

const { leaderboard, total } = await userService.getCoinLeaderboard({
  page: 1,
  pageSize: 10,
});

leaderboard.forEach((user, index) => {
  console.log(`第${index + 1}名：${user.nickname}，游戏币：${user.totalCoinsEarned}`);
});
```

### 获取全局统计

```typescript
import * as userService from '@/lib/services/user.service';

const stats = await userService.getGlobalStats();

console.log('全局统计：');
console.log('总用户数：', stats.totalUsers);
console.log('流通中游戏币：', stats.totalCoins);
console.log('累计发放游戏币：', stats.totalCoinsEarned);
console.log('累计消费游戏币：', stats.totalCoinsSpent);
console.log('人均游戏币：', stats.averageCoins);
```

### 查询用户的游戏币流水

```typescript
import * as userService from '@/lib/services/user.service';

const { transactions, total } = await userService.getUserTransactions({
  userId: 'user_id',
  page: 1,
  pageSize: 20,
  type: 'EARN', // 可选：只查询获得的记录
});

transactions.forEach(tx => {
  console.log(`${tx.createdAt}: ${tx.description}, ${tx.amount > 0 ? '+' : ''}${tx.amount}`);
});
```

### 查询用户的兑奖记录

```typescript
import * as prizeService from '@/lib/services/prize-exchange.service';

const { records, total } = await prizeService.getUserExchanges({
  userId: 'user_id',
  page: 1,
  pageSize: 20,
  status: 'COMPLETED', // 可选：只查询已完成的记录
});
```

### 管理员调整用户游戏币

```typescript
import * as userService from '@/lib/services/user.service';

// 增加游戏币
await userService.adminAdjustCoins({
  userId: 'user_id',
  amount: 100, // 正数表示增加
  description: '补偿发放',
  operatorId: 'admin_id',
});

// 扣除游戏币
await userService.adminAdjustCoins({
  userId: 'user_id',
  amount: -50, // 负数表示扣除
  description: '违规处罚',
  operatorId: 'admin_id',
});
```

## API 路由建议

### 用户相关

- `GET /api/user/profile` - 获取当前用户信息（含排名）
- `GET /api/user/transactions` - 获取游戏币流水
- `GET /api/user/exchanges` - 获取兑奖记录

### 排行榜相关

- `GET /api/leaderboard` - 获取游戏币排行榜
- `GET /api/stats/global` - 获取全局统计

### 兑奖相关

- `POST /api/prize/exchange` - 兑换奖品
- `GET /api/prize/list` - 获取可兑换奖品列表（需要另外创建奖品表）
- `GET /api/prize/my-exchanges` - 获取我的兑奖记录

### 管理员相关

- `POST /api/admin/user/adjust-coins` - 调整用户游戏币
- `GET /api/admin/exchanges` - 获取所有兑奖记录
- `PUT /api/admin/exchange/:id/status` - 更新兑奖状态
- `GET /api/admin/stats/exchanges` - 获取兑奖统计

## 业务逻辑说明

### 事务保证

所有涉及游戏币变动的操作都使用数据库事务，确保：
1. 游戏币扣除和流水记录同步创建
2. 兑奖记录和游戏币扣除原子操作
3. 取消/拒绝兑奖时正确退回游戏币

### 余额快照

兑奖时会保存用户当前余额快照 (`userCoinsSnapshot`)，便于后续追溯。

### 流水记录

每次游戏币变动都会自动创建流水记录，包含：
- 变动前后余额
- 变动类型和金额
- 业务描述和关联ID

### 排行榜计算

排行榜使用 `totalCoinsEarned`（累计获得）而不是 `coins`（当前余额），避免用户通过消费降低排名。

### 全局统计

提供全局游戏币统计，管理员可据此：
- 调控奖品价格
- 控制游戏币发放速度
- 分析用户参与度

## 注意事项

1. **游戏币不能为负数**：扣除操作会检查余额是否足够
2. **兑奖状态流转**：只有待处理和处理中的订单可以取消/拒绝
3. **取消/拒绝会退款**：取消或拒绝兑奖会自动退回游戏币并创建退款流水
4. **流水不可删除**：保证数据完整性和可追溯性
5. **用户软删除**：删除用户只是设置 `isActive = false`，不物理删除

## 扩展建议

### 1. 奖品管理

创建奖品表 (prizes)，包含：
- 奖品名称、描述、图片
- 所需游戏币
- 库存数量
- 上架/下架状态

### 2. 任务系统

创建任务表，用户完成任务获得游戏币：
- 每日签到
- 分享活动
- 邀请好友
- 参与互动

### 3. 游戏币有效期

可以添加游戏币过期机制：
- 在 CoinTransaction 中添加 `expiresAt` 字段
- 定时任务清理过期游戏币

### 4. 兑奖通知

集成通知功能：
- 兑奖成功通知
- 处理进度通知
- 发货通知

### 5. 防刷机制

- IP 限制
- 行为分析
- 异常检测

## 相关文件

- Schema: `/prisma/schema.prisma`
- Repository: `/lib/repositories/user.repository.ts`
- Repository: `/lib/repositories/prize-exchange.repository.ts`
- Repository: `/lib/repositories/coin-transaction.repository.ts`
- Service: `/lib/services/user.service.ts`
- Service: `/lib/services/prize-exchange.service.ts`
- CloudBase: `/lib/cloudbase.ts`

