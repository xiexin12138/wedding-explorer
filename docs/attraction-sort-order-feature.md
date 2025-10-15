# 景点排序功能

## 功能概述

管理员现在可以通过手动设置排序权重来控制景点在列表中的显示顺序。

## 使用方法

### 1. 创建新景点时设置排序

在地图页面点击"添加景点"按钮，在表单中填写景点信息时，可以设置"排序权重"字段：

- **字段名称**: 排序权重
- **默认值**: 0
- **说明**: 数值越大越靠前
- **示例**: 
  - 设置为 100 的景点会排在设置为 50 的景点前面
  - 设置为 0 的景点会排在设置为 10 的景点后面

### 2. 编辑现有景点的排序

1. 在地图页面的景点列表中，点击景点卡片
2. 点击"编辑景点"按钮
3. 修改"排序权重"字段
4. 点击"保存修改"

### 3. 排序规则

景点列表按以下规则排序：

1. **首要排序**: 按排序权重降序（数值大的在前）
2. **次要排序**: 按创建时间降序（新创建的在前）

## 技术实现

### 数据库字段

- 表名: `attractions`
- 字段名: `sortOrder`
- 类型: `Int`
- 默认值: `0`

### API 支持

#### 创建景点 (POST /api/attractions)
```json
{
  "name": "景点名称",
  "description": "景点描述",
  "type": "SCENIC",
  "position": [经度, 纬度],
  "unlockDistance": 100,
  "rewardCoins": 10,
  "sortOrder": 50,
  "media": []
}
```

#### 更新景点 (PATCH /api/attractions/[id])
```json
{
  "sortOrder": 100
}
```

### 前端组件

- **表单组件**: `components/AttractionForm.tsx`
- **景点接口**: `components/AttractionCard.tsx` 中的 `AttractionDetail` 接口
- **数据仓储**: `lib/repositories/attractions.repository.ts`

## 示例场景

### 场景 1: 重点景点置顶

如果你想让某个重点景点始终显示在列表最前面：

1. 编辑该景点
2. 将排序权重设置为一个较大的数值，如 999
3. 保存后，该景点会显示在列表最前面

### 场景 2: 按重要性分组

你可以按照景点的重要性设置不同的权重范围：

- **必游景点**: 排序权重 100-999
- **推荐景点**: 排序权重 50-99
- **普通景点**: 排序权重 0-49

这样可以让用户优先看到重要的景点。

## 注意事项

1. 排序权重可以是任何整数（包括负数）
2. 相同排序权重的景点按创建时间排序
3. 修改排序权重后，列表会立即更新（缓存会自动清除）
4. 排序权重不影响景点的其他功能（如打卡、导航等）

## 相关文件

- `components/AttractionForm.tsx` - 景点表单组件
- `components/AttractionCard.tsx` - 景点卡片组件和接口定义
- `lib/repositories/attractions.repository.ts` - 景点数据仓储
- `app/api/attractions/route.ts` - 景点列表 API
- `app/api/attractions/[id]/route.ts` - 景点更新 API
- `prisma/schema.prisma` - 数据库模型定义

