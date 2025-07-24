import { NextResponse, NextRequest } from 'next/server'
import { isPublicRoute, isApiRoute, isStaticAsset, SPECIAL_ROUTES, API_ROUTES } from '@/lib/routes.config'
import { parseJWTPayload, isTokenExpired, getTokenRemainingTime, formatTimeRemaining } from '../utils/jwt'
import { createUnauthorizedResponse } from '../utils/response'
import { shouldSkipRoute } from '../config'
import type { MiddlewareHandler, MiddlewareContext, AuthConfig, JWTPayload } from '../types'

/**
 * 认证处理器
 */
export class AuthHandler implements MiddlewareHandler {
  name = 'auth'
  
  constructor(private config: AuthConfig) {}

  async handle(context: MiddlewareContext): Promise<NextResponse | null> {
    const { request, pathname } = context
    
    // 跳过不需要认证的路由
    if (!this.config.enabled || this.shouldSkipAuth(pathname)) {
      return null // 继续下一个处理器
    }

    // 检查是否是公开路由
    if (isPublicRoute(pathname)) {
      return null
    }

    // 获取 token
    const token = this.extractToken(request)
    if (!token) {
      return createUnauthorizedResponse(request, SPECIAL_ROUTES.LOGIN)
    }

    // 验证 token
    try {
      const payload = parseJWTPayload(token)
      
      // 检查 token 是否过期
      if (isTokenExpired(payload)) {
        console.log(`🔒 JWT token 已过期，重定向到登录: ${pathname}`)
        return createUnauthorizedResponse(request, SPECIAL_ROUTES.LOGIN)
      }

      // 检查基本字段
      if (!payload.sub) {
        console.log(`🔒 JWT token 无效（缺少 sub），重定向到登录: ${pathname}`)
        return createUnauthorizedResponse(request, SPECIAL_ROUTES.LOGIN)
      }

      // 记录认证成功信息
      this.logAuthSuccess(payload, pathname)
      
      // 将用户信息添加到上下文中，供后续处理器使用
      ;(context as MiddlewareContext & { user: JWTPayload }).user = payload
      
      return null // 继续下一个处理器
    } catch (error) {
      return this.handleAuthError(error, request, pathname, token, context)
    }
  }

  /**
   * 检查是否应该跳过认证
   */
  private shouldSkipAuth(pathname: string): boolean {
    // 跳过静态资源
    if (shouldSkipRoute(pathname, this.config.skipRoutes) || isStaticAsset(pathname)) {
      return true
    }
    
    // 跳过公开的 API 路由（只有 check 接口是公开的）
    if (pathname === API_ROUTES.AUTH.CHECK) {
      return true
    }
    
    // 其他所有 API 路由都需要认证
    return false
  }

  /**
   * 提取 token
   */
  private extractToken(request: NextRequest): string | null {
    return (
      request.cookies.get(this.config.cookieName)?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      null
    )
  }

  /**
   * 记录认证成功信息
   */
  private logAuthSuccess(payload: JWTPayload, pathname: string): void {
    const remainingSeconds = getTokenRemainingTime(payload)
    const timeRemaining = formatTimeRemaining(remainingSeconds)
    
    console.log(`✅ JWT token 基本验证通过，允许访问: ${pathname}`)
    console.log(`⏰ 用户【${payload.sub}】的 Token 剩余有效期: ${timeRemaining}`)
  }

  /**
   * 处理认证错误
   */
  private handleAuthError(
    error: unknown,
    request: NextRequest,
    pathname: string,
    token: string,
    context: MiddlewareContext
  ): NextResponse {
    const errorMessage = error instanceof Error ? error.message : 'unknown error'
    console.log(`🔒 JWT token 格式验证失败，重定向到登录: ${pathname}， error: ${errorMessage}`)
    console.log(`🔒 JWT token : ${token}`)
    
    // 如果是移动端，记录更详细的信息
    if (context.isMobile) {
      const deviceType = context.isIOS ? 'iOS' : context.isAndroid ? 'Android' : '其他'
      console.log(`📱 移动端 JWT 解析失败，设备类型: ${deviceType}`)
      console.log(`📱 失败路径: ${pathname}`)
    }
    
    return createUnauthorizedResponse(request, SPECIAL_ROUTES.LOGIN)
  }
}

/**
 * 创建认证处理器
 */
export function createAuthHandler(config: AuthConfig): AuthHandler {
  return new AuthHandler(config)
}