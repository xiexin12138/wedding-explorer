/**
 * 图片优化工具
 * 基于腾讯云数据万象（CI）进行图片处理
 */

export interface ImageOptimizeOptions {
  /** 目标宽度（像素） */
  width?: number;
  /** 目标高度（像素） */
  height?: number;
  /** 图片质量 1-100，默认 80 */
  quality?: number;
  /** 输出格式 */
  format?: 'webp' | 'jpg' | 'png' | 'avif' | 'heif';
  /** 是否智能裁剪 */
  smartCrop?: boolean;
  /** 模糊程度 1-50 */
  blur?: number;
  /** 锐化程度 1-100 */
  sharpen?: number;
  /** 是否去除图片元信息（EXIF），减小文件大小 */
  stripMeta?: boolean;
  /** 是否自动旋转（根据 EXIF 方向） */
  autoOrient?: boolean;
  /** 是否渐进显示（适用于 JPEG） */
  interlace?: boolean;
  /** 图片样式名称（预设在 COS 上的样式） */
  styleName?: string;
}

/**
 * 检测是否为 COS URL
 */
function isCOSUrl(url: string): boolean {
  return url.includes('.myqcloud.com') && url.includes('.cos.');
}

/**
 * 优化图片 URL
 * 使用腾讯云数据万象进行实时图片处理（下载时处理）
 * 参考文档: https://www.tencentcloud.com/zh/document/product/1045/73025
 * 
 * @param url 原始图片 URL
 * @param options 优化选项
 * @returns 优化后的 URL
 * 
 * @example
 * ```typescript
 * // 转换为 WebP，宽度 800px，质量 75%
 * const optimized = optimizeImageUrl(url, {
 *   width: 800,
 *   quality: 75,
 *   format: 'webp'
 * });
 * 
 * // 使用预设样式
 * const styled = optimizeImageUrl(url, {
 *   styleName: 'thumbnail'
 * });
 * ```
 */
export function optimizeImageUrl(
  url: string,
  options: ImageOptimizeOptions = {}
): string {
  // 如果不是 COS URL，直接返回原始 URL
  if (!isCOSUrl(url)) {
    return url;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    smartCrop = false,
    blur,
    sharpen,
    stripMeta = true,      // 默认去除元信息，减小文件大小
    autoOrient = true,     // 默认自动旋转
    interlace = true,      // 默认渐进显示
    styleName,
  } = options;

  // 如果指定了样式名称，使用样式（style/样式名）
  if (styleName) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}style/${styleName}`;
  }

  // 构建处理参数 - 使用 imageMogr2 接口
  const params: string[] = ['imageMogr2'];

  // 自动旋转（根据 EXIF Orientation 信息）
  if (autoOrient) {
    params.push('auto-orient');
  }

  // 格式转换
  if (format) {
    params.push(`format/${format}`);
  }

  // 宽度缩放（保持宽高比）
  if (width && !height) {
    params.push(`thumbnail/${width}x`);
  }
  // 高度缩放（保持宽高比）
  else if (height && !width) {
    params.push(`thumbnail/x${height}`);
  }
  // 同时指定宽高
  else if (width && height) {
    if (smartCrop) {
      // 智能裁剪：缩放并裁剪到指定尺寸（保持宽高比，居中裁剪）
      params.push(`thumbnail/${width}x${height}r`);
    } else {
      // 普通缩放：限制在指定尺寸内（保持宽高比）
      params.push(`thumbnail/${width}x${height}`);
    }
  }

  // 质量压缩
  if (quality && quality >= 1 && quality <= 100) {
    params.push(`quality/${quality}`);
  }

  // 相对质量压缩（推荐用于移动端，在保证视觉效果的情况下压缩图片）
  if (quality && quality < 100) {
    params.push(`rquality/${quality}`);
  }

  // 渐进显示（适用于 JPEG，提升加载体验）
  if (interlace && (format === 'jpg' || !format)) {
    params.push('interlace/1');
  }

  // 去除元信息（减小文件大小，移除 EXIF 等信息）
  if (stripMeta) {
    params.push('strip');
  }

  // 模糊效果
  if (blur && blur >= 1 && blur <= 50) {
    params.push(`blur/${blur}x${blur}`);
  }

  // 锐化效果
  if (sharpen && sharpen >= 1 && sharpen <= 100) {
    params.push(`sharpen/${sharpen}`);
  }

  // 拼接参数
  const queryString = params.join('/');

  // 处理 URL 中可能已存在的查询参数
  const separator = url.includes('?') ? '&' : '?';

  return `${url}${separator}${queryString}`;
}

/**
 * 生成响应式图片的 srcSet
 * 
 * @param url 原始图片 URL
 * @param widths 不同尺寸的宽度数组
 * @param options 优化选项
 * @returns srcSet 字符串
 * 
 * @example
 * ```typescript
 * const srcSet = generateSrcSet(url, [400, 800, 1200], {
 *   quality: 80,
 *   format: 'webp'
 * });
 * // 返回: "url?...width=400 400w, url?...width=800 800w, ..."
 * ```
 */
export function generateSrcSet(
  url: string,
  widths: number[] = [400, 800, 1200, 1600],
  options: Omit<ImageOptimizeOptions, 'width'> = {}
): string {
  if (!isCOSUrl(url)) {
    return '';
  }

  return widths
    .map((width) => {
      const optimized = optimizeImageUrl(url, { ...options, width });
      return `${optimized} ${width}w`;
    })
    .join(', ');
}

/**
 * 预设的图片优化配置
 * 针对移动端 H5 优化，兼顾微信浏览器性能
 */
export const ImagePresets = {
  /** 缩略图：小尺寸，低质量 */
  thumbnail: {
    width: 200,
    quality: 60,
    format: 'webp' as const,
    stripMeta: true,
    autoOrient: true,
    interlace: false,
  },
  /** 移动端：中等尺寸，中等质量（微信 H5 优化） */
  mobile: {
    width: 750,  // 适配常见手机宽度
    quality: 70,  // 相对质量，在保证视觉效果下压缩
    format: 'webp' as const,
    stripMeta: true,
    autoOrient: true,
    interlace: true,  // 渐进显示，提升加载体验
  },
  /** 平板：较大尺寸，较高质量 */
  tablet: {
    width: 1024,
    quality: 75,
    format: 'webp' as const,
    stripMeta: true,
    autoOrient: true,
    interlace: true,
  },
  /** 桌面端：大尺寸，高质量 */
  desktop: {
    width: 1920,
    quality: 80,
    format: 'webp' as const,
    stripMeta: true,
    autoOrient: true,
    interlace: true,
  },
  /** 头像：小正方形，智能裁剪 */
  avatar: {
    width: 200,
    height: 200,
    quality: 70,
    format: 'webp' as const,
    smartCrop: true,
    stripMeta: true,
    autoOrient: true,
    interlace: false,
  },
  /** 占位符：极小尺寸，高模糊（用于懒加载占位） */
  placeholder: {
    width: 50,
    quality: 30,
    format: 'webp' as const,
    blur: 20,
    stripMeta: true,
    autoOrient: false,
    interlace: false,
  },
} as const;

/**
 * 根据设备类型选择合适的预设
 */
export function getDevicePreset(deviceType?: 'mobile' | 'tablet' | 'desktop') {
  // 如果在服务端，返回移动端预设
  if (typeof window === 'undefined') {
    return ImagePresets.mobile;
  }

  // 如果指定了设备类型，直接返回
  if (deviceType) {
    return ImagePresets[deviceType];
  }

  // 根据屏幕宽度自动选择
  const width = window.innerWidth;
  
  if (width < 768) {
    return ImagePresets.mobile;
  } else if (width < 1024) {
    return ImagePresets.tablet;
  } else {
    return ImagePresets.desktop;
  }
}

/**
 * 批量优化图片 URL
 */
export function optimizeImageUrls(
  urls: string[],
  options: ImageOptimizeOptions = {}
): string[] {
  return urls.map(url => optimizeImageUrl(url, options));
}

