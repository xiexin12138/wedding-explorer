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
 */
const generateBaiduConfig: MapConfigGenerator = (lng, lat, name, environment) => {
  // 百度地图需要从GCJ-02转换为BD-09坐标系
  const [finalLng, finalLat] = gcj02ToBd09(lng, lat);
  
  return {
    // iOS和Android使用不同的URL格式，鸿蒙支持Android格式
    appUrl: environment.isIOS
      ? `baidumap://map/direction?destination=name:${name}|latlng:${finalLat},${finalLng}&coord_type=bd09ll&mode=driving&src=wedding-explorer`
      : `bdapp://map/direction?destination=name:${name}|latlng:${finalLat},${finalLng}&coord_type=bd09ll&mode=driving&src=wedding-explorer`,
    webUrl: `http://api.map.baidu.com/marker?location=${finalLat},${finalLng}&title=${name}&content=${name}&output=html&src=wedding-explorer`
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
 * @param config 地图配置
 */
function tryLaunchApp(config: MapConfig): void {
  // 使用更可靠的App唤起方法
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = config.appUrl;
  document.body.appendChild(iframe);
  
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
  
  // 清理iframe
  setTimeout(() => {
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  }, 1000);
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