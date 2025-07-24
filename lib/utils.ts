import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 获取当前域名，兼容微信 WebView 等特殊环境
 * 支持多域名部署场景
 */
export function getCurrentOrigin(): string {
  // 方法1：尝试从 window.location 获取（客户端环境）
  if (typeof window !== 'undefined' && window.location) {
    try {
      const origin = window.location.origin
      // 检查是否是有效的域名（不是 localhost 或 127.0.0.1）
      if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        console.log(`🌐 从 window.location.origin 获取域名: ${origin}`)
        return origin
      }
    } catch (error) {
      console.warn('⚠️ 无法从 window.location.origin 获取域名:', error)
    }
  }

  // 方法2：尝试从 window.location.href 构建（客户端环境）
  if (typeof window !== 'undefined' && window.location.href) {
    try {
      const url = new URL(window.location.href)
      const origin = `${url.protocol}//${url.host}`
      if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        console.log(`🌐 从 window.location.href 构建域名: ${origin}`)
        return origin
      }
    } catch (error) {
      console.warn('⚠️ 无法从 window.location.href 构建域名:', error)
    }
  }

  // 方法3：服务端环境 - 使用环境变量或默认值
  if (typeof window === 'undefined') {
    // 检查是否有环境变量设置
    const envOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    
    if (envOrigin) {
      // 确保协议正确
      const origin = envOrigin.startsWith('http') ? envOrigin : `https://${envOrigin}`
      console.log(`🌐 从环境变量获取域名: ${origin}`)
      return origin
    }
    
    // 开发环境默认值
    console.log(`🌐 开发环境，使用默认域名`)
    return 'http://localhost:3000'
  }

  // 方法4：最后的备用方案
  console.warn('⚠️ 无法获取有效域名，使用默认值')
  return 'http://localhost:3000'
}

/**
 * 为 API 路由设置无缓存响应头
 * 确保 API 响应不被浏览器或 CDN 缓存
 */
export function setNoCacheHeaders(response: Response): Response {
  // 使用更强制性的无缓存头
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0, private')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Surrogate-Control', 'no-store')
  
  // 添加额外的缓存控制头
  response.headers.set('CDN-Cache-Control', 'no-cache')
  response.headers.set('Cloudflare-CDN-Cache-Control', 'no-cache')
  
  return response
}

/**
 * 为认证相关的 API 路由设置额外的安全响应头
 */
export function setAuthApiHeaders(response: Response): Response {
  // 设置无缓存头
  setNoCacheHeaders(response)
  
  // 添加额外的安全头
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // 确保不被任何缓存层缓存
  response.headers.set('Vary', 'Authorization, Cookie')
  
  return response
}

/**
 * 检查是否为 API 路由
 */
export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

/**
 * 检查是否为认证相关的 API 路由
 */
export function isAuthApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/auth/')
}
