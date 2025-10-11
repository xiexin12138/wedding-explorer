# 游戏币收支明细功能实现文档

## 概述
为用户提供完整的游戏币收支记录查看功能，帮助用户追踪游戏币的每一笔变动。

## 实现时间
2025年10月11日

## 功能特性

### 1. 游戏币明细页面 (`/coin-history`)

**位置**: `app/(needHeader)/(user)/coin-history/page.tsx`

**功能包括**:
- ✅ 顶部统计卡片
  - 累计收入（绿色主题）
  - 累计支出（红色主题）
  - 当前余额（黄色主题）

- ✅ 交易记录列表
  - 时间倒序显示所有交易
  - 显示交易类型（获得/消费/管理员操作等）
  - 显示交易金额（正数显示绿色，负数显示红色）
  - 显示交易描述（如"打卡景点XXX获得奖励"）
  - 显示交易后余额
  - 智能时间显示（今天、昨天、X天前、具体日期）

- ✅ 筛选功能
  - 全部记录
  - 只看收入
  - 只看支出

- ✅ 分页加载
  - 每页20条记录
  - "加载更多"按钮
  - 自动判断是否还有更多数据

- ✅ 空状态处理
  - 无记录时显示友好的空状态提示
  - 根据不同筛选条件显示不同的提示文案

### 2. 访问入口

#### 主入口：Header游戏币弹窗
**位置**: `components/Header.tsx:439-449`

点击Header右上角的二维码按钮打开游戏币弹窗后，在弹窗底部会显示"查看收支明细"按钮。

**优势**:
- 用户自然的使用流程：查看余额 → 了解明细
- 弹窗中直接跳转，减少操作步骤
- 移动端友好

#### 次入口：用户下拉菜单
**位置**: `components/Header.tsx:297-300`

点击Header右上角的用户头像，在下拉菜单中可以看到"我的游戏币明细"选项（位于"游戏币排行榜"和"退出登录"之间）。

**优势**:
- 便于老用户快速访问
- 与其他游戏币相关功能（排行榜）归类在一起

### 3. 路由配置

**位置**: `lib/routes.config.ts`

- 添加到受保护路由列表 (`PROTECTED_ROUTES`)
- 添加到特殊路由配置 (`SPECIAL_ROUTES.COIN_HISTORY`)
- 需要用户登录才能访问

### 4. 后端服务优化

**位置**: `lib/services/user.service.ts:469-501`

优化了 `getUserTransactions` 方法，现在返回包含分页信息的完整响应：
```typescript
{
  transactions: CoinTransaction[],  // 交易记录列表
  total: number,                     // 总记录数
  page: number,                      // 当前页码
  pageSize: number,                  // 每页大小
  totalPages: number                 // 总页数
}
```

## 交易类型说明

| 类型 | 中文名称 | 颜色主题 | 说明 |
|------|---------|---------|------|
| `EARN` | 获得 | 绿色 | 通过打卡、任务等获得游戏币 |
| `SPEND` | 消费 | 红色 | 兑换礼品等消费游戏币 |
| `ADMIN_ADD` | 管理员增加 | 蓝色 | 管理员手动增加游戏币 |
| `ADMIN_SUB` | 管理员扣除 | 橙色 | 管理员手动扣除游戏币 |
| `REFUND` | 退款 | 紫色 | 退款返还游戏币 |
| `SYSTEM` | 系统 | 灰色 | 系统自动调整 |

## 技术实现

### 前端技术栈
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI 组件库
- Lucide React 图标库

### 数据流
1. 用户访问 `/coin-history` 页面
2. 前端从 `UserProvider` 获取当前登录用户信息
3. 调用 `/api/user/transactions` API 获取流水记录
4. 使用 `getUserTransactions` 服务方法从数据库查询
5. `CoinTransaction` 模型包含完整的交易信息
6. 前端渲染列表，支持筛选和分页

### 数据库表
使用 `coin_transactions` 表（对应 Prisma 的 `CoinTransaction` 模型），包含以下关键字段：
- `userId`: 用户ID
- `type`: 交易类型
- `amount`: 变动金额（正数为增加，负数为减少）
- `balanceBefore`: 变动前余额
- `balanceAfter`: 变动后余额
- `description`: 交易描述
- `relatedBusinessId`: 关联业务ID
- `businessType`: 业务类型
- `createdAt`: 创建时间

## 移动端适配

- 响应式布局，适配手机、平板和桌面
- 统计卡片在移动端单列显示，桌面端三列显示
- 交易记录卡片适配小屏幕
- 触摸友好的按钮和交互

## 未来优化建议

1. **高级筛选**
   - 按日期范围筛选
   - 按业务类型筛选（打卡、兑换、管理员操作等）

2. **导出功能**
   - 导出为 CSV 或 Excel
   - 生成月度/年度报表

3. **统计图表**
   - 收入/支出趋势图
   - 类型分布饼图

4. **搜索功能**
   - 按描述关键词搜索
   - 快速定位特定交易

5. **性能优化**
   - 虚拟滚动优化大量数据渲染
   - 实现无限滚动替代分页按钮

## 相关文件

### 新建文件
- `app/(needHeader)/(user)/coin-history/page.tsx` - 游戏币明细页面

### 修改文件
- `components/Header.tsx` - 添加入口按钮和菜单项
- `lib/routes.config.ts` - 更新路由配置
- `lib/services/user.service.ts` - 优化返回数据结构

### 依赖的现有文件
- `app/api/user/transactions/route.ts` - 流水记录 API
- `lib/repositories/coin-transaction.repository.ts` - 数据访问层
- `prisma/schema.prisma` - 数据库模型定义

## 测试建议

1. **功能测试**
   - 查看各类型交易记录是否正确显示
   - 筛选功能是否正常工作
   - 分页加载是否正常
   - 统计数据是否准确

2. **UI测试**
   - 不同屏幕尺寸下的显示效果
   - 空状态显示是否友好
   - 加载状态是否清晰

3. **性能测试**
   - 大量数据下的加载速度
   - 滚动流畅度

4. **安全测试**
   - 验证只能查看自己的交易记录
   - 未登录用户无法访问

