import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  isPublicRoute,
  isApiRoute,
  isStaticAsset,
  SPECIAL_ROUTES,
  COOKIE_NAME
} from '@/lib/routes.config'

// 将剩余秒数转换为人类可读格式
function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '已过期'

  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)
  const secs = seconds % 60

  const parts = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分钟`)
  if (secs > 0 && parts.length === 0) parts.push(`${secs}秒`)

  return parts.length > 0 ? parts.join('') : '少于1分钟'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 跳过 API 路由和静态资源
  if (isApiRoute(pathname) || isStaticAsset(pathname)) {
    return NextResponse.next()
  }

  // 检查是否是公开路由
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // 对于其他受保护的路由，验证 Authing JWT token（Next.js 15 推荐方案）
  const token = request.cookies.get(COOKIE_NAME)?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    // 没有 token，重定向到登录页
    console.log(`🔒 未授权访问受保护路由: ${pathname}`)
    return NextResponse.redirect(new URL(SPECIAL_ROUTES.LOGIN, request.url))
  }

  // 在中间件中进行轻量级 JWT 检查（完整签名验证在页面组件中进行）
  try {
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      throw new Error('Invalid JWT format')
    }

    const payload = JSON.parse(atob(tokenParts[1]))
    const now = Math.floor(Date.now() / 1000)

    // 检查 token 是否过期
    if (payload.exp && now >= payload.exp) {
      console.log(`🔒 JWT token 已过期，重定向到登录: ${pathname}`)
      return NextResponse.redirect(new URL(SPECIAL_ROUTES.LOGIN, request.url))
    }

    // 检查基本字段
    if (!payload.sub) {
      console.log(`🔒 JWT token 无效（缺少 sub），重定向到登录: ${pathname}`)
      return NextResponse.redirect(new URL(SPECIAL_ROUTES.LOGIN, request.url))
    }

    // 计算 token 剩余有效时间
    const remainingSeconds = payload.exp ? payload.exp - now : 0
    const timeRemaining = formatTimeRemaining(remainingSeconds)

    console.log(`✅ JWT token 基本验证通过，允许访问: ${pathname}`)
    console.log(`⏰ 用户【${payload.sub}】的 Token 剩余有效期: ${timeRemaining}`)
    // 注意：完整的签名验证将在页面组件中使用密钥进行
  } catch (error) {
    console.log(`🔒 JWT token 格式验证失败，重定向到登录: ${pathname}`)
    return NextResponse.redirect(new URL(SPECIAL_ROUTES.LOGIN, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 