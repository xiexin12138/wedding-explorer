# CloudBase 连接超时问题修复

## 问题描述

**时间**：2025-10-11

**环境**：生产环境

**错误日志**：
```
根据 key 获取字典项失败: Error: connect timeout
    at ClientRequest.<anonymous> (.next/server/chunks/7884.js:10:34494) {
  code: 'ETIMEDOUT',
  reusedSocket: false,
  hasConnected: false,
  connecting: true,
  url: 'https:://wedding-explore-4gkggo4uf14cbb6a.tcb-api.tencentcloudapi.com/admin?env=wedding-explore-4gkggo4uf14cbb6a&seqId=199d16e1cdb_37'
}

获取排行榜失败: Error: 获取字典项失败
获取排行榜失败: Error: 获取排行榜失败
```

## 问题分析

### 错误原因

在生产环境中，调用 CloudBase 数据库查询字典项时发生连接超时（ETIMEDOUT）。

### 调用链

1. `/api/leaderboard/route.ts` → `userService.getCoinLeaderboard()`
2. `user.service.ts:417` → `getDictionaryItemByKey('LEADERBOARD_MIN_COIN_THRESHOLD')`
3. `dictionary.repository.ts:111` → CloudBase 查询
4. CloudBase SDK 连接超时

### 问题影响

1. **排行榜 API 失败**：导致用户无法查看游戏币排行榜
2. **兑换项目 API 失败**：可能影响礼物兑换和拍卖功能
3. **级联错误**：单点的 CloudBase 连接问题导致整个 API 不可用

## 解决方案

### 方案概述

采用**降级策略**：当 CloudBase 连接失败时，使用默认值而不是抛出异常，确保主要功能可用。

### 修改内容

#### 1. 在 `dictionary.repository.ts` 中添加超时控制

**文件**：`lib/repositories/dictionary.repository.ts`

**修改**：
- 添加 10 秒超时控制
- 捕获连接超时错误，返回 null 而不是抛出异常
- 记录警告日志供后续排查

```typescript
export async function getDictionaryItemByKey(key: string): Promise<DictionaryItem | null> {
  try {
    // 添加超时控制（10秒）
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('CloudBase 查询超时')), 10000);
    });

    const queryPromise = collection.where({ key }).get();
    const result = await Promise.race([queryPromise, timeoutPromise]);

    if (!result.data || result.data.length === 0) {
      return null;
    }

    return result.data[0] as DictionaryItem;
  } catch (error) {
    console.error('根据 key 获取字典项失败:', error);
    // 连接超时或网络错误时返回 null，不要抛出异常
    if (error instanceof Error && 
        (error.message.includes('timeout') || 
         error.message.includes('ETIMEDOUT') ||
         error.message.includes('connect'))) {
      console.warn(`CloudBase 连接超时，key: ${key}，将使用默认值`);
      return null;
    }
    throw new Error('获取字典项失败');
  }
}
```

#### 2. 在 `user.service.ts` 中添加降级逻辑

**文件**：`lib/services/user.service.ts`

**修改**：在 `getCoinLeaderboard()` 函数中添加 try-catch，当获取字典项失败时使用默认值 0

```typescript
export async function getCoinLeaderboard(params: {
  limit?: number;
  offset?: number;
}): Promise<{...}> {
  try {
    const { limit = 10, offset = 0 } = params;

    // 从数据字典获取最低上榜门槛，如果失败则使用默认值
    let minCoins = 0;
    try {
      const minCoinsThresholdItem = await getDictionaryItemByKey(
        'LEADERBOARD_MIN_COIN_THRESHOLD'
      );
      minCoins = minCoinsThresholdItem?.value
        ? parseInt(minCoinsThresholdItem.value, 10) + 1
        : 0;
    } catch (error) {
      console.warn('获取排行榜门槛配置失败，使用默认值 0:', error);
      // 使用默认值，不影响主流程
      minCoins = 0;
    }

    // ... 继续执行排行榜查询
  }
}
```

#### 3. 在 `exchange-rate/route.ts` 中添加容错

**文件**：`app/api/exchange-rate/route.ts`

**修改**：当获取兑换项目字典失败时，返回空数组而不是抛出错误

```typescript
// 获取字典项，增加容错处理
let items = [];
try {
  const setting = await getDictionaryItemByKey(settingKey);
  
  if (setting && setting.value) {
    items = JSON.parse(setting.value);
  }
} catch (error) {
  console.warn("获取字典项失败，返回空列表:", error);
  // CloudBase 连接失败时返回空数组，不影响页面显示
  items = [];
}
```

## 效果

### 降级行为

1. **排行榜 API**：
   - 正常：使用配置的最低上榜门槛
   - 降级：使用默认值 0，显示所有用户

2. **兑换项目 API**：
   - 正常：返回配置的兑换项目列表
   - 降级：返回空数组，页面显示"暂无兑换项目"

3. **用户体验**：
   - 主要功能（排行榜查询、页面显示）仍然可用
   - 不会因为配置服务不可用而导致整个功能崩溃

### 监控点

在日志中会记录以下警告信息，便于排查根本原因：
- `CloudBase 连接超时，key: xxx，将使用默认值`
- `获取排行榜门槛配置失败，使用默认值 0`
- `获取字典项失败，返回空列表`

## 根本原因排查

### 可能的原因

1. **CloudBase 环境变量配置**
   - 检查 `CLOUDBASE_ENV_ID`、`CLOUDBASE_SECRET_ID`、`CLOUDBASE_SECRET_KEY` 是否正确
   - 确认生产环境的环境变量已正确设置

2. **CloudBase 服务状态**
   - 检查腾讯云 CloudBase 服务是否正常
   - 确认环境 ID 是否正确
   - 验证 API 密钥权限是否有效

3. **网络配置**
   - 检查服务器到 CloudBase 的网络连接
   - 确认防火墙规则是否阻止了出站连接
   - 验证 DNS 解析是否正常

4. **超时配置**
   - CloudBase SDK 默认超时可能过短
   - 考虑增加全局超时配置

### 建议操作

1. **检查环境变量**：
```bash
# 在生产服务器上检查
echo $CLOUDBASE_ENV_ID
echo $CLOUDBASE_SECRET_ID
```

2. **测试 CloudBase 连接**：
```typescript
// 在 /app/api/health/cloudbase/route.ts 创建健康检查端点
import { checkCloudBaseConnection } from '@/lib/cloudbase';

export async function GET() {
  const isConnected = await checkCloudBaseConnection();
  return NextResponse.json({ 
    status: isConnected ? 'healthy' : 'unhealthy',
    service: 'cloudbase'
  });
}
```

3. **查看腾讯云控制台**：
   - 登录腾讯云 CloudBase 控制台
   - 检查服务状态和日志
   - 验证 API 调用统计

## 相关文件

- `lib/repositories/dictionary.repository.ts` - 字典仓储层
- `lib/services/user.service.ts` - 用户服务层
- `app/api/exchange-rate/route.ts` - 兑换项目 API
- `app/api/leaderboard/route.ts` - 排行榜 API
- `lib/cloudbase.ts` - CloudBase 配置

## 参考资料

- [CloudBase Node.js SDK 文档](https://docs.cloudbase.net/api-reference/server/node-sdk/introduction)
- [Next.js 错误处理最佳实践](https://nextjs.org/docs/app/building-your-application/routing/error-handling)

