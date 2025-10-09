# 游戏币系统快速开始指南

## 5分钟快速上手

### 1. 数据库已就绪 ✅

数据库表已经创建完成，包括：
- `users` - 用户表
- `prize_exchange_records` - 兑奖记录表
- `coin_transactions` - 游戏币流水表

### 2. 初始化测试数据（可选）

```bash
# 在项目根目录运行
npx ts-node prisma/seeds/user-coin-seed.ts
```

这会创建：
- 4 个测试用户（3个普通用户 + 1个管理员）
- 若干游戏币流水记录
- 2 条兑奖记录示例

### 3. 测试 API

#### 获取用户资料
```bash
curl "http://localhost:3000/api/user/profile?userId=<用户ID>"
```

#### 获取排行榜
```bash
curl "http://localhost:3000/api/leaderboard?page=1&pageSize=10"
```

#### 获取全局统计
```bash
curl "http://localhost:3000/api/stats/global"
```

#### 兑换奖品
```bash
curl -X POST "http://localhost:3000/api/prize/exchange" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<用户ID>",
    "prizeName": "测试奖品",
    "coinsRequired": 100,
    "remarks": "测试兑换"
  }'
```

### 4. 在代码中使用

#### 示例 1: 用户完成任务获得游戏币

```typescript
import * as userService from '@/lib/services/user.service';

// 在你的任务完成逻辑中
async function onTaskComplete(userId: string, taskName: string) {
  const result = await userService.addCoins({
    userId,
    amount: 50,
    description: `完成任务：${taskName}`,
    type: 'EARN',
    businessType: 'TASK',
    relatedBusinessId: 'task_xxx',
  });
  
  console.log(`用户当前余额：${result.user.coins}`);
  return result;
}
```

#### 示例 2: 用户兑换奖品

```typescript
import * as prizeService from '@/lib/services/prize-exchange.service';

async function exchangePrize(userId: string, prizeId: string) {
  try {
    const exchange = await prizeService.exchangePrize({
      userId,
      prizeName: '精美礼品',
      prizeDesc: '限量版纪念品',
      coinsRequired: 500,
      remarks: '用户备注信息',
    });
    
    return { success: true, orderId: exchange.id };
  } catch (error) {
    if (error.message.includes('余额不足')) {
      return { success: false, error: '游戏币不足' };
    }
    throw error;
  }
}
```

#### 示例 3: 显示排行榜

```typescript
import * as userService from '@/lib/services/user.service';

async function showLeaderboard() {
  const { leaderboard, total } = await userService.getCoinLeaderboard({
    page: 1,
    pageSize: 10,
  });
  
  return leaderboard.map((user, index) => ({
    rank: index + 1,
    nickname: user.nickname,
    avatar: user.avatar,
    totalCoins: user.totalCoinsEarned,
  }));
}
```

#### 示例 4: 管理员处理兑奖

```typescript
import * as prizeService from '@/lib/services/prize-exchange.service';

async function processExchange(exchangeId: string, adminId: string) {
  // 完成兑奖
  await prizeService.updateExchangeStatus({
    exchangeId,
    status: 'COMPLETED',
    operatorId: adminId,
    remarks: '已发货，快递单号：SF1234567890',
  });
  
  // 或者拒绝兑奖（会自动退回游戏币）
  await prizeService.updateExchangeStatus({
    exchangeId,
    status: 'REJECTED',
    operatorId: adminId,
    remarks: '奖品库存不足',
  });
}
```

### 5. 前端集成示例

#### React Hook 示例

```typescript
// hooks/useUserCoins.ts
import { useState, useEffect } from 'react';

export function useUserCoins(userId: string) {
  const [coins, setCoins] = useState(0);
  const [rank, setRank] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const res = await fetch(`/api/user/profile?userId=${userId}`);
        const data = await res.json();
        
        if (data.success) {
          setCoins(data.data.user.coins);
          setRank(data.data.rank);
        }
      } catch (error) {
        console.error('获取用户信息失败', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [userId]);

  return { coins, rank, loading };
}
```

#### 使用示例

```typescript
// 在你的组件中
function UserCoinDisplay({ userId }) {
  const { coins, rank, loading } = useUserCoins(userId);

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <p>游戏币余额：{coins}</p>
      <p>当前排名：第 {rank} 名</p>
    </div>
  );
}
```

### 6. 常见问题

#### Q: 如何给新注册用户发放初始游戏币？

```typescript
import * as userService from '@/lib/services/user.service';

// 在用户注册成功后
const user = await userService.loginOrRegister({
  openId: 'wx_xxx',
  nickname: '新用户',
});

// 发放新手奖励
await userService.addCoins({
  userId: user.id,
  amount: 100,
  description: '新用户注册奖励',
  type: 'EARN',
  businessType: 'REGISTER',
});
```

#### Q: 如何防止用户重复领取奖励？

```typescript
import * as coinTransactionRepo from '@/lib/repositories/coin-transaction.repository';

async function claimDailyReward(userId: string) {
  // 检查今天是否已经领取
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTransactions = await coinTransactionRepo.getUserBusinessTransactions(
    userId,
    'DAILY_SIGN_IN',
    today.toISOString()
  );
  
  if (todayTransactions.length > 0) {
    throw new Error('今天已经签到过了');
  }
  
  // 发放奖励
  return await userService.addCoins({
    userId,
    amount: 10,
    description: '每日签到奖励',
    type: 'EARN',
    businessType: 'DAILY_SIGN_IN',
    relatedBusinessId: today.toISOString(),
  });
}
```

#### Q: 如何实现游戏币消费（非兑奖场景）？

```typescript
import * as userService from '@/lib/services/user.service';

async function buyVirtualItem(userId: string, itemName: string, price: number) {
  try {
    const result = await userService.deductCoins({
      userId,
      amount: price,
      description: `购买：${itemName}`,
      type: 'SPEND',
      businessType: 'VIRTUAL_ITEM',
      relatedBusinessId: 'item_xxx',
    });
    
    return { success: true, balance: result.user.coins };
  } catch (error) {
    if (error.message.includes('余额不足')) {
      return { success: false, error: '游戏币不足' };
    }
    throw error;
  }
}
```

### 7. 下一步

- 📖 查看完整文档：[docs/user-coin-system.md](./user-coin-system.md)
- 📋 查看实现总结：[docs/user-coin-system-summary.md](./user-coin-system-summary.md)
- 🔍 查看数据库 Schema：[prisma/schema.prisma](../prisma/schema.prisma)

### 8. 需要帮助？

如果遇到问题，请检查：

1. ✅ 数据库连接是否正常
2. ✅ Prisma Client 是否已生成（`npx prisma generate`）
3. ✅ 数据库表是否已创建（`npx prisma db push`）
4. ✅ 环境变量是否配置正确

---

**祝你使用愉快！** 🎉

