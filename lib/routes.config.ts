/**
 * 路由配置文件
 * 统一管理应用中的路由权限和配置
 */

import { AUTHING_APP_HOST } from "./client-config"

// 公开路由（无需登录即可访问）
export const PUBLIC_ROUTES = [
  '/',           // 首页
  '/login',      // 登录页
] as const

// 受保护的路由（需要登录才能访问）
export const PROTECTED_ROUTES = [
  '/index',  // 索引页面
] as const

// 特殊路由配置
export const SPECIAL_ROUTES = {
  // 登录页面
  LOGIN: '/login',
  // 默认重定向页面（登录后）
  DEFAULT_REDIRECT: '/index',
  // 首页
  HOME: '/',
} as const

// API 路由配置
export const API_ROUTES = {
  // 认证相关 API
  AUTH: {
    SET_SESSION: '/api/auth/set-session',
    LOGOUT: '/api/auth/logout',
  },
} as const

// Authing 服务路由配置
export const AUTHING_ROUTES = {
  LOGOUT: `${AUTHING_APP_HOST}/oidc/session/end`,
} as const

/**
 * 检查路径是否为公开路由
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route =>
    pathname === route ||
    (route !== '/' && pathname.startsWith(route + '/'))
  )
}

/**
 * 检查路径是否为受保护路由
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )
}

/**
 * 检查路径是否为 API 路由
 */
export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

/**
 * 检查路径是否为静态资源
 */
export function isStaticAsset(pathname: string): boolean {
  return pathname.startsWith('/_next/') ||
    pathname.startsWith('/public/') ||
    pathname === '/favicon.ico' ||
    /\.(jpg|jpeg|png|gif|svg|ico|css|js)$/.test(pathname)
}

/**
 * 获取登录重定向 URL
 */
export function getLoginUrl(callbackUrl?: string): string {
  const loginUrl = new URL(SPECIAL_ROUTES.LOGIN,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  )

  if (callbackUrl) {
    loginUrl.searchParams.set('callbackUrl', callbackUrl)
  }

  return loginUrl.toString()
}

/**
 * 路由权限配置
 */
export const ROUTE_CONFIG = {
  // 公开路由
  public: PUBLIC_ROUTES,
  // 受保护路由
  protected: PROTECTED_ROUTES,
  // 特殊路由
  special: SPECIAL_ROUTES,
  // API 路由
  api: API_ROUTES,
  // 工具函数
  utils: {
    isPublicRoute,
    isProtectedRoute,
    isApiRoute,
    isStaticAsset,
    getLoginUrl,
  }
} as const

export const COOKIE_NAME = 'authjs.session-token' as const

export type PublicRoute = typeof PUBLIC_ROUTES[number]
export type ProtectedRoute = typeof PROTECTED_ROUTES[number]
export type SpecialRoute = typeof SPECIAL_ROUTES[keyof typeof SPECIAL_ROUTES] 