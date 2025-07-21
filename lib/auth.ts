import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { COOKIE_NAME } from '@/lib/routes.config'

import { AUTHING_APP_SECRET } from './server-config'

// 获取 Authing 密钥（HS256 对称加密）
function getAuthingSecret() {
  // HS256 使用字符串密钥，转换为 Uint8Array
  return new TextEncoder().encode(AUTHING_APP_SECRET)
}

export interface AuthingUser {
  sub: string
  email?: string
  name?: string
  nickname?: string
  picture?: string
  data?: {
    phone?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

/**
 * 从 cookies 中获取并验证 JWT token（Next.js 15 推荐方案）
 */
export async function getAuthingSession(): Promise<AuthingUser | null> {
  try {
    const cookieStore = await cookies()

    // 获取 JWT token
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) {
      return null
    }

    // 验证 JWT token
    return await validateJWTToken(token)

  } catch (error) {
    console.error('获取 JWT 会话失败:', error)
    return null
  }
}

/**
 * 从请求中获取 JWT token（Next.js 15 推荐方案）
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // 优先从 Authorization header 获取
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 从 cookies 获取 JWT token
  const token = request.cookies.get(COOKIE_NAME)?.value

  return token || null
}

/**
 * 验证 Authing JWT token 是否有效（使用 HS256 对称密钥验证签名）
 */
export async function validateJWTToken(token: string): Promise<AuthingUser | null> {
  if (!token) {
    return null
  }

  try {
    // 获取 Authing 密钥（HS256 对称加密）
    const secretKey = getAuthingSecret()

    // 使用密钥验证 JWT 签名和内容
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256']
    })
    console.log("🚀 ~ validateJWTToken ~ payload:", payload)

    // 验证基本字段
    if (!payload.sub) {
      console.error('JWT payload 缺少 sub 字段')
      return null
    }

    console.log('✅ Authing JWT token HS256 验证通过:', payload.sub)
    return payload as AuthingUser

  } catch (error) {
    const errorObj = error as { code?: string; message?: string }
    if (errorObj.code === 'ERR_JWT_EXPIRED') {
      console.log('JWT token 已过期')
    } else if (errorObj.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      console.error('JWT 签名验证失败')
    } else {
      console.error('JWT 验证失败:', errorObj.message || String(error))
    }
    return null
  }
}

/**
 * 检查用户是否已登录（用于服务器组件）
 */
export async function isAuthenticated(): Promise<{
  isLoggedIn: boolean;
  user: AuthingUser | null
}> {
  const user = await getAuthingSession()

  return {
    isLoggedIn: !!user,
    user
  }
}

/**
 * 检查请求是否来自已登录用户（用于 API 路由）
 */
export async function isRequestAuthenticated(request: NextRequest): Promise<{
  isLoggedIn: boolean;
  user: AuthingUser | null;
}> {
  const token = getTokenFromRequest(request)

  if (!token) {
    return { isLoggedIn: false, user: null }
  }

  const user = await validateJWTToken(token)

  return {
    isLoggedIn: !!user,
    user
  }
}

/**
 * 要求用户必须已登录（用于 API 路由）
 */
export async function requireAuth(request: NextRequest): Promise<AuthingUser> {
  const { isLoggedIn, user } = await isRequestAuthenticated(request)

  if (!isLoggedIn || !user) {
    throw new Error('未授权：需要登录')
  }

  return user
} 