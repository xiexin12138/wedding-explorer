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
    /*
     * 匹配需要中间件处理的路径：
     * - 所有页面路由
     * - 所有 API 路由
     * 
     * 静态资源会自动被 Next.js 跳过
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}