# 分析服务配置指南

本项目支持多种主流分析服务，您可以根据需要选择其中一种进行配置。

## 支持的分析服务

### 1. Plausible Analytics（推荐）
隐私友好的轻量级分析服务。

**配置示例：**
```bash
NEXT_PUBLIC_ANALYTICS_PROVIDER=plausible
NEXT_PUBLIC_ANALYTICS_SCRIPT_SRC=https://plausible.io/js/script.js
```

**官方文档：** https://plausible.io/docs/installation-guide

### 2. Fathom Analytics
另一个隐私优先的分析服务。

**配置示例：**
```bash
NEXT_PUBLIC_ANALYTICS_PROVIDER=fathom
NEXT_PUBLIC_ANALYTICS_SITE_ID=your_fathom_site_id
```

**官方文档：** https://usefathom.com/docs/script

### 3. Cloudflare Web Analytics
Cloudflare 提供的免费分析服务。

**配置示例：**
```bash
NEXT_PUBLIC_ANALYTICS_PROVIDER=cloudflare
NEXT_PUBLIC_ANALYTICS_TOKEN=your_cloudflare_analytics_token
```

**官方文档：** https://developers.cloudflare.com/analytics/web-analytics/

### 4. Google Analytics 4
Google 的全面分析服务。

**配置示例：**
```bash
NEXT_PUBLIC_ANALYTICS_PROVIDER=google-analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

**官方文档：** https://developers.google.com/analytics/devguides/collection/gtagjs

### 5. 自定义分析服务
支持自定义分析脚本。

**配置示例：**
```bash
NEXT_PUBLIC_ANALYTICS_PROVIDER=custom
NEXT_PUBLIC_ANALYTICS_SCRIPT_SRC=https://your-analytics.com/script.js
```

## 配置步骤

1. **选择分析服务提供商**
   在 `.env.local` 文件中设置 `NEXT_PUBLIC_ANALYTICS_PROVIDER`

2. **配置相应的环境变量**
   根据选择的服务配置相应的环境变量

3. **重启开发服务器**
   ```bash
   npm run dev
   ```

## 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | 分析服务提供商 | 是 |
| `NEXT_PUBLIC_ANALYTICS_SCRIPT_SRC` | 自定义脚本地址 | 部分服务 |
| `NEXT_PUBLIC_ANALYTICS_SITE_ID` | Fathom 站点 ID | Fathom 必需 |
| `NEXT_PUBLIC_ANALYTICS_TOKEN` | Cloudflare 令牌 | Cloudflare 必需 |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | GA4 测量 ID | GA4 必需 |

## 性能优化

- 所有分析脚本都使用 `afterInteractive` 策略加载
- 不会阻塞页面初始渲染
- 支持服务端渲染，SEO 友好

## 隐私保护

- Plausible 和 Fathom 都是隐私友好的分析服务
- 不会收集个人身份信息
- 符合 GDPR 等隐私法规要求 