import { cookies } from 'next/headers';
import { getAuthingSession } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/server-config';

/**
 * 检查当前用户是否为超级管理员
 */
export async function checkSuperAdminStatus(): Promise<boolean> {
  try {
    // 获取当前用户信息
    const userInfo = await getAuthingSession();
    if (!userInfo) {
      return false;
    }

    return isSuperAdmin(userInfo.sub);
  } catch (error) {
    console.error('检查超级管理员状态失败:', error);
    return false;
  }
}
