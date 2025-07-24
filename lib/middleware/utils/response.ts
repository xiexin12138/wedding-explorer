import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 创建重定向响应
 */
export function createRedirectResponse(request: NextRequest, path: string): NextResponse {
  const response = NextResponse.redirect(new URL(path, request.url))
  
  // 添加缓存控制头，确保重定向不被缓存
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}

/**
 * 创建继续处理的响应
 */
export function createNextResponse(): NextResponse {
  const response = NextResponse.next()
  
  // 添加缓存控制头，确保中间件响应不被缓存
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}

/**
 * 创建未授权响应
 */
export function createUnauthorizedResponse(request: NextRequest, loginPath: string): NextResponse {
  console.log(`🔒 未授权访问，重定向到登录页: ${request.nextUrl.pathname}`)
  return createRedirectResponse(request, loginPath)
}

/**
 * 创建权限不足响应
 */
export function createForbiddenResponse(request: NextRequest, redirectPath: string): NextResponse {
  console.log(`🚫 权限不足，重定向: ${request.nextUrl.pathname}`)
  return createRedirectResponse(request, redirectPath)
}