# 景点数据迁移指南

## 背景

之前的景点数据存储方式是将每个景点作为一个独立的字典项存储在 `ATTRACTIONS` 分类下，这导致字典表非常混乱。

**新的存储方式**：所有景点作为一个列表存储在单个字典项 `attractions_list` 中。

## 数据结构变化

### 旧结构
```
字典项 1: key=chenqiao_cultural_square, category=ATTRACTIONS, value={景点数据JSON}
字典项 2: key=chenqiao_village, category=ATTRACTIONS, value={景点数据JSON}
字典项 3: key=renmin_food_square, category=ATTRACTIONS, value={景点数据JSON}
...
```

### 新结构
```
字典项 1: key=attractions_list, category=ATTRACTIONS, value=[所有景点的JSON数组]
```

## 架构改进

### 新增文件
- `/lib/repositories/attractions.repository.ts` - 景点专用的仓储层
- `/scripts/migrate-attractions-to-list.ts` - 数据迁移脚本

### 修改文件
- `/app/api/attractions/route.ts` - 使用新的景点仓储
- `/app/api/attractions/[id]/route.ts` - 使用新的景点仓储
- `/lib/services/attractions.service.ts` - 适配新的数据结构
- `/scripts/init-attractions-data.ts` - 使用新的数据结构初始化

## 迁移步骤

### 1. 运行迁移脚本

```bash
pnpm migrate:attractions
```

这个脚本会：
1. 读取所有 `ATTRACTIONS` 分类的字典项
2. 将它们转换为新的数据格式
3. 创建或更新 `attractions_list` 字典项
4. 询问是否删除旧的独立景点字典项

### 2. 验证迁移结果

迁移完成后，你可以：

- 访问 `/api/attractions` 查看所有景点数据
- 检查字典表中是否只有一个 `attractions_list` 项
- 确认前端地图功能正常工作

### 3. 清理旧数据（可选）

如果在迁移时选择不删除旧数据，确认新系统运行正常后，可以手动删除旧的景点字典项。

## 新景点数据结构

```typescript
interface Attraction {
  id: string;                 // 唯一标识
  key: string;                // 景点的唯一键名（用于代码引用）
  name: string;               // 景点名称
  position: [number, number]; // 经纬度坐标
  description: string;        // 景点描述
  type: AttractionType;       // 景点类型
  media?: Array<{             // 媒体文件
    type: 'image' | 'video';
    url: string;
    title?: string;
  }>;
  unlockDistance?: number;    // 解锁距离（米）
  isEnabled?: boolean;        // 是否启用
  sortOrder?: number;         // 排序
  createdAt?: Date;          // 创建时间
  updatedAt?: Date;          // 更新时间
  createdBy?: string;        // 创建者
  updatedBy?: string;        // 更新者
}
```

## API 接口变化

### GET /api/attractions
返回所有启用的景点列表（数据结构不变）

### POST /api/attractions
创建新景点（现在保存到景点列表中）

### PATCH /api/attractions/[id]
更新景点（现在更新景点列表中的对应项）
- 新增支持更新更多字段：`position`, `type`, `media`, `unlockDistance`, `isEnabled`, `sortOrder`

### DELETE /api/attractions/[id]
删除景点（从景点列表中移除）

## 优势

1. **字典表更整洁**：只有一个景点相关的字典项
2. **更容易管理**：所有景点在一个地方，便于批量操作
3. **性能优化**：一次读取所有景点，减少数据库查询
4. **原子性操作**：景点列表的更新是原子性的
5. **更好的数据组织**：景点数据有独立的仓储层

## 初始化新环境

如果是新环境（没有旧数据），直接运行：

```bash
pnpm init:attractions
```

这会创建示例景点数据。

## 注意事项

1. **备份数据**：在运行迁移脚本之前，建议备份数据库
2. **测试环境**：建议先在测试环境运行迁移
3. **保留旧数据**：首次迁移时建议保留旧数据，确认无误后再删除
4. **缓存清理**：迁移后会自动清除相关缓存

## 回滚方案

如果需要回滚到旧的数据结构：

1. 从备份中恢复旧的字典项
2. 将代码回滚到迁移前的版本
3. 清除缓存

## 问题排查

### 迁移失败
- 检查数据库连接
- 查看错误日志
- 确认旧数据格式正确

### 景点数据不显示
- 检查 `attractions_list` 字典项是否存在
- 确认数据格式正确
- 清除缓存后重试

### API 报错
- 检查是否正确导入新的仓储层
- 查看服务器日志
- 确认 ID 格式正确

## 支持

如有问题，请查看代码注释或联系开发团队。

