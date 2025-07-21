/**
 * 服务端配置 - 包含敏感信息，只能在服务端使用
 * ⚠️ 警告：此文件绝对不能被客户端代码导入！
 */

// 确保只在服务端运行
if (typeof window !== 'undefined') {
  throw new Error('🚨 server-config.ts 只能在服务端使用！不能在客户端导入此文件！');
}

const AUTHING_APP_SECRET = process.env.AUTHING_APP_SECRET;
const AUTHING_APP_HOST = process.env.AUTHING_APP_HOST;

if (!AUTHING_APP_SECRET) {
  console.error('❌ AUTHING_APP_SECRET 环境变量未设置');
  throw new Error('AUTHING_APP_SECRET environment variable is required');
}

// ✅ 只导出服务端专用的敏感配置
export { AUTHING_APP_SECRET };

// 也可以重新导入客户端配置（避免重复）
export { AUTHING_APP_ID } from './client-config';

// 服务端配置对象
export const SERVER_CONFIG = {
  authingSecret: AUTHING_APP_SECRET,
  authingHost: AUTHING_APP_HOST,
} as const;