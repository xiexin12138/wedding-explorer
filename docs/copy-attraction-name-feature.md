# 景点名称复制功能

## 功能概述

在景点卡片和展开视图的标题右侧添加了复制按钮，用户点击后可以快速复制景点名称到剪贴板，方便在地图应用中搜索。

## 技术实现

### 兼容性方案

实现了两种复制方法，自动适配不同环境：

1. **现代浏览器**：使用 `navigator.clipboard.writeText()` API
2. **微信浏览器/旧版浏览器**：使用 `document.execCommand('copy')` 方法

### 微信浏览器兼容

针对微信浏览器（iOS 和 Android）进行了特殊处理：

- **不依赖微信 JS-SDK**：使用原生 Web API 实现
- **iOS 特殊处理**：使用 `Selection` API 确保在 iOS 设备上正常工作
- **隐藏文本域**：创建不可见的 textarea 进行复制，不影响用户体验

### 用户反馈

- **视觉反馈**：复制成功后按钮图标从 Copy 变为 Check（绿色），2秒后恢复
- **Toast 提示**：显示"复制成功"提示，包含景点名称
- **错误处理**：复制失败时提示用户手动复制

## 使用位置

1. **景点卡片视图**：标题右侧的小型复制按钮
2. **景点展开视图**：标题右侧的复制按钮

## 代码位置

- 文件：`components/AttractionCard.tsx`
- 函数：`handleCopyName()`
- 涉及组件：
  - 卡片视图标题区域（第1007-1032行）
  - 展开视图标题区域（第769-794行）

## 测试要点

### 测试环境

- ✅ 现代浏览器（Chrome、Safari、Edge）
- ✅ 微信浏览器（iOS）
- ✅ 微信浏览器（Android）
- ✅ 移动端浏览器

### 测试用例

1. 点击复制按钮，检查是否成功复制
2. 粘贴到其他应用，验证复制内容正确
3. 观察视觉反馈（图标变化、Toast 提示）
4. 在不同浏览器环境中测试兼容性

## 相关代码示例

```typescript
// 复制景点名称（兼容微信浏览器）
const handleCopyName = async () => {
  try {
    // 方法1: 尝试使用现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(attraction.name);
      // ... 成功处理
    } else {
      // 方法2: 使用传统的 document.execCommand（兼容微信浏览器）
      const textArea = document.createElement('textarea');
      textArea.value = attraction.name;
      // 设置样式使其不可见
      // ... 省略样式设置
      
      document.body.appendChild(textArea);
      textArea.select();
      
      // iOS 特殊处理
      if (navigator.userAgent.match(/ipad|iphone/i)) {
        // ... 使用 Selection API
      }
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      // ... 成功处理
    }
  } catch (error) {
    // 错误处理
  }
};
```

## 已知限制

1. **非安全上下文**：在非 HTTPS 环境下，某些浏览器可能不支持现代 Clipboard API，但会自动降级到 `execCommand` 方法
2. **用户权限**：某些浏览器可能需要用户授权剪贴板访问权限

## 优化建议

未来可以考虑的优化方向：

1. 添加键盘快捷键（如 Ctrl/Cmd + C）
2. 支持长按显示更多选项（复制名称、地址等）
3. 添加复制历史记录

