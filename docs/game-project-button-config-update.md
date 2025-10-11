# 游戏项目按钮配置功能更新

## 更新时间
2025-10-11

## 更新概述
将游戏项目配置从固定的单一增减金额改为可配置的多按钮选项，支持预设数值按钮和自定义输入按钮。

## 主要变更

### 1. 数据库模型更新 (Prisma Schema)
**文件**: `prisma/schema.prisma`

将 `GameProject` 模型的 `costCoins` 和 `rewardCoins` 字段替换为：
- `costButtons`: TEXT 类型，存储 JSON 格式的消耗按钮配置数组
- `rewardButtons`: TEXT 类型，存储 JSON 格式的奖励按钮配置数组

**迁移文件**: `prisma/migrations/20251011093915_update_game_project_to_buttons/migration.sql`

### 2. TypeScript 类型定义

```typescript
type ButtonConfig = number | 'ADD_ANY' | 'DECLINE_ANY';
```

- **数字**: 表示固定的金额按钮（例如：1, 3, 5）
- **'ADD_ANY'**: 表示"自定义增加"按钮，允许用户输入任意增加金额
- **'DECLINE_ANY'**: 表示"自定义减少"按钮，允许用户输入任意减少金额

### 3. 后端 API 更新

#### 3.1 GET `/api/admin/game-projects`
**变更**: 返回数据中的按钮配置从 JSON 字符串解析为数组

```typescript
{
  costButtons: JSON.parse(project.costButtons),
  rewardButtons: JSON.parse(project.rewardButtons),
}
```

#### 3.2 POST `/api/admin/game-projects`
**变更**: 
- 接收 `costButtons` 和 `rewardButtons` 数组参数
- 验证数组内容（只允许数字或特定字符串）
- 存储时将数组序列化为 JSON 字符串

**验证规则**:
- `costButtons` 只能包含非负整数或 `"DECLINE_ANY"`
- `rewardButtons` 只能包含非负整数或 `"ADD_ANY"`

#### 3.3 PUT `/api/admin/game-projects/[id]`
**变更**: 与 POST 接口类似，但允许部分更新

#### 3.4 GET `/api/admin/game-projects/[id]`
**变更**: 同样解析按钮配置为数组

### 4. 前端页面更新

#### 4.1 超级管理员配置页面
**文件**: `app/(needHeader)/(admin)/settings/super-admin/page.tsx`

**新增功能**:

1. **按钮配置管理界面**
   - 输入框：输入数字值
   - "添加数字"按钮：将输入的数字添加到配置中
   - "添加自定义"按钮：添加 `ADD_ANY` 或 `DECLINE_ANY` 特殊按钮
   - 预览区域：以 Badge 形式显示已配置的按钮
   - 点击 Badge 可删除对应按钮

2. **按钮显示格式化**
   - 数字：直接显示数值
   - `ADD_ANY`：显示为"自定义增加"
   - `DECLINE_ANY`：显示为"自定义减少"

3. **项目列表卡片展示**
   - 消耗按钮：红色 Badge 展示
   - 奖励按钮：绿色 Badge 展示
   - 支持多个按钮的换行显示

## 使用示例

### 创建游戏项目示例

```json
{
  "name": "投篮游戏",
  "description": "投中篮筐获得奖励",
  "costButtons": [1, 3, 5, "DECLINE_ANY"],
  "rewardButtons": [1, 3, 5, "ADD_ANY"],
  "sortOrder": 0
}
```

这个配置将渲染：
- **消耗金币选项**: 按钮 1、按钮 3、按钮 5、自定义减少
- **奖励金币选项**: 按钮 1、按钮 3、按钮 5、自定义增加

### 使用场景

1. **固定金额场景**: `[1, 3, 5]` - 只允许选择预设的三个金额
2. **灵活输入场景**: `[1, 3, 5, "ADD_ANY"]` - 既有快捷按钮，也支持自定义输入
3. **仅自定义场景**: `["ADD_ANY"]` - 完全由管理员手动输入金额

## 向后兼容性

由于数据库字段类型从 `Int` 改为 `Text`，这是一个破坏性变更。旧数据需要迁移：

```sql
-- 迁移示例（如需要）
UPDATE game_projects 
SET costButtons = JSON_ARRAY(costCoins),
    rewardButtons = JSON_ARRAY(rewardCoins);
```

但由于项目是新建的，没有历史数据需要迁移。

## 注意事项

1. **MySQL TEXT 字段限制**: TEXT 类型字段不能有默认值，因此创建记录时必须提供按钮配置
2. **前端验证**: 添加按钮时会验证输入是否为有效的非负整数
3. **特殊按钮唯一性**: 每种特殊按钮（`ADD_ANY`/`DECLINE_ANY`）在同一配置中只能添加一次
4. **JSON 存储**: 按钮配置在数据库中以 JSON 字符串形式存储，API 层负责序列化和反序列化

## 未来扩展

可能的扩展方向：
1. 支持按钮的排序和拖拽调整顺序
2. 支持为每个按钮配置不同的样式或图标
3. 支持更多特殊按钮类型（如倍数按钮、百分比按钮等）
4. 添加按钮使用统计分析

