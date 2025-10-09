# CloudBase 快速配置指南

## 简介

本指南帮助你快速配置腾讯云 CloudBase，用于项目的数据字典功能。

## 配置步骤

### 1. 创建 CloudBase 环境

1. 访问 [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 点击"新建环境"
3. 选择按量计费（可使用免费额度）
4. 环境名称：自定义（如：`wedding-explorer-prod`）
5. 创建完成后，记录**环境 ID**（形如：`env-xxxxxx`）

### 2. 创建数据库集合

1. 在 CloudBase 控制台，进入你的环境
2. 左侧菜单选择"数据库" -> "集合管理"
3. 点击"新建集合"
4. 集合名称输入：`system_settings`
5. 点击确认创建

### 3. 设置集合索引（可选但推荐）

在 `system_settings` 集合中添加以下索引以提升性能：

1. 点击集合名称进入详情
2. 选择"索引管理"标签
3. 添加索引：

   **索引 1 - key 唯一索引**
   - 字段名：`key`
   - 类型：唯一索引
   - 排序：升序

   **索引 2 - category 普通索引**
   - 字段名：`category`
   - 类型：普通索引
   - 排序：升序

   **索引 3 - isEnabled 普通索引**
   - 字段名：`isEnabled`
   - 类型：普通索引
   - 排序：升序

### 4. 获取 API 密钥

1. 访问 [腾讯云 API 密钥管理](https://console.cloud.tencent.com/cam/capi)
2. 如果没有密钥，点击"新建密钥"
3. 记录 `SecretId` 和 `SecretKey`

⚠️ **安全提示**：
- 密钥具有账户完整权限，请妥善保管
- 不要将密钥提交到代码仓库
- 建议使用子账号密钥并配置最小权限

### 5. 配置环境变量

在项目根目录创建或编辑 `.env` 文件：

```bash
# CloudBase 配置
CLOUDBASE_ENV_ID=env-xxxxxx              # 步骤 1 获取的环境 ID
CLOUDBASE_SECRET_ID=AKIDxxxxxxxxxxxxx     # 步骤 4 获取的 SecretId
CLOUDBASE_SECRET_KEY=xxxxxxxxxxxxx        # 步骤 4 获取的 SecretKey
```

### 6. 初始化数据（可选）

如果需要初始化一些系统数据，可以在 CloudBase 控制台的数据库中手动添加：

```json
{
  "key": "system_name",
  "displayName": "系统名称",
  "value": "婚礼探索系统",
  "valueType": "STRING",
  "category": "SYSTEM",
  "description": "系统的显示名称",
  "isSystem": true,
  "isEnabled": true,
  "sortOrder": 0,
  "createdAt": {"$date": "2025-01-09T00:00:00.000Z"},
  "updatedAt": {"$date": "2025-01-09T00:00:00.000Z"}
}
```

### 7. 验证配置

启动开发服务器：

```bash
pnpm dev
```

访问管理后台的数据字典页面，检查：
- ✅ 页面正常加载
- ✅ 可以查看字典列表
- ✅ 可以创建新的字典项
- ✅ 可以编辑和删除字典项

## 开发环境 vs 生产环境

### 开发环境

可以使用测试环境的 CloudBase：

```bash
# .env.development
CLOUDBASE_ENV_ID=env-test-xxxxxx
CLOUDBASE_SECRET_ID=test_secret_id
CLOUDBASE_SECRET_KEY=test_secret_key
```

### 生产环境

使用独立的生产环境：

```bash
# .env.production
CLOUDBASE_ENV_ID=env-prod-xxxxxx
CLOUDBASE_SECRET_ID=prod_secret_id
CLOUDBASE_SECRET_KEY=prod_secret_key
```

## 费用说明

CloudBase 提供免费额度，对于中小型项目完全够用：

**免费额度（每月）**：
- 数据库存储：2GB
- 数据库读操作：50,000 次/天
- 数据库写操作：30,000 次/天
- 数据库集合：50 个

**超出免费额度后的计费**：
- 存储：¥0.07/GB/天
- 读操作：¥0.015/万次
- 写操作：¥0.05/万次

详见：[CloudBase 计费说明](https://cloud.tencent.com/document/product/876/39095)

## 安全建议

1. **使用子账号密钥**
   - 不要使用主账号密钥
   - 创建子账号并授予最小权限
   
2. **权限配置**
   为子账号添加以下权限策略：
   - `QcloudAccessForTCBRole` - CloudBase 基础权限
   
3. **密钥轮换**
   - 定期更换 API 密钥（建议每 3-6 个月）
   - 更换后及时更新环境变量

4. **安全规则**
   在 CloudBase 控制台配置数据库安全规则，限制访问权限

## 故障排查

### 问题 1: 连接超时

**现象**：API 请求超时，无法连接到 CloudBase

**解决方案**：
1. 检查环境变量配置是否正确
2. 检查网络连接
3. 确认 CloudBase 环境状态正常

### 问题 2: 权限错误

**现象**：返回 "permission denied" 错误

**解决方案**：
1. 检查 SecretId 和 SecretKey 是否正确
2. 检查子账号权限配置
3. 查看 CloudBase 控制台的安全规则

### 问题 3: 集合不存在

**现象**：提示 "collection not found"

**解决方案**：
1. 在 CloudBase 控制台检查集合是否存在
2. 确认集合名称是否为 `system_settings`
3. 检查环境 ID 是否正确

## 监控和维护

### 查看使用量

1. 进入 CloudBase 控制台
2. 选择"监控告警" -> "用量统计"
3. 查看数据库操作次数、存储使用量等

### 设置告警

1. 进入"监控告警" -> "告警策略"
2. 创建新的告警策略
3. 配置阈值（如：存储使用超过 80%）
4. 设置接收人和通知方式

## 相关文档

- [CloudBase Migration Guide](./cloudbase-migration.md) - 从 Supabase 迁移指南
- [CloudBase 官方文档](https://docs.cloudbase.net/)
- [CloudBase Node.js SDK](https://docs.cloudbase.net/api-reference/server/node-sdk/introduction)

## 技术支持

如遇到问题：
1. 查看 CloudBase 控制台的监控和日志
2. 查阅 [CloudBase 官方文档](https://docs.cloudbase.net/)
3. 联系项目维护者

---

**文档版本**：v1.0.0
**最后更新**：2025-01-09

