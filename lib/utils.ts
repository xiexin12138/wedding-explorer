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
