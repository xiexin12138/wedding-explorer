import { Guard } from '@authing/guard-react18'
import { AUTHING_APP_ID, AUTHING_APP_HOST } from '../client-config'
import { getCurrentOrigin } from '../utils'

// 获取回调 URL
function getRedirectUri(): string {
  const origin = getCurrentOrigin()
  const redirectUri = `${origin}/callback`
  console.log(`🔗 设置 Authing 回调 URL: ${redirectUri}`)
  return redirectUri
}

const config = {
  appId: AUTHING_APP_ID || '',
  // 配置托管页相关设置
  host: AUTHING_APP_HOST,
  // 设置回调 URL
  redirectUri: getRedirectUri(),
}

export const guard = new Guard(config)