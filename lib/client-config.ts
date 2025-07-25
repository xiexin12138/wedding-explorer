/**
 * 客户端配置 - 只包含可以安全暴露给浏览器的配置
 */

const AUTHING_APP_ID = process.env.NEXT_PUBLIC_AUTHING_APP_ID;
const AUTHING_APP_HOST = process.env.NEXT_PUBLIC_AUTHING_APP_HOST;

// 分析服务配置
const ANALYTICS_PROVIDER = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
const ANALYTICS_SCRIPT_SRC = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_SRC;
const ANALYTICS_SITE_ID = process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID;
const ANALYTICS_TOKEN = process.env.NEXT_PUBLIC_ANALYTICS_TOKEN;
const GOOGLE_ANALYTICS_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

if (!AUTHING_APP_ID) {
  console.error('❌ NEXT_PUBLIC_AUTHING_APP_ID 环境变量未设置');
  throw new Error('NEXT_PUBLIC_AUTHING_APP_ID environment variable is required');
}

if (!AUTHING_APP_HOST) {
  console.error('❌ AUTHING_APP_HOST 环境变量未设置');
  throw new Error('AUTHING_APP_HOST environment variable is required');
}

// ✅ 只导出客户端安全的配置
export {
  AUTHING_APP_ID,
  AUTHING_APP_HOST,
  ANALYTICS_PROVIDER,
  ANALYTICS_SCRIPT_SRC,
  ANALYTICS_SITE_ID,
  ANALYTICS_TOKEN,
  GOOGLE_ANALYTICS_ID
};

// 配置对象形式（可选）
export const CLIENT_CONFIG = {
  authingAppId: AUTHING_APP_ID,
  authingAppHost: AUTHING_APP_HOST,
  analyticsProvider: ANALYTICS_PROVIDER,
  analyticsScriptSrc: ANALYTICS_SCRIPT_SRC,
  analyticsSiteId: ANALYTICS_SITE_ID,
  analyticsToken: ANALYTICS_TOKEN,
  googleAnalyticsId: GOOGLE_ANALYTICS_ID,
} as const; 