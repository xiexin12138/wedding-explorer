import type { NextRequest } from 'next/server'
import { executeMiddleware } from '@/lib/middleware'

/**
 * Next.js 中间件入口函数
 * 
 * 使用新的模块化架构，通过责任链模式处理请求
 * 支持认证、权限验证、日志记录等功能
 */
export function middleware(request: NextRequest) {
  return executeMiddleware(request)
}

export const config = {
  matcher: [
    // 包含认证相关的 API 路由
    '/api/auth/:path*',
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