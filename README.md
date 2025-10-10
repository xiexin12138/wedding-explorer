## 计划模块

- [x] 登录模块 —— 已接入 Authing.js，实现用户注册、登录功能，并通过环境变量配置超管用户
- [x] 管理模块 —— 通过字典配置，实现首页婚礼时间配置、婚礼议程配置
- [x] 议程安排 —— UI 和数据字典读取已完成，后续考虑扩展点击跳转二级内容
- [ ] 地图探索 —— 进行中，已接入高德定位
- [ ] 对话咨询 —— 还没想好选择什么三方库
- [ ] 位置图 —— 等最后婚礼场地布置方案出来后再加入，应该也是通过字典读取对象存储资源

## 开始开发

### 1. 环境配置

复制 `.env.example` 并配置环境变量：

```shell
cp .env.example .env
```

配置必要的环境变量：

- `DATABASE_URL`: 腾讯云 MySQL 数据库连接地址
- `NEXT_PUBLIC_AUTHING_APP_ID`: Authing 应用 ID
- `AUTHING_ADMIN_ID`: 管理员用户 ID（多个用逗号分隔）
- 其他配置项参考 `.env.example`

### 2. 数据库设置

```shell
# 生成 Prisma Client
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate dev

# （可选）填充初始数据
pnpm prisma db seed
```

### 3. 启动开发服务器

```shell
corepack enable
pnpm i
pnpm dev
```

> 在开发流程中，当修改 Prisma schema 后，记得执行：

```shell
# 开发环境创建并应用迁移
npx prisma migrate dev

# 或者如果只是要同步 schema（不创建迁移文件）
npx prisma db push
```

### 📚 相关文档

- [腾讯云 MySQL 快速开始](./docs/mysql-quick-start.md) - 5 分钟快速配置指南
- [MySQL 迁移完整指南](./docs/mysql-migration-guide.md) - 详细的迁移文档
- [CloudBase 配置说明](./docs/cloudbase-setup.md)
- [分析服务配置](./docs/analytics-setup.md)
- [VConsole 使用指南](./docs/vconsole-usage.md)
