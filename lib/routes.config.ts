/**
 * 路由配置文件
 * 统一管理应用中的路由权限和配置
 */

import { AUTHING_APP_HOST } from "./client-config"
import { getCurrentOrigin } from "./utils"

// 公开路由（无需登录即可访问）
export const PUBLIC_ROUTES = [
  '/',           // 首页
  '/login',      // 登录页
  '/callback',    // 登录回调页
  '/images',
  '/api/auth/set-session', // 设置会话接口（登录过程中调用）
  '/api/auth/check',       // 检查认证状态接口（需要在未认证时也能访问）
  '/api/auth/logout',      // 登出接口（需要在任何时候都能访问）
  '/api/admin/settings/dictionary/key', // 获取字典值接口（首页倒计时组件需要访问）
] as const

// 受保护的路由（需要登录才能访问）
export const PROTECTED_ROUTES = [
  '/home',  // 活动内容页
  '/map',   // 地图探索页
  '/exchange-rate',  // 游戏币兑换汇率页
  '/leaderboard',  // 游戏币排行榜页
] as const

// 管理员路由（需要管理员权限才能访问）
export const ADMIN_ROUTES = [
  '/settings',
  '/admin-panel',
] as const

// 特殊路由配置
export const SPECIAL_ROUTES = {
  // 登录页面
  LOGIN: '/login',
  // 默认重定向页面（登录后）
  DEFAULT_REDIRECT: '/home',
  // 首页（登录前）
  DEFAULT_HOME: '/',
  SETTING: '/settings', // 管理员设置页面
  ADMIN_PANEL: '/admin-panel', // 管理员操作面板
  MAP: '/map',         // 地图探索页面
  TIMELINE: '/timeline', // 时间线页面
  EXCHANGE_RATE: '/exchange-rate', // 游戏币兑换汇率页面
  LEADERBOARD: '/leaderboard', // 游戏币排行榜页面
} as const

// API 路由配置
export const API_ROUTES = {
  // 认证相关 API
  AUTH: {
    SET_SESSION: '/api/auth/set-session',
    LOGOUT: '/api/auth/logout',
    CHECK: '/api/auth/check',
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
 * 检查路径是否为管理员路由
 */
export function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )
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
  const origin = getCurrentOrigin()
  const loginUrl = new URL(SPECIAL_ROUTES.LOGIN, origin)

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
  // 管理员路由
  admin: ADMIN_ROUTES,
  // 工具函数
  utils: {
    isPublicRoute,
    isProtectedRoute,
    isApiRoute,
    isAdminRoute,
    isStaticAsset,
    getLoginUrl,
  }
} as const

export const COOKIE_NAME = 'authjs.session-token' as const

export type PublicRoute = typeof PUBLIC_ROUTES[number]
export type ProtectedRoute = typeof PROTECTED_ROUTES[number]
export type AdminRoute = typeof ADMIN_ROUTES[number]
export type SpecialRoute = typeof SPECIAL_ROUTES[keyof typeof SPECIAL_ROUTES]