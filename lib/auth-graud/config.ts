import { Guard } from '@authing/guard-react18'
import { AUTHING_APP_ID, AUTHING_APP_HOST } from '../client-config'

export const guard = new Guard({
  appId: AUTHING_APP_ID || '',
  // 配置托管页相关设置
  host: AUTHING_APP_HOST,
})