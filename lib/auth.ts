import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { COOKIE_NAME } from '@/lib/routes.config'

import { AUTHING_APP_SECRET } from './server-config'
import { getAdminIds } from './middleware/config'

// 获取 Authing 密钥（HS256 对称加密）
function getAuthingSecret() {
  // HS256 使用字符串密钥，转换为 Uint8Array
  return new TextEncoder().encode(AUTHING_APP_SECRET)
}

export interface AuthingUser {
  sub: string // Authing 用户ID
  dbUserId?: string // 数据库用户ID（从 authing_users 表查询得到）
  email?: string
  name?: string
  nickname?: string
  username?: string
  picture?: string
  photo?: string
  phone?: string
  phoneNumber?: string
  isAdmin?: boolean
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
 * 从中间件传递的请求头中获取用户信息
 */
export function getUserFromMiddleware(request: NextRequest): AuthingUser | null {
  try {
    const encodedUserInfo = request.headers.get('x-middleware-user')
    if (!encodedUserInfo) {
      return null
    }

    // 解码 Base64 编码的用户信息
    const userInfoJson = Buffer.from(encodedUserInfo, 'base64').toString('utf-8')
    const userInfo = JSON.parse(userInfoJson)

    // 验证基本字段
    if (!userInfo.sub) {
      console.error('中间件传递的用户信息缺少 sub 字段')
      return null
    }

    console.log('✅ 从中间件获取用户信息:', userInfo.sub)
    return userInfo as AuthingUser

  } catch (error) {
    console.error('❌ 解析中间件用户信息失败:', error)
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
 * 优先使用中间件传递的用户信息，避免重复验证
 */
export async function isRequestAuthenticated(request: NextRequest): Promise<{
  isLoggedIn: boolean;
  user: AuthingUser | null;
}> {
  // 优先尝试从中间件获取已验证的用户信息
  const middlewareUser = getUserFromMiddleware(request)
  const adminIds = getAdminIds()
  if (middlewareUser) {
    return { isLoggedIn: true, user: { ...middlewareUser, isAdmin: adminIds.includes(middlewareUser?.sub || '') } }
  }

  // 如果中间件没有传递用户信息，回退到传统的 token 验证
  // 这种情况可能发生在直接调用 API 或中间件被跳过的情况下
  console.log('⚠️ 未从中间件获取到用户信息，回退到 token 验证')

  const token = getTokenFromRequest(request)
  if (!token) {
    return { isLoggedIn: false, user: null }
  }

  const user = await validateJWTToken(token)
  return {
    isLoggedIn: !!user,
    user: user ? { ...user, isAdmin: adminIds.includes(user.sub) } : null
  }
}

/**
 * 要求用户必须已登录（用于 API 路由）
 * 会自动查询并添加数据库用户ID
 * 如果用户不存在于数据库，会自动创建用户记录（兼容历史数据）
 * 
 * 🚀 优化：优先使用中间件预查询的 dbUserId，减少数据库查询
 */
export async function requireAuth(request: NextRequest): Promise<AuthingUser> {
  const { isLoggedIn, user } = await isRequestAuthenticated(request)

  if (!isLoggedIn || !user) {
    throw new Error('未授权：需要登录')
  }

  // 从 authing_users 表查询对应的数据库用户ID
  // 🚀 优化：如果中间件已经预查询了 dbUserId，则跳过此步骤
  if (user.dbUserId) {
    console.log('🚀 使用中间件预查询的 dbUserId，跳过数据库查询:', user.sub, '->', user.dbUserId)
  } else if (!user.dbUserId) {
    try {
      const { db, withDatabaseRetry } = await import('@/lib/db')
      
      // 使用重试机制查询用户映射
      const authingUser = await withDatabaseRetry(
        () => db.authingUser.findUnique({
          where: { authingId: user.sub },
          select: { userId: true }
        }),
        '查询用户映射'
      )

      if (authingUser) {
        user.dbUserId = authingUser.userId
        console.log('✅ API层查询 dbUserId:', user.sub, '->', user.dbUserId)
      } else {
        // 🆕 未找到映射，自动创建用户（兼容历史用户和新用户）
        console.warn('⚠️ 未找到 Authing ID 对应的数据库用户，尝试自动创建:', user.sub)
        
        const { loginOrRegister } = await import('@/lib/services/user.service')
        const { getAdminIds } = await import('@/lib/middleware/config')
        
        const adminIds = getAdminIds()
        const isAdmin = adminIds.includes(user.sub)
        
        // 构建用户显示名称（使用多个字段作为后备）
        const displayName = user.name 
          || user.nickname 
          || user.username 
          || (user.email ? user.email.split('@')[0] : undefined)
          || `用户${user.sub.substring(0, 8)}`

        const nickname = user.nickname 
          || user.name 
          || user.username 
          || (user.email ? user.email.split('@')[0] : undefined)
        
        // 使用重试机制创建用户
        const newUser = await withDatabaseRetry(
          () => loginOrRegister({
            authingId: user.sub,
            name: displayName,
            nickname: nickname,
            email: user.email,
            avatar: typeof user.picture === 'string' ? user.picture : undefined,
            isAdmin,
          }),
          '创建用户'
        )
        
        user.dbUserId = newUser.id
        console.log('✅ 自动创建用户成功:', user.sub, '->', user.dbUserId)
      }
    } catch (error) {
      console.error('❌ 处理数据库用户ID失败:', error)
      // 抛出更友好的错误信息
      throw new Error('用户信息同步失败，请稍后重试')
    }
  }

  // 确保 dbUserId 存在后才返回
  if (!user.dbUserId) {
    throw new Error('用户信息异常，请重新登录')
  }

  return user
} 