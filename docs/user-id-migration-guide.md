# 用户ID迁移指南：从自增整数到UUID

## 概述

为了提高系统安全性，我们将用户ID从自增整数改为UUID（使用cuid2）。这样可以防止恶意用户通过推测用户ID来进行攻击。

## 已完成的修改

### 1. 数据库Schema修改

**修改的表：**
- `users` - 主键从 `Int @id @default(autoincrement())` 改为 `String @id @default(cuid())`
- `authing_users` - 主键和userId外键都改为String类型
- `wechat_users` - 主键和userId外键都改为String类型  
- `prize_exchange_records` - userId外键改为String类型
- `coin_transactions` - userId外键改为String类型

### 2. 代码层面修改

**Repository层：**
- `lib/repositories/user.repository.ts` - 所有涉及用户ID的函数参数类型从`number`改为`string`
- `lib/repositories/prize-exchange.repository.ts` - userId参数类型更新
- `lib/repositories/coin-transaction.repository.ts` - userId参数类型更新

**Service层：**
- `lib/services/user.service.ts` - 用户ID相关接口类型更新
- `lib/services/prize-exchange.service.ts` - userId参数类型更新

**API层：**
- `app/api/user/profile/route.ts` - 移除数字ID解析逻辑，直接使用字符串ID
- `app/api/prize/my-exchanges/route.ts` - 移除数字ID验证逻辑
- `app/api/user/transactions/route.ts` - 移除数字ID验证逻辑

### 3. 迁移脚本

创建了完整的数据迁移脚本：
- `scripts/migrate-user-ids-to-uuid.ts` - 主要迁移逻辑
- `scripts/run-migration.ts` - 迁移执行脚本
- 在`package.json`中添加了`migrate:user-ids`命令

## 执行迁移

### ⚠️ 重要提醒
**在执行迁移前，请务必备份数据库！**

### 迁移步骤

1. **备份数据库**
   ```bash
   # 请根据你的数据库类型执行相应的备份命令
   ```

2. **执行迁移**
   ```bash
   npm run migrate:user-ids
   ```

3. **验证迁移结果**
   - 检查用户数量是否一致
   - 验证关联数据完整性
   - 测试主要功能

4. **重启应用**
   ```bash
   npm run build
   npm start
   ```

### 迁移脚本功能

迁移脚本会：
1. 为所有现有用户生成新的UUID
2. 创建ID映射表
3. 更新所有相关表的外键引用
4. 验证数据完整性
5. 使用数据库事务确保原子性

## 安全性改进

### 之前的问题
- 使用自增整数ID，容易被推测（如：1, 2, 3, 4...）
- 攻击者可以通过枚举ID来获取用户信息
- 存在信息泄露风险

### 改进后的优势
- UUID具有高度随机性，无法预测
- 即使知道一个用户ID，也无法推测其他用户ID
- 提高了系统整体安全性

## 兼容性说明

### API变更
- 所有接受`userId`参数的API现在期望字符串类型而非数字
- 前端代码需要相应更新，不再需要将用户ID转换为数字

### 数据库变更
- 用户ID长度从数字变为约25个字符的字符串
- 索引和查询性能基本不受影响
- 存储空间略有增加（每个用户ID约增加20字节）

## 测试建议

迁移完成后，请测试以下功能：

1. **用户认证**
   - 登录/注册流程
   - 用户信息获取

2. **游戏币系统**
   - 游戏币余额查询
   - 游戏币流水记录
   - 管理员调整游戏币

3. **兑奖系统**
   - 奖品兑换
   - 兑奖记录查询
   - 管理员处理兑奖

4. **管理后台**
   - 用户列表
   - 用户详情
   - 数据统计

## 回滚方案

如果迁移出现问题，可以：
1. 恢复数据库备份
2. 回滚代码到迁移前的版本
3. 重新部署应用

## 注意事项

1. **缓存清理**：迁移后可能需要清理相关缓存
2. **日志检查**：迁移后注意检查应用日志是否有异常
3. **性能监控**：观察迁移后的查询性能
4. **用户体验**：确保用户不会感知到任何变化

## 技术细节

### UUID生成
使用`@paralleldrive/cuid2`库生成CUID，特点：
- 长度固定（约25个字符）
- 时间戳前缀，便于排序
- 高度随机，防止冲突
- URL安全字符

### 数据库事务
迁移使用Prisma事务确保：
- 要么全部成功，要么全部回滚
- 数据一致性
- 并发安全

### 类型安全
通过TypeScript类型系统确保：
- 编译时类型检查
- IDE智能提示
- 运行时类型安全
