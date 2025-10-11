# 超级管理员配置功能

## 功能概述

超级管理员配置功能允许超级管理员配置游戏项目，包括项目名称、参与费用和奖励机制。这为后续普通管理员在管理面板中帮用户核销游戏币或赢取游戏币提供了基础配置。

## 环境变量配置

在 `.env` 文件中添加超级管理员配置：

```env
# ======== 超级管理员用户ID ========
SUPER_ADMIN_ID=your_super_admin_user_id
```

注意：`SUPER_ADMIN_ID` 只能配置一个用户ID，与 `AUTHING_ADMIN_ID`（可配置多个）不同。

## 权限层级

1. **超级管理员** (`SUPER_ADMIN_ID`)
   - 拥有所有管理员权限
   - 可以访问超级管理员配置页面
   - 可以配置游戏项目

2. **普通管理员** (`AUTHING_ADMIN_ID`)
   - 拥有基本管理员权限
   - 可以访问管理面板帮用户核销游戏币
   - 无法访问超级管理员配置页面

## 功能特性

### 游戏项目管理

- **创建游戏项目**：设置项目名称、描述、费用和奖励
- **编辑游戏项目**：修改现有项目的配置
- **启用/禁用项目**：控制项目的可用状态
- **删除项目**：删除没有游戏记录的项目
- **排序管理**：通过排序权重控制项目显示顺序

### 游戏项目配置项

- **项目名称**：游戏项目的显示名称
- **项目描述**：项目的详细说明（可选）
- **消耗游戏币**：用户参与游戏需要扣除的游戏币数量
- **奖励游戏币**：用户获胜时能获得的游戏币数量
- **排序权重**：控制项目在列表中的显示顺序
- **启用状态**：控制项目是否可用

## 数据库结构

### GameProject 表

```sql
CREATE TABLE game_projects (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  cost_coins INT DEFAULT 0,
  reward_coins INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(50),
  updated_by VARCHAR(50)
);
```

### GameRecord 表

```sql
CREATE TABLE game_records (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL,
  game_project_id VARCHAR(30) NOT NULL,
  result ENUM('WIN', 'LOSE', 'DRAW') NOT NULL,
  coins_spent INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  remarks TEXT,
  operator_id VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (game_project_id) REFERENCES game_projects(id)
);
```

## API 接口

### 游戏项目 CRUD

- `GET /api/admin/game-projects` - 获取游戏项目列表
- `POST /api/admin/game-projects` - 创建游戏项目
- `GET /api/admin/game-projects/[id]` - 获取单个游戏项目
- `PUT /api/admin/game-projects/[id]` - 更新游戏项目
- `DELETE /api/admin/game-projects/[id]` - 删除游戏项目

所有接口都需要超级管理员权限验证。

## 访问路径

- 设置页面：`/settings`
- 超级管理员配置：`/settings/super-admin`

## 使用流程

1. **配置环境变量**：在 `.env` 文件中设置 `SUPER_ADMIN_ID`
2. **访问设置页面**：超级管理员登录后访问 `/settings`
3. **进入超管配置**：点击"超级管理员配置"卡片
4. **管理游戏项目**：创建、编辑、启用/禁用游戏项目
5. **普通管理员使用**：普通管理员可在管理面板中使用配置的游戏项目

## 安全考虑

- 所有 API 接口都有超级管理员权限验证
- 超级管理员配置页面只对超级管理员可见
- 删除游戏项目前会检查是否有关联的游戏记录
- 使用服务端组件检查权限，避免客户端绕过

## 后续扩展

- 支持游戏项目分类
- 添加游戏项目统计功能
- 支持批量操作
- 添加游戏项目模板功能
