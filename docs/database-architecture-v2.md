# 数据库架构 V2 - 用户表重构说明

## 重构日期
2025-10-09

## 重构背景
之前的用户表将数据库 ID、Authing ID、微信 OpenID/UnionID 等多个外部认证 ID 都存储在同一张表中，导致：
1. 表结构臃肿，职责不清晰
2. 主键使用 cuid 字符串，性能不如自增主键
3. 外部认证系统和内部数据耦合严重
4. 扩展性差，添加新的认证方式需要修改核心表结构

## 新架构设计

### 核心表结构

#### 1. `users` - 用户核心表
- **主键**: `id` (INT, AUTO_INCREMENT) - 自增主键，性能优化
- **字段**: 只包含核心用户信息
  - 基本信息: name, nickname, email, avatar
  - 游戏币: coins, totalCoinsEarned, totalCoinsSpent  
  - 角色状态: role, isActive, lastLoginAt
  - 时间戳: createdAt, updatedAt

#### 2. `authing_users` - Authing 认证关联表
- **主键**: `id` (INT, AUTO_INCREMENT)
- **外键**: `userId` -> `users.id` (级联删除)
- **唯一索引**: `authingId` (VARCHAR 100)
- **用途**: 将 Authing 认证系统的用户 ID 映射到本系统用户 ID

#### 3. `wechat_users` - 微信认证关联表
- **主键**: `id` (INT, AUTO_INCREMENT)  
- **外键**: `userId` -> `users.id` (级联删除)
- **唯一索引**: `openId`, `unionId`
- **用途**: 将微信的 OpenID/UnionID 映射到本系统用户 ID

### ER 图关系

```
┌─────────────┐
│   users     │  (核心用户表)
│ id (PK)     │◄─┐
│ name        │  │
│ email       │  │
│ coins       │  │
│ ...         │  │
└─────────────┘  │
                 │ 1:1
         ┌───────┴────────┐
         │                │
┌────────┴──────┐  ┌──────┴────────┐
│ authing_users │  │ wechat_users  │
│ id (PK)       │  │ id (PK)       │
│ userId (FK)   │  │ userId (FK)   │
│ authingId(UQ) │  │ openId (UQ)   │
└───────────────┘  │ unionId (UQ)  │
                   └───────────────┘
```

## 优势

### 1. **解耦合**
- 核心用户数据与外部认证系统完全分离
- 更换或添加认证系统时不影响核心表结构

### 2. **可扩展性**
- 轻松添加新的认证方式（如 Google、GitHub 等）
- 只需新增对应的关联表，无需修改核心表

### 3. **性能优化**
- 自增主键 (INT) 比 cuid (VARCHAR 25) 性能更好
- 索引效率更高，JOIN 操作更快
- 主键占用空间更小（4 bytes vs 25 bytes）

### 4. **数据一致性**
- 外键约束确保数据完整性
- 级联删除自动清理关联数据

### 5. **职责单一**
- 每张表职责明确，符合数据库设计范式
- 便于维护和理解

## 数据迁移

### 迁移步骤
1. 备份原有数据到 CSV (`wedding-explorer-20251009213011.csv`)
2. 删除旧表结构
3. 创建新表结构（Prisma schema）
4. 从 CSV 导入数据，创建用户和关联记录

### 导入脚本
- `prisma/seeds/rebuild-users-from-csv.ts` - 从 CSV 重建用户数据

### 导入结果
- ✅ 成功导入 10 个用户
- ✅ 创建 10 条 Authing 关联记录
- ✅ 所有用户初始游戏币: 10

## 代码适配

### Repository 层变更
- `getUserById(id: number)` - ID 类型从 String 改为 number
- `getUserByAuthingId(authingId: string)` - 通过 `authingUser` 关联查询
- `getUserByOpenId(openId: string)` - 通过 `wechatUser` 关联查询
- 所有 userId 参数从 String 改为 number

### Service 层变更
- `loginOrRegister()` - 创建用户时同时创建认证关联记录
- 所有涉及 userId 的函数参数类型更新为 number

### API 层变更
- `/api/user/profile` - 支持通过 authingId 或数字 ID 查询用户
- JWT 中的 `authUser.sub` (authingId) 需要先查询获取数字 ID

## 示例查询

### 通过 Authing ID 查找用户
```typescript
const authingUser = await db.authingUser.findUnique({
  where: { authingId: '687deb90f1149df4959f603a' },
  include: { user: true }
});
const user = authingUser?.user;
```

### 通过微信 OpenID 查找用户
```typescript
const wechatUser = await db.wechatUser.findUnique({
  where: { openId: 'wx_xxxxx' },
  include: { user: true }
});
const user = wechatUser?.user;
```

### 创建用户和认证关联
```typescript
const user = await db.$transaction(async (tx) => {
  // 1. 创建用户
  const newUser = await tx.user.create({
    data: { name: 'John', email: 'john@example.com' }
  });
  
  // 2. 创建 Authing 关联
  await tx.authingUser.create({
    data: {
      userId: newUser.id,
      authingId: '687deb90f1149df4959f603a'
    }
  });
  
  return newUser;
});
```

## 未来扩展

### 支持更多认证方式
只需添加新的关联表即可：

```prisma
model GoogleUser {
  id          Int      @id @default(autoincrement())
  userId      Int      @unique
  googleId    String   @unique
  user        User     @relation(fields: [userId], references: [id])
  @@map("google_users")
}
```

### 多账号绑定
用户可以同时绑定多种认证方式：
- Authing 账号
- 微信账号  
- Google 账号
- 等等...

## 注意事项

1. **ID 类型**: 新系统中 User.id 是 number 类型，与 authingId (string) 不同
2. **认证流程**: 需要通过 authingId 查找用户，获取数字 ID 后再进行后续操作
3. **数据一致性**: 删除用户时会级联删除所有认证关联记录
4. **性能**: 查询用户时建议使用 `include` 预加载关联数据，避免 N+1 问题

## 总结

这次重构实现了更清晰的架构设计，提升了系统的可扩展性和性能。通过分离核心数据和认证数据，为未来支持多种认证方式打下了良好的基础。

