import { UAParser } from "ua-parser-js";

// 平台信息接口
export interface PlatformInfo {
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  device: string;
  isMobile: boolean;
}

// 环境信息接口
export interface EnvironmentInfo {
  // 微信系列
  isWeChat: boolean;
  isWeChatWork: boolean;
  isWeChatMiniProgram: boolean;
  
  // QQ系列
  isQQ: boolean;
  isQQBrowser: boolean;
  
  // 字节跳动系列
  isToutiao: boolean;
  isDouyin: boolean;
  
  // 支付宝
  isAlipay: boolean;
  
  // 其他常见应用
  isBaidu: boolean;
  isUC: boolean;
  isSogou: boolean;
  
  // 操作系统检测
  isIOS: boolean;
  isAndroid: boolean;
  isHarmonyOS: boolean;
  
  // 是否在应用内浏览器
  isInApp: boolean;
}

// 环境检测结果接口
export interface DetectionResult {
  platform: PlatformInfo;
  environment: EnvironmentInfo;
}

/**
 * 环境检测函数 - 使用 ua-parser-js 进行专业检测
 * 支持检测中国大陆常见的应用内浏览器环境
 * @returns {DetectionResult} 包含平台信息和环境信息的检测结果
 */
export function detectEnvironment(): DetectionResult {
  const parser = new UAParser();
  const result = parser.getResult();
  const userAgent = navigator.userAgent.toLowerCase();
  
  // 基础平台信息
  const platform: PlatformInfo = {
    os: result.os.name || 'unknown',
    osVersion: result.os.version || 'unknown',
    browser: result.browser.name || 'unknown',
    browserVersion: result.browser.version || 'unknown',
    device: result.device.type || 'desktop',
    isMobile: result.device.type === 'mobile' || result.device.type === 'tablet'
  };
  
  // 中国特色环境检测
  const environment: EnvironmentInfo = {
    // 微信系列
    isWeChat: /micromessenger/i.test(userAgent),
    isWeChatWork: /wxwork/i.test(userAgent),
    isWeChatMiniProgram: /miniprogram/i.test(userAgent),
    
    // QQ系列
    isQQ: /\sqq/i.test(userAgent),
    isQQBrowser: /qqbrowser/i.test(userAgent),
    
    // 字节跳动系列
    isToutiao: /toutiaomicroapp/i.test(userAgent),
    isDouyin: /aweme/i.test(userAgent),
    
    // 支付宝
    isAlipay: /alipayclient/i.test(userAgent),
    
    // 其他常见应用
    isBaidu: /baiduboxapp/i.test(userAgent),
    isUC: /ucbrowser/i.test(userAgent),
    isSogou: /sogou/i.test(userAgent),
    
    // 操作系统检测
    isIOS: platform.os === 'iOS',
    isAndroid: platform.os === 'Android',
    isHarmonyOS: /harmonyos/i.test(userAgent),
    
    // 是否在应用内浏览器
    isInApp: false
  };
  
  // 判断是否在应用内浏览器
  environment.isInApp = environment.isWeChat || environment.isWeChatWork || 
                       environment.isQQ || environment.isQQBrowser ||
                       environment.isToutiao || environment.isDouyin ||
                       environment.isAlipay || environment.isBaidu;
  
  return { platform, environment };
}

/**
 * 获取推荐的地图服务商
 * 根据当前环境推荐最适合的地图服务
 * @param environment 环境信息
 * @returns 推荐的地图类型
 */
export function getRecommendedMapProvider(environment: EnvironmentInfo): 'amap' | 'baidu' | 'tencent' {
  // QQ环境优先推荐腾讯地图
  if (environment.isQQ || environment.isQQBrowser) {
    return 'tencent';
  }
  
  // 百度系应用优先推荐百度地图
  if (environment.isBaidu) {
    return 'baidu';
  }
  
  // 默认推荐高德地图（市场占有率高，兼容性好）
  return 'amap';
}

/**
 * 判断是否支持App唤起
 * 某些环境限制第三方App的唤起
 * @param environment 环境信息
 * @returns 是否支持App唤起
 */
export function supportsAppLaunch(environment: EnvironmentInfo): boolean {
  // 微信环境限制第三方App唤起
  if (environment.isWeChat || environment.isWeChatWork) {
    return false;
  }
  
  // 其他环境通常支持App唤起
  return true;
}