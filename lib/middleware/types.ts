import type { NextRequest, NextResponse } from 'next/server'

/**
 * 中间件执行上下文
 */
export interface MiddlewareContext {
  request: NextRequest
  pathname: string
  userAgent: string
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
  user?: JWTPayload // 添加用户信息字段
}

/**
 * 中间件处理器接口
 */
export interface MiddlewareHandler {
  name: string
  handle(context: MiddlewareContext): Promise<NextResponse | null>
}

/**
 * 中间件配置接口
 */
export interface MiddlewareConfig {
  auth: AuthConfig
  admin: AdminConfig
  logger: LoggerConfig
}

/**
 * 认证配置
 */
export interface AuthConfig {
  enabled: boolean
  cookieName: string
  skipRoutes: string[]
}

/**
 * 管理员配置
 */
export interface AdminConfig {
  enabled: boolean
  adminIds: string[]
  routes: string[]
}

/**
 * 日志配置
 */
export interface LoggerConfig {
  enabled: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  logMobile: boolean
}

/**
 * JWT Payload 接口
 */
export interface JWTPayload {
  sub: string
  exp?: number
  [key: string]: unknown
}

/**
 * 处理器结果类型
 */
export type HandlerResult = NextResponse | null