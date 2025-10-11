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
  const originalPath = request.nextUrl.pathname
  const search = request.nextUrl.search
  
  console.log(`🔒 未授权访问，重定向到登录页: ${originalPath}`)
  
  // 构建登录 URL，并保存原始路径
  const loginUrl = new URL(loginPath, request.url)
  
  // 只有在原始路径不是登录相关路径时才保存
  if (originalPath !== loginPath && 
      originalPath !== '/callback' && 
      originalPath !== '/login' &&
      originalPath !== '/') {
    // 保存完整的原始路径（包括查询参数）
    const callbackUrl = originalPath + search
    loginUrl.searchParams.set('callbackUrl', callbackUrl)
    console.log(`🔗 保存回调 URL: ${callbackUrl}`)
  }
  
  return createRedirectResponse(request, loginUrl.toString())
}

/**
 * 创建权限不足响应
 */
export function createForbiddenResponse(request: NextRequest, redirectPath: string): NextResponse {
  console.log(`🚫 权限不足，重定向: ${request.nextUrl.pathname}`)
  return createRedirectResponse(request, redirectPath)
}