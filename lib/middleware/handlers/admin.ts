import { NextResponse } from 'next/server'
import { isAdminRoute, SPECIAL_ROUTES } from '@/lib/routes.config'
import { createForbiddenResponse } from '../utils/response'
import type { MiddlewareHandler, MiddlewareContext, AdminConfig } from '../types'

/**
 * 管理员权限处理器
 */
export class AdminHandler implements MiddlewareHandler {
  name = 'admin'
  
  constructor(private config: AdminConfig) {}

  async handle(context: MiddlewareContext): Promise<NextResponse | null> {
    const { request, pathname } = context
    const user = context.user

    // 如果管理员功能未启用，跳过
    if (!this.config.enabled) {
      return null
    }

    // 检查是否访问管理员路由
    if (!isAdminRoute(pathname)) {
      return null // 不是管理员路由，继续下一个处理器
    }

    // 如果没有用户信息（认证失败），让认证处理器处理
    if (!user) {
      return null
    }

    // 检查管理员权限
    const userId = user.sub
    if (!this.isAdmin(userId)) {
      console.log(`🚫 用户【${userId}】尝试访问管理员路由但权限不足: ${pathname}`)
      return createForbiddenResponse(request, SPECIAL_ROUTES.DEFAULT_REDIRECT)
    }

    // 管理员权限验证通过
    console.log(`👑 管理员【${userId}】访问管理员路由: ${pathname}`)
    return null // 继续下一个处理器
  }

  /**
   * 检查用户是否为管理员
   */
  private isAdmin(userId: string): boolean {
    if (this.config.adminIds.length === 0) {
      console.log('⚠️ 未配置管理员ID列表')
      return false
    }
    
    const isAdminUser = this.config.adminIds.includes(userId)
    
    console.log(
      `🔍 管理员权限检查: 用户ID=${userId}, ` +
      `管理员列表=[${this.config.adminIds.join(', ')}], ` +
      `结果=${isAdminUser ? '是管理员' : '非管理员'}`
    )
    
    return isAdminUser
  }
}

/**
 * 创建管理员处理器
 */
export function createAdminHandler(config: AdminConfig): AdminHandler {
  return new AdminHandler(config)
}