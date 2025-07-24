/**
 * 设备检测工具函数
 */

/**
 * 检测是否为移动设备
 */
export function isMobileDevice(userAgent: string): boolean {
  return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
}

/**
 * 检测是否为 iOS 设备
 */
export function isIOSDevice(userAgent: string): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent)
}

/**
 * 检测是否为 Android 设备
 */
export function isAndroidDevice(userAgent: string): boolean {
  return /Android/i.test(userAgent)
}

/**
 * 获取设备类型描述
 */
export function getDeviceType(userAgent: string): string {
  if (isIOSDevice(userAgent)) return 'iOS'
  if (isAndroidDevice(userAgent)) return 'Android'
  if (isMobileDevice(userAgent)) return '其他移动设备'
  return '桌面设备'
}

/**
 * 记录设备信息
 */
export function logDeviceInfo(userAgent: string): void {
  const isMobile = isMobileDevice(userAgent)
  
  if (isMobile) {
    const deviceType = getDeviceType(userAgent)
    console.log(`📱 移动端访问检测: ${deviceType}`)
    console.log(`📱 User-Agent: ${userAgent.substring(0, 100)}...`)
  }
}