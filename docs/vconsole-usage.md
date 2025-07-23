# vConsole 调试工具使用指南

本项目已经优化了 vConsole 的全局挂载和单例实现，确保日志持久化并提供丰富的调试功能。

## 功能特性

### 1. 真正的单例模式
- 确保全局唯一实例，避免重复初始化
- 自动管理生命周期，防止内存泄漏
- 支持异步初始化，避免阻塞

### 2. 日志持久化
- 自动收集所有 console 日志
- 支持 10,000 条日志记录
- 日志缓冲区管理，防止内存溢出
- 初始化后自动输出缓存的日志

### 3. 全局挂载
- 全局可访问的调试工具
- 丰富的调试命令接口
- 支持动态启用/禁用调试模式

### 4. 自动管理
- 自动检测 URL 参数启用调试
- 支持 sessionStorage 持久化调试状态
- 页面刷新后自动恢复调试状态

## 使用方法

### 1. 启用调试模式

#### 方法一：URL 参数
```
https://your-domain.com/?debug=true
```

#### 方法二：控制台命令
```javascript
// 启用调试模式
window.enableDebugMode();

// 切换调试模式
window.toggleDebugMode();

// 获取调试状态
window.getDebugStatus();
```

### 2. 清除调试模式

#### 方法一：控制台命令
```javascript
// 清除调试模式并刷新页面
window.clearDebugMode();
```

#### 方法二：手动清除
```javascript
// 手动清除 sessionStorage
sessionStorage.removeItem('debug_mode_enabled');
// 然后刷新页面
window.location.reload();
```

### 3. 控制 vConsole 显示和主题

```javascript
// 显示 vConsole 面板
window.showVConsole();

// 隐藏 vConsole 面板
window.hideVConsole();

// 更新 vConsole 主题
window.updateVConsoleTheme('light');  // 浅色主题
window.updateVConsoleTheme('dark');   // 深色主题

// 获取 vConsole 实例
const vConsole = window.vConsole;
if (vConsole) {
  // 直接操作 vConsole 实例
  vConsole.show();
  vConsole.hide();
}
```

## 全局调试工具

### 可用的全局命令

| 命令 | 功能 | 示例 |
|------|------|------|
| `window.enableDebugMode()` | 启用调试模式 | `await window.enableDebugMode()` |
| `window.clearDebugMode()` | 清除调试模式 | `window.clearDebugMode()` |
| `window.toggleDebugMode()` | 切换调试模式 | `await window.toggleDebugMode()` |
| `window.getDebugStatus()` | 获取调试状态 | `const status = window.getDebugStatus()` |
| `window.showVConsole()` | 显示 vConsole | `window.showVConsole()` |
| `window.hideVConsole()` | 隐藏 vConsole | `window.hideVConsole()` |
| `window.updateVConsoleTheme()` | 更新主题 | `window.updateVConsoleTheme('light')` |

### 调试状态检查

```javascript
// 检查是否启用调试模式
if (window.getDebugStatus()) {
  console.log('调试模式已启用');
}

// 检查 vConsole 是否可用
if (window.vConsole) {
  console.log('vConsole 已初始化');
}
```

## 日志管理

### 自动日志收集
- 所有 `console.log`、`console.warn`、`console.error`、`console.info` 都会被自动收集
- 日志包含时间戳和类型信息
- 支持对象和复杂数据结构的序列化

### 日志缓冲区
- 最多保存 1,000 条日志记录
- 超出限制时自动清理旧日志
- 初始化后自动输出缓存的日志

### 日志示例
```
📋 输出 15 条缓存的日志:
[14:30:25] LOG: 页面加载完成
[14:30:26] WARN: 网络请求超时
[14:30:27] ERROR: API 调用失败
[14:30:28] INFO: 用户登录成功
```

## 主题支持

### 自动主题切换
vConsole 现在支持自动跟随系统主题：
- 当用户切换日间/夜间模式时，vConsole 会自动更新主题
- 支持跟随系统设置（system 模式）
- 主题变化时会自动重新初始化 vConsole

### 手动主题控制
```javascript
// 手动更新主题
window.updateVConsoleTheme('light');  // 切换到浅色主题
window.updateVConsoleTheme('dark');   // 切换到深色主题
```

### 主题检测
vConsole 会在初始化时自动检测当前系统主题：
- 检查 `document.documentElement.classList.contains('dark')`
- 根据检测结果设置初始主题
- 支持实时主题变化监听

## 移动端调试

### 在移动设备上使用
1. 访问带有 `?debug=true` 参数的页面
2. 点击右下角的 vConsole 图标打开调试面板
3. 查看控制台日志、网络请求、DOM 元素等信息

### 支持的插件
- **System**: 系统信息、设备信息
- **Network**: 网络请求监控
- **Element**: DOM 元素检查
- **Storage**: 本地存储查看

## 开发环境配置

### 自动启用调试
在开发环境中，可以通过以下方式自动启用调试：

1. **环境变量方式**
```bash
# 在 .env.local 中设置
NEXT_PUBLIC_DEBUG_MODE=true
```

2. **URL 参数方式**
```
http://localhost:3000/?debug=true
```

### 生产环境禁用
在生产环境中，调试功能会被自动禁用，确保安全性。

## 故障排除

### 常见问题

#### 1. vConsole 无法加载
```javascript
// 检查网络连接
console.log('检查 vConsole 加载状态:', window.vConsole);

// 手动重新初始化
await window.enableDebugMode();
```

#### 2. 日志不显示
```javascript
// 检查日志缓冲区
const logs = window.vConsole?.getLogBuffer?.();
console.log('日志缓冲区:', logs);

// 手动输出日志
console.log('测试日志');
```

#### 3. 调试模式无法启用
```javascript
// 检查 sessionStorage
console.log('调试模式状态:', sessionStorage.getItem('debug_mode_enabled'));

// 手动设置
sessionStorage.setItem('debug_mode_enabled', 'true');
window.location.reload();
```

### 调试技巧

1. **使用浏览器开发者工具**
   - 在桌面端按 F12 打开开发者工具
   - 查看 Console 面板中的调试信息

2. **移动端调试**
   - 使用 vConsole 面板查看日志
   - 检查网络请求和存储信息

3. **日志过滤**
   - 在 vConsole 中使用搜索功能
   - 按日志类型过滤信息

## 性能优化

### 内存管理
- 自动限制日志缓冲区大小
- 及时清理不需要的日志
- 支持手动清除日志

### 加载优化
- 异步加载 vConsole 库
- 按需初始化调试功能
- 支持懒加载模式

## 安全考虑

### 生产环境
- 调试功能默认禁用
- 需要手动启用才能使用
- 不会暴露敏感信息

### 权限控制
- 只有授权用户才能启用调试
- 支持基于角色的访问控制
- 自动记录调试操作日志

## 更新日志

### v1.0.0 (当前版本)
- ✅ 实现真正的单例模式
- ✅ 添加日志持久化功能
- ✅ 提供全局调试工具
- ✅ 支持移动端调试
- ✅ 优化性能和内存使用
- ✅ 增强安全性

### 计划功能
- 🔄 支持自定义日志格式
- 🔄 添加日志导出功能
- 🔄 支持远程调试
- �� 添加性能监控
- 🔄 支持插件扩展 