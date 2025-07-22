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

// URL 安全的 Base64 解码函数 - 增强版，支持移动端
function base64UrlDecode(str: string): string {
  try {
    // 方法1：标准 URL 安全 Base64 解码
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    
    // 添加必要的填充
    while (base64.length % 4) {
      base64 += '='
    }
    
    // 尝试标准解码
    try {
      return atob(base64)
    } catch (error) {
      console.log('⚠️ 标准 Base64 解码失败，尝试备用方法:', error)
      
      // 方法2：处理可能的编码问题
      // 移除所有可能的填充字符
      base64 = base64.replace(/=/g, '')
      
      // 重新添加填充
      while (base64.length % 4) {
        base64 += '='
      }
      
      return atob(base64)
    }
  } catch (error) {
    // 方法3：最后的备用方案 - 手动解码
    console.log('⚠️ 备用 Base64 解码也失败，尝试手动解码')
    return manualBase64Decode(str)
  }
}

// 手动 Base64 解码函数（备用方案）
function manualBase64Decode(str: string): string {
  try {
    // Base64 字符集
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    const base64UrlChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    
    // 将 URL 安全字符转换为标准 Base64 字符
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    
    // 添加填充
    while (base64.length % 4) {
      base64 += '='
    }
    
    // 手动解码
    let result = ''
    let i = 0
    while (i < base64.length) {
      const chunk = base64.slice(i, i + 4)
      const bits = chunk.split('').map(char => {
        const index = base64Chars.indexOf(char)
        return index >= 0 ? index.toString(2).padStart(6, '0') : '000000'
      }).join('')
      
      // 提取字节
      for (let j = 0; j < bits.length; j += 8) {
        const byte = bits.slice(j, j + 8)
        if (byte.length === 8) {
          result += String.fromCharCode(parseInt(byte, 2))
        }
      }
      
      i += 4
    }
    
    return result
  } catch (error) {
    throw new Error(`手动 Base64 解码失败: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

// 安全的 JWT payload 解析函数 - 增强版
function parseJWTPayload(token: string): Record<string, unknown> {
  try {
    // 记录 token 的基本信息（不包含敏感数据）
    console.log(`🔍 开始解析 JWT token，长度: ${token.length}`)
    
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      throw new Error(`JWT token 格式无效：包含 ${tokenParts.length} 个部分，需要 3 个部分`)
    }

    const payloadBase64 = tokenParts[1]
    console.log(`🔍 JWT payload Base64 长度: ${payloadBase64.length}`)
    
    // 尝试解析 payload
    const payloadString = base64UrlDecode(payloadBase64)
    console.log(`🔍 JWT payload 解码成功，长度: ${payloadString.length}`)
    
    const payload = JSON.parse(payloadString)
    console.log(`✅ JWT payload 解析成功，包含字段: ${Object.keys(payload).join(', ')}`)
    
    return payload
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'unknown error'
    console.error(`❌ JWT payload 解析失败: ${errorMessage}`)
    console.error(`❌ Token 前20个字符: ${token.substring(0, 20)}...`)
    throw new Error(`JWT payload 解析失败: ${errorMessage}`)
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检测用户代理，用于诊断移动端问题
  const userAgent = request.headers.get('user-agent') || ''
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
  const isAndroid = /Android/i.test(userAgent)
  
  if (isMobile) {
    console.log(`📱 移动端访问检测: ${isIOS ? 'iOS' : isAndroid ? 'Android' : '其他移动设备'}`)
    console.log(`📱 User-Agent: ${userAgent.substring(0, 100)}...`)
  }

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
    const payload = parseJWTPayload(token)
    const now = Math.floor(Date.now() / 1000)

    // 检查 token 是否过期
    if (payload.exp && now >= (payload.exp as number)) {
      console.log(`🔒 JWT token 已过期，重定向到登录: ${pathname}`)
      return NextResponse.redirect(new URL(SPECIAL_ROUTES.LOGIN, request.url))
    }

    // 检查基本字段
    if (!payload.sub) {
      console.log(`🔒 JWT token 无效（缺少 sub），重定向到登录: ${pathname}`)
      return NextResponse.redirect(new URL(SPECIAL_ROUTES.LOGIN, request.url))
    }

    // 计算 token 剩余有效时间
    const remainingSeconds = payload.exp ? (payload.exp as number) - now : 0
    const timeRemaining = formatTimeRemaining(remainingSeconds)

    console.log(`✅ JWT token 基本验证通过，允许访问: ${pathname}`)
    console.log(`⏰ 用户【${payload.sub as string}】的 Token 剩余有效期: ${timeRemaining}`)
    // 注意：完整的签名验证将在页面组件中使用密钥进行
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'unknown error'
    console.log(`🔒 JWT token 格式验证失败，重定向到登录: ${pathname}， error: ${errorMessage}`)
    console.log(`🔒 JWT token : ${token}`)
    
    // 如果是移动端，记录更详细的信息
    if (isMobile) {
      console.log(`📱 移动端 JWT 解析失败，设备类型: ${isIOS ? 'iOS' : isAndroid ? 'Android' : '其他'}`)
      console.log(`📱 失败路径: ${pathname}`)
    }
    
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