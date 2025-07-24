import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 创建重定向响应
 */
export function createRedirectResponse(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url))
}

/**
 * 创建继续处理的响应
 */
export function createNextResponse(): NextResponse {
  return NextResponse.next()
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