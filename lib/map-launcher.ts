import { EnvironmentInfo } from './environment-detector';
import gcoord from 'gcoord';

// 地图类型
export type MapType = 'amap' | 'baidu' | 'tencent';

// 地图配置接口
interface MapConfig {
  appUrl: string;
  webUrl: string;
}

// 地图配置生成器
interface MapConfigGenerator {
  (lng: number, lat: number, name: string, environment: EnvironmentInfo): MapConfig;
}

/**
 * 使用gcoord进行坐标转换：GCJ-02 转 BD-09
 * @param lng 经度
 * @param lat 纬度
 * @returns 转换后的坐标 [经度, 纬度]
 */
function gcj02ToBd09(lng: number, lat: number): [number, number] {
  return gcoord.transform([lng, lat], gcoord.GCJ02, gcoord.BD09) as [number, number];
}

/**
 * 高德地图配置生成器
 */
const generateAmapConfig: MapConfigGenerator = (lng, lat, name, environment) => {
  return {
    // iOS使用iosamap://，Android和鸿蒙使用amapuri://
    appUrl: environment.isIOS 
      ? `iosamap://path?sourceApplication=wedding-explorer&dlat=${lat}&dlon=${lng}&dname=${name}&dev=0&t=0`
      : `amapuri://route/plan/?dlat=${lat}&dlon=${lng}&dname=${name}&dev=0&t=0&sourceApplication=wedding-explorer`,
    webUrl: `https://uri.amap.com/marker?position=${lng},${lat}&name=${name}&src=wedding-explorer`
  };
};

/**
 * 百度地图配置生成器
 * 根据百度地图官方文档重写，支持Android、iOS、鸿蒙平台
 */
const generateBaiduConfig: MapConfigGenerator = (lng, lat, name, environment) => {
  // 百度地图需要从GCJ-02转换为BD-09坐标系
  const [finalLng, finalLat] = gcj02ToBd09(lng, lat);
  
  // 统一的src参数，用于统计
  const srcParam = 'wedding-explorer';
  
  let appUrl: string;
  
  if (environment.isIOS) {
    // iOS平台：使用baidumap://协议
    // 参考文档：https://lbs.baidu.com/faq/api?title=webapi/uri/ios
    // 格式：baidumap://map/marker?location=lat,lng&title=标题&content=内容&src=来源
    appUrl = `baidumap://map/marker?location=${finalLat},${finalLng}&title=${name}&content=${name}&coord_type=bd09ll&src=${srcParam}`;
  } else if (environment.isHarmonyOS) {
    // 鸿蒙平台：使用baidumap://协议
    // 参考文档：https://lbs.baidu.com/faq/api?title=webapi/uri/harmony
    // 格式：baidumap://map/marker?location=lat,lng&title=标题&content=内容&coord_type=坐标类型
    appUrl = `baidumap://map/marker?location=${finalLat},${finalLng}&title=${name}&content=${name}&coord_type=bd09ll`;
  } else {
    // Android平台：使用baidumap://协议（新版）或bdapp://协议（兼容）
    // 参考文档：https://lbs.baidu.com/faq/api?title=webapi/uri/andriod
    // 优先使用新版baidumap://协议，格式：baidumap://map/marker?location=lat,lng&title=标题&content=内容&coord_type=坐标类型&src=来源
    appUrl = `baidumap://map/marker?location=${finalLat},${finalLng}&title=${name}&content=${name}&coord_type=bd09ll&src=${srcParam}`;
  }
  
  return {
    appUrl,
    // 网页版百度地图
    webUrl: `http://api.map.baidu.com/marker?location=${finalLat},${finalLng}&title=${name}&content=${name}&output=html&src=${srcParam}`
  };
};

/**
 * 腾讯地图配置生成器
 */
const generateTencentConfig: MapConfigGenerator = (lng, lat, name, _environment) => {
  return {
    // 统一使用qqmap://格式，支持所有平台
    appUrl: `qqmap://map/routeplan?type=drive&to=${name}&tocoord=${lat},${lng}&referer=wedding-explorer`,
    webUrl: `https://apis.map.qq.com/uri/v1/marker?marker=coord:${lat},${lng};title:${name}&referer=wedding-explorer`
  };
};

// 地图配置生成器映射
const mapConfigGenerators: Record<MapType, MapConfigGenerator> = {
  amap: generateAmapConfig,
  baidu: generateBaiduConfig,
  tencent: generateTencentConfig
};

/**
 * App唤起方法
 * 针对iOS Safari浏览器的特殊处理：
 * - iOS 9+ Safari中iframe方式无法成功唤起App
 * - 需要使用window.location.href方式
 * - 其他浏览器继续使用iframe方式以避免页面跳转
 * @param config 地图配置
 */
function tryLaunchApp(config: MapConfig): void {
  // 获取用户代理字符串
  const userAgent = navigator.userAgent.toLowerCase();
  // 检测是否是iOS Safari浏览器（排除其他iOS浏览器如Chrome、Firefox等）
  const isIOSSafari = /iphone|ipad|ipod/.test(userAgent) && 
                     /safari/.test(userAgent) && 
                     !/crios/.test(userAgent) && // 排除Chrome on iOS
                     !/fxios/.test(userAgent) && // 排除Firefox on iOS
                     !/edgios/.test(userAgent); // 排除Edge on iOS
  
  // 设置定时器检测是否成功唤起App
  const timer = setTimeout(() => {
    // 如果2秒后还在当前页面，说明App唤起失败，跳转到网页版
    window.open(config.webUrl, '_blank');
  }, 2000);
  
  // 监听页面失焦事件，如果App成功唤起，页面会失焦
  const handleBlur = () => {
    clearTimeout(timer);
    window.removeEventListener('blur', handleBlur);
  };
  window.addEventListener('blur', handleBlur);
  
  // 对于iOS Safari浏览器，使用location.href方式唤起应用
  // 对于其他浏览器，使用iframe方式唤起应用
  if (isIOSSafari) {
    // iOS Safari使用location.href方式
    // 记录当前时间，用于检测是否成功唤起应用
    const startTime = Date.now();
    
    // 监听页面可见性变化，如果应用成功唤起，页面会变为隐藏状态
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面变为隐藏状态，可能是应用被唤起
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
    
    // 添加页面可见性监听（iOS Safari支持）
    if (typeof document.hidden !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    // 尝试唤起应用
    try {
      window.location.href = config.appUrl;
    } catch (e) {
      // 如果唤起失败，立即跳转到网页版
      clearTimeout(timer);
      window.open(config.webUrl, '_blank');
    }
  } else {
    // 其他浏览器使用iframe方式
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = config.appUrl;
    document.body.appendChild(iframe);
    
    // 清理iframe
    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }
}

/**
 * 打开地图应用或网页
 * @param mapType 地图类型
 * @param position 位置坐标 [经度, 纬度]
 * @param name 地点名称
 * @param environment 环境信息
 */
export function openMap(
  mapType: MapType, 
  position: [number, number], 
  name: string, 
  environment: EnvironmentInfo
): void {
  const [lng, lat] = position;
  const encodedName = encodeURIComponent(name);
  
  // 生成地图配置
  const configGenerator = mapConfigGenerators[mapType];
  const config = configGenerator(lng, lat, encodedName, environment);
  
  // 根据环境决定打开方式
  if (environment.isInApp) {
    // 应用内浏览器环境的处理策略
    if (environment.isWeChat || environment.isWeChatWork) {
      // 微信环境：直接打开网页版，因为微信限制第三方App唤起
      window.open(config.webUrl, '_blank');
    } else if (environment.isAlipay) {
      // 支付宝环境：优先尝试唤起App，支付宝对地图App支持较好
      tryLaunchApp(config);
    } else if (environment.isQQ || environment.isQQBrowser) {
      // QQ环境：腾讯系产品，优先推荐腾讯地图
      if (mapType === 'tencent') {
        tryLaunchApp(config);
      } else {
        window.open(config.webUrl, '_blank');
      }
    } else {
      // 其他应用内浏览器：尝试唤起App，失败则降级
      tryLaunchApp(config);
    }
  } else {
    // 标准浏览器环境：尝试唤起App
    tryLaunchApp(config);
  }
}