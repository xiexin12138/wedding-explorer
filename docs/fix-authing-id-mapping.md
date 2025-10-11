# Authing ID 映射问题修复说明

## 问题描述

用户打卡时出现错误:
```
Invalid `prisma.user.update()` invocation:
An operation failed because it depends on one or more records that were required but not found.
```

## 根本原因

系统使用 Authing 作为认证服务:
- **JWT token 的 `sub` 字段**: 是 Authing 用户ID (如: `687deb90f1149df4959f603a`)
- **数据库 `users` 表的 `id` 字段**: 是内部用户ID (如: `cmgkyg9mk0000jo8nrrz4n8na`)

两者通过 `authing_users` 关联表映射:
```
authing_users:
- authingId: 687deb90f1149df4959f603a (Authing ID)
- userId: cmgkyg9mk0000jo8nrrz4n8na (数据库用户ID)
```

之前的代码直接使用 `user.sub` (Authing ID) 去查询和更新 `users` 表,导致找不到记录。

## 解决方案

### 1. 扩展 AuthingUser 接口

在 `lib/auth.ts` 中添加 `dbUserId` 字段:

```typescript
export interface AuthingUser {
  sub: string // Authing 用户ID
  dbUserId?: string // 数据库用户ID（从 authing_users 表查询得到）
  // ... 其他字段
}
```

### 2. 修改 requireAuth 函数

自动查询并映射数据库用户ID:

```typescript
export async function requireAuth(request: NextRequest): Promise<AuthingUser> {
  const { isLoggedIn, user } = await isRequestAuthenticated(request)

  if (!isLoggedIn || !user) {
    throw new Error('未授权：需要登录')
  }

  // 从 authing_users 表查询对应的数据库用户ID
  if (!user.dbUserId) {
    const { db } = await import('@/lib/db')
    const authingUser = await db.authingUser.findUnique({
      where: { authingId: user.sub },
      select: { userId: true }
    })

    if (authingUser) {
      user.dbUserId = authingUser.userId
    }
  }

  return user
}
```

### 3. 更新打卡 API

在 `app/api/attractions/[id]/check-in/route.ts` 中:

```typescript
const user = await requireAuth(request);

// 使用数据库用户ID
const userId = user.dbUserId; 

// 所有数据库操作使用 userId 而不是 user.sub
await db.user.update({
  where: { id: userId },
  // ...
});
```

## 验证修复

重新测试打卡功能,后端日志应该显示:

```
✅ 映射 Authing ID 到数据库 ID: 687deb90f1149df4959f603a -> cmgkyg9mk0000jo8nrrz4n8na
👤 当前用户信息: {
  authingId: '687deb90f1149df4959f603a',
  dbUserId: 'cmgkyg9mk0000jo8nrrz4n8na',
  isAdmin: true
}
🔍 检查用户是否存在: cmgkyg9mk0000jo8nrrz4n8na
✅ 用户存在: Jiahim
```

## 其他需要修改的地方

任何使用 `user.sub` 直接操作数据库的地方都需要改用 `user.dbUserId`:

1. ✅ 打卡 API (`/api/attractions/[id]/check-in`)
2. ✅ 打卡状态 API (`/api/attractions/[id]/check-in-status`)
3. ⚠️ 可能还有其他 API 需要检查

## 最佳实践

以后在 API 中:
- **认证层面**: 使用 `user.sub` (Authing ID)
- **数据库操作**: 使用 `user.dbUserId` (数据库用户ID)
- **判断管理员**: 使用 `user.isAdmin` (已经基于 Authing ID 判断)

## 注意事项

- `requireAuth` 会自动查询映射关系,性能影响可接受
- 如果需要优化,可以考虑缓存映射关系
- 确保所有用户都在 `authing_users` 表中有对应记录

