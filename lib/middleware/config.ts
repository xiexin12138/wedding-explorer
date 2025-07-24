import { COOKIE_NAME } from '@/lib/routes.config'
import type { MiddlewareConfig } from './types'

/**
 * 获取中间件配置
 */
export function getMiddlewareConfig(): MiddlewareConfig {
  return {
    auth: {
      enabled: true,
      cookieName: COOKIE_NAME,
      skipRoutes: ['/api', '/_next', '/favicon.ico', '/public']
    },
    admin: {
      enabled: true,
      adminIds: getAdminIds(),
      routes: ['/admin']
    },
    logger: {
      enabled: true,
      logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      logMobile: true
    }
  }
}

/**
 * 获取管理员ID列表
 */
export function getAdminIds(): string[] {
  const adminIds = process.env.AUTHING_ADMIN_ID
  if (!adminIds) {
    console.warn('⚠️ 未配置管理员ID列表 (AUTHING_ADMIN_ID)')
    return []
  }
  return adminIds.split(',').map(id => id.trim()).filter(Boolean)
}

/**
 * 检查是否应该跳过处理
 */
export function shouldSkipRoute(pathname: string, skipRoutes: string[]): boolean {
  return skipRoutes.some(route => pathname.startsWith(route))
}