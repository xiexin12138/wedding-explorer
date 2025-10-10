/**
 * 视频优化工具
 * 基于腾讯云数据万象（CI）进行视频处理
 * 
 * 说明：
 * - 腾讯云视频处理（转码、截图等）主要通过异步任务完成
 * - 本工具提供客户端视频优化策略和预设配置
 * - 实际转码需要通过后端 API 提交任务到数据万象
 */

export interface VideoOptimizeOptions {
  /** 视频格式 */
  format?: 'mp4' | 'webm' | 'avi';
  /** 视频码率（kbps） */
  bitrate?: number;
  /** 视频宽度 */
  width?: number;
  /** 视频高度 */
  height?: number;
  /** 帧率 */
  fps?: number;
}

export interface VideoSnapshotOptions {
  /** 截取时间（秒） */
  time?: number;
  /** 截图宽度 */
  width?: number;
  /** 截图高度 */
  height?: number;
  /** 截图格式 */
  format?: 'jpg' | 'png' | 'webp';
  /** 截图质量 1-100 */
  quality?: number;
}

/**
 * 视频转码任务参数（用于提交到后端 API）
 */
export interface VideoTranscodeTaskParams {
  inputObject: string;          // 输入视频对象路径
  outputObject?: string;         // 输出视频对象路径
  container: {
    format: 'mp4' | 'webm' | 'avi';
  };
  video: {
    codec: 'H.264' | 'H.265' | 'VP8' | 'VP9';
    bitrate?: number;           // 视频码率（kbps）
    width?: number;             // 视频宽度
    height?: number;            // 视频高度
    fps?: number;               // 帧率
  };
  audio?: {
    codec: 'aac' | 'mp3';
    bitrate?: number;           // 音频码率（kbps）
    samplerate?: number;        // 采样率
    channels?: number;          // 声道数
  };
}

/**
 * 视频截图任务参数（用于提交到后端 API）
 */
export interface VideoSnapshotTaskParams {
  inputObject: string;          // 输入视频对象路径
  outputObject?: string;        // 输出图片对象路径
  time: number;                 // 截图时间点（秒）
  width?: number;               // 截图宽度
  height?: number;              // 截图高度
  format?: 'jpg' | 'png';       // 截图格式
  mode?: 'exactframe' | 'keyframe'; // 截帧方式：精确截帧/关键帧
}

/**
 * 检测是否为 COS URL
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isCOSUrl(url: string): boolean {
  return url.includes('.myqcloud.com') && url.includes('.cos.');
}

/**
 * 检测是否为视频文件
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
}

/**
 * 生成视频截图任务参数
 * 注意：腾讯云视频截图需要通过异步任务完成，不支持URL直接截图
 * 
 * @param videoUrl 视频 URL 或对象路径
 * @param options 截图选项
 * @returns 截图任务参数
 * 
 * @example
 * ```typescript
 * // 生成截图任务参数
 * const taskParams = getVideoSnapshotTask('video/demo.mp4', {
 *   time: 3,
 *   width: 800,
 *   format: 'jpg'
 * });
 * // 将 taskParams 发送到后端 API 提交任务
 * ```
 */
export function getVideoSnapshotTask(
  videoPath: string,
  options: VideoSnapshotOptions = {}
): VideoSnapshotTaskParams {
  const {
    time = 1,
    width,
    height,
    format = 'jpg',
  } = options;

  return {
    inputObject: videoPath,
    time,
    width,
    height,
    format: format === 'webp' ? 'jpg' : format, // 截图只支持 jpg 和 png
    mode: 'exactframe', // 精确截帧
  };
}

/**
 * 从 COS URL 提取对象路径
 * @param url 完整的 COS URL
 * @returns 对象路径（不含域名）
 */
export function extractObjectPath(url: string): string {
  try {
    const urlObj = new URL(url);
    // 去掉开头的 /
    return urlObj.pathname.substring(1);
  } catch {
    return url;
  }
}

/**
 * 生成视频转码任务参数
 * 注意：腾讯云视频转码需要通过异步任务完成
 * 
 * @param videoPath 视频对象路径
 * @param options 转码选项
 * @returns 转码任务参数
 * 
 * @example
 * ```typescript
 * // 生成转码任务参数
 * const taskParams = getVideoTranscodeTask('video/demo.mov', {
 *   format: 'mp4',
 *   bitrate: 1000,
 *   width: 1280,
 * });
 * // 将 taskParams 发送到后端 API 提交任务
 * ```
 */
export function getVideoTranscodeTask(
  videoPath: string,
  options: VideoOptimizeOptions = {}
): VideoTranscodeTaskParams {
  const {
    format = 'mp4',
    bitrate = 1000,
    width,
    height,
    fps = 30,
  } = options;

  return {
    inputObject: videoPath,
    container: {
      format,
    },
    video: {
      codec: format === 'webm' ? 'VP9' : 'H.264',
      bitrate,
      width,
      height,
      fps,
    },
    audio: {
      codec: 'aac',
      bitrate: 128,
      samplerate: 44100,
      channels: 2,
    },
  };
}

/**
 * 获取自适应视频播放URL
 * 根据设备类型返回合适的视频URL（需要提前转码）
 * 
 * 说明：腾讯云视频需要提前通过异步任务转码为不同码率版本
 * 这里只是返回对应码率版本的文件路径
 * 
 * @param baseVideoPath 基础视频路径（不含后缀）
 * @param deviceType 设备类型
 * @returns 自适应视频路径
 * 
 * @example
 * ```typescript
 * // 假设视频已转码为多个版本：
 * // - video/demo_mobile.mp4 (500kbps)
 * // - video/demo_tablet.mp4 (1000kbps)
 * // - video/demo_desktop.mp4 (2000kbps)
 * const videoUrl = getAdaptiveVideoPath('video/demo', 'mobile');
 * // 返回: 'video/demo_mobile.mp4'
 * ```
 */
export function getAdaptiveVideoPath(
  baseVideoPath: string,
  deviceType: 'mobile' | 'tablet' | 'desktop' = 'mobile'
): string {
  // 移除可能存在的扩展名
  const pathWithoutExt = baseVideoPath.replace(/\.[^/.]+$/, '');
  return `${pathWithoutExt}_${deviceType}.mp4`;
}

/**
 * 客户端视频优化策略
 * 提供客户端层面的视频加载优化建议
 */
export const ClientVideoOptimization = {
  /**
   * 获取视频预加载策略
   * @param deviceType 设备类型
   * @param networkType 网络类型
   */
  getPreloadStrategy(
    deviceType: 'mobile' | 'tablet' | 'desktop',
    networkType?: '4g' | '3g' | 'wifi' | 'slow-2g' | '2g'
  ): 'none' | 'metadata' | 'auto' {
    // 移动端且非 WiFi 环境，不预加载
    if (deviceType === 'mobile' && networkType && networkType !== 'wifi') {
      return 'none';
    }
    // WiFi 或桌面端，预加载元数据
    if (networkType === 'wifi' || deviceType === 'desktop') {
      return 'metadata';
    }
    // 其他情况
    return 'none';
  },

  /**
   * 是否自动播放
   */
  shouldAutoPlay(
    deviceType: 'mobile' | 'tablet' | 'desktop',
    networkType?: string
  ): boolean {
    // 移动端不自动播放（省流量，且微信等浏览器限制）
    if (deviceType === 'mobile') {
      return false;
    }
    // 桌面端 WiFi 环境可以自动播放
    return deviceType === 'desktop' && networkType === 'wifi';
  },
};

/**
 * 预设的视频转码配置
 * 用于生成不同设备和网络环境下的视频版本
 * 
 * 使用场景：
 * 1. 上传视频后，通过后端API提交转码任务
 * 2. 生成mobile、tablet、desktop三个版本
 * 3. 前端根据设备类型自动选择合适版本播放
 */
export const VideoPresets = {
  /** 移动端：低码率，小尺寸（微信H5优化） */
  mobile: {
    format: 'mp4' as const,
    bitrate: 500,    // 500kbps - 适合4G网络
    width: 720,      // 720p
    fps: 25,         // 降低帧率节省流量
  },
  /** 平板：中等码率，中等尺寸 */
  tablet: {
    format: 'mp4' as const,
    bitrate: 1000,   // 1Mbps
    width: 1280,     // 720p高质量
    fps: 30,
  },
  /** 桌面端：高码率，大尺寸 */
  desktop: {
    format: 'mp4' as const,
    bitrate: 2000,   // 2Mbps
    width: 1920,     // 1080p
    fps: 30,
  },
  /** 预览：极低码率（用于缩略图视频） */
  preview: {
    format: 'mp4' as const,
    bitrate: 200,    // 200kbps
    width: 480,
    fps: 15,
  },
} as const;

