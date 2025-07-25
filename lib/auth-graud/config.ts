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

const config = {
  appId: AUTHING_APP_ID || '',
  // 配置托管页相关设置
  host: AUTHING_APP_HOST,
  // 设置回调 URL
  redirectUri: getRedirectUri(),
}

console.log('🔧 Authing 配置:', config)

export const guard = new Guard(config)