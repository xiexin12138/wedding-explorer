/**
 * 服务端配置 - 包含敏感信息，只能在服务端使用
 * ⚠️ 警告：此文件绝对不能被客户端代码导入！
 */

// 确保只在服务端运行
if (typeof window !== 'undefined') {
  throw new Error('🚨 server-config.ts 只能在服务端使用！不能在客户端导入此文件！');
}

const AUTHING_APP_SECRET = process.env.AUTHING_APP_SECRET;
const AUTHING_ADMIN_ID = process.env.AUTHING_ADMIN_ID;
const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID;

if (!AUTHING_APP_SECRET) {
  console.error('❌ AUTHING_APP_SECRET 环境变量未设置');
  throw new Error('AUTHING_APP_SECRET environment variable is required');
}

if (!AUTHING_ADMIN_ID) {
  console.warn('⚠️ AUTHING_ADMIN_ID 环境变量未设置，管理员权限将无法正常工作');
}

if (!SUPER_ADMIN_ID) {
  console.warn('⚠️ SUPER_ADMIN_ID 环境变量未设置，超级管理员权限将无法正常工作');
}

// ✅ 只导出服务端专用的敏感配置
export { AUTHING_APP_SECRET, AUTHING_ADMIN_ID, SUPER_ADMIN_ID };

// 也可以重新导入客户端配置（避免重复）
export { AUTHING_APP_ID, AUTHING_APP_HOST } from './client-config';

// 服务端配置对象
export const SERVER_CONFIG = {
  authingSecret: AUTHING_APP_SECRET,
  authingAdminId: AUTHING_ADMIN_ID,
  superAdminId: SUPER_ADMIN_ID,
} as const;

/**
 * 检查用户是否为超级管理员
 */
export function isSuperAdmin(userId: string): boolean {
  if (!SUPER_ADMIN_ID) {
    return false;
  }
  return userId === SUPER_ADMIN_ID;
}

/**
 * 检查用户是否为管理员（包括超级管理员）
 */
export function isAdmin(userId: string): boolean {
  // 首先检查是否为超级管理员
  if (isSuperAdmin(userId)) {
    return true;
  }
  
  // 然后检查是否为普通管理员
  if (!AUTHING_ADMIN_ID) {
    return false;
  }
  
  const adminIds = AUTHING_ADMIN_ID.split(',').map(id => id.trim()).filter(Boolean);
  return adminIds.includes(userId);
}