# 打卡功能调试指南

## 问题描述

用户在尝试打卡时遇到错误: `打卡失败: Error: 打卡失败`

## 已完成的修复

1. ✅ 添加了详细的服务端错误日志
2. ✅ 添加了前端打卡请求日志
3. ✅ 改进了错误信息返回

## 调试步骤

### 1. 检查数据库状态

运行检查脚本:
```bash
npx tsx scripts/check-attractions-data.ts
```

**当前状态**:
- ✅ Attraction 表存在,有 1 个景点
- ✅ UserAttractionCheckIn 表存在
- ✅ User 表有 6 个用户

### 2. 查看控制台日志

刷新页面并尝试打卡,检查以下日志:

**前端控制台** (浏览器):
- 🎯 发起打卡请求
- 📡 打卡响应状态
- 📦 打卡响应数据
- ❌ 打卡服务错误 (如果出错)

**后端控制台** (终端):
- 打卡失败: (错误对象)
- 错误详情: (错误消息)
- 错误堆栈: (堆栈跟踪)

### 3. 常见问题排查

#### 问题1: 用户未登录
**症状**: 响应 403 或 401
**解决**: 确保用户已登录,检查 `requireAuth` 中间件

#### 问题2: 景点不存在
**症状**: 响应 404
**解决**: 检查传递的 `attractionId` 是否正确

#### 问题3: 已经打卡过
**症状**: 响应 400, 错误信息 "您已经打卡过该景点"
**解决**: 这是正常的业务逻辑限制

#### 问题4: 距离太远
**症状**: 响应 400, 错误信息包含 "距离太远"
**解决**: 
- 检查用户位置是否正确
- 检查距离计算是否准确
- 调整 `unlockDistance` 参数(测试用)

#### 问题5: 数据库事务失败
**症状**: 响应 500, 后端有详细错误堆栈
**可能原因**:
- 数据库连接问题
- Prisma 模型定义问题
- 外键约束问题
- 用户ID不存在

## 测试打卡功能

### 方法1: 在开发环境测试

1. 确保用户已登录
2. 打开地图页面
3. 选择一个景点
4. 点击"立即打卡"按钮
5. 观察控制台日志

### 方法2: 使用 API 测试工具

使用 curl 或 Postman 测试:

```bash
# 先获取认证 token (登录后从浏览器复制 cookie)
curl -X POST http://localhost:3000/api/attractions/{景点ID}/check-in \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"distance": 50, "longitude": 114.11, "latitude": 22.54}'
```

### 方法3: 临时放宽限制(仅测试用)

修改打卡 API,临时注释掉距离验证:

```typescript
// 临时注释掉距离验证,用于测试
/*
if (distance !== undefined && distance > attraction.unlockDistance) {
  return NextResponse.json(
    {
      error: `您距离景点太远，需要在${attraction.unlockDistance}米内才能打卡`,
    },
    { status: 400 }
  );
}
*/
```

## 下一步操作

1. 重启开发服务器: `npm run dev`
2. 清除浏览器缓存
3. 尝试打卡
4. 查看前端和后端控制台的详细日志
5. 根据日志信息定位具体问题

## 常见错误及解决方案

### 错误: "Invalid `prisma.user.update()` invocation"

**原因**: 用户ID不存在或格式错误

**解决**:
1. 检查 `user.sub` 是否正确
2. 确认用户在数据库中存在
3. 检查用户ID格式是否符合数据库定义

### 错误: "Foreign key constraint failed"

**原因**: 外键关系不匹配

**解决**:
1. 检查景点ID是否存在
2. 检查用户ID是否存在
3. 运行 `npx prisma db push` 确保数据库同步

### 错误: "Unique constraint failed"

**原因**: 用户已经打卡过该景点

**解决**: 这是正常的业务逻辑,前端应该先检查打卡状态

## 额外建议

### 1. 添加景点数据

如果景点数据不足,可以:

```bash
# 从字典迁移
npx tsx scripts/migrate-attractions-from-dictionary.ts

# 或者手动添加测试数据
npx tsx scripts/init-attractions-data.ts
```

### 2. 重置打卡记录(测试用)

如果需要重置打卡记录进行测试:

```typescript
// 临时脚本
await db.userAttractionCheckIn.deleteMany({
  where: { userId: 'your-user-id' }
});
```

### 3. 检查用户权限

确认用户表中的数据:

```bash
npx prisma studio
```

在 Prisma Studio 中查看:
- 用户是否存在
- 用户ID格式
- 用户金币余额

