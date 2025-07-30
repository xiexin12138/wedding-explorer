'use client'
import { Guard } from '@authing/guard-react18'
import { AUTHING_APP_ID, AUTHING_APP_HOST } from '../client-config'

// 获取回调 URL（客户端环境）
function getRedirectUri(): string {
  // 在客户端环境中，使用当前域名
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin
    const redirectUri = `${origin}/callback`
    console.log(`🔗 设置 Authing 回调 URL: ${redirectUri}`)
    return redirectUri
  }

  // 服务端环境或备用方案
  return '/callback'
}

function createGuardConfig() {
  const config = {
    appId: AUTHING_APP_ID || '',
    // 设置回调 URL， 在控制台配置多个默认返回第一个，除非这里指定要哪个
    redirectUri: getRedirectUri() || '',
  }

  // 配置托管页相关设置
  if (AUTHING_APP_HOST) {
    (config as { host?: string }).host = AUTHING_APP_HOST
  }

  console.log('🔧 Authing 配置:', config)
  return config
}

// 延迟初始化 Guard 实例，只在客户端环境中创建
let guardInstance: Guard | null = null

export const guard = new Proxy({} as Guard, {
  get(target, prop: keyof Guard) {
    // 确保只在客户端环境中初始化 Guard
    if (typeof window === 'undefined') {
      throw new Error('Guard 只能在客户端环境中使用')
    }
    
    if (!guardInstance) {
      guardInstance = new Guard(createGuardConfig())
    }
    
    const value = guardInstance[prop]
    return typeof value === 'function' ? value.bind(guardInstance) : value
  }
})