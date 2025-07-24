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
     * 匹配所有路径除了：
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - 静态资源文件
     * 
     * 注意：API 路由也会被中间件处理，但认证相关的 API 路由会被跳过
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
}