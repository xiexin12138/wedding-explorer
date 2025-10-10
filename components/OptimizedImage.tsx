'use client';

import { SignedImage } from './SignedImage';
import { 
  optimizeImageUrl, 
  ImageOptimizeOptions,
  ImagePresets,
  getDevicePreset 
} from '@/lib/image-optimizer';
import { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  /** 原始图片 URL */
  src: string;
  /** 图片描述 */
  alt: string;
  /** 优化选项 */
  optimize?: ImageOptimizeOptions;
  /** 是否启用响应式 srcSet，默认 true */
  responsive?: boolean;
  /** 预设配置 */
  preset?: keyof typeof ImagePresets;
}

/**
 * 优化版图片组件
 * 
 * 功能：
 * 1. 自动使用腾讯云数据万象进行图片优化
 * 2. 支持响应式 srcSet
 * 3. 支持私有存储桶签名访问
 * 4. 支持预设配置
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <OptimizedImage src={url} alt="景点图片" width={800} height={600} />
 * 
 * // 使用预设
 * <OptimizedImage src={url} alt="头像" preset="avatar" />
 * 
 * // 自定义优化
 * <OptimizedImage 
 *   src={url} 
 *   alt="景点图片"
 *   optimize={{ width: 800, quality: 75, format: 'webp' }}
 * />
 * ```
 */
export function OptimizedImage({
  src,
  alt,
  optimize,
  responsive = true,
  preset,
  sizes,
  ...props
}: OptimizedImageProps) {
  // 如果指定了预设，使用预设配置
  const optimizeOptions = preset 
    ? ImagePresets[preset]
    : (optimize || getDevicePreset());

  // 生成优化后的主 URL
  const optimizedSrc = optimizeImageUrl(src, optimizeOptions);

  // Next.js Image 组件会自动处理响应式图片，不需要手动传递 srcSet
  // 只传递 sizes 属性即可
  const imageSizes = responsive ? (sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw') : sizes;

  return (
    <SignedImage
      src={optimizedSrc}
      sizes={imageSizes}
      alt={alt}
      {...props}
    />
  );
}

/**
 * 头像图片组件（预设）
 */
export function AvatarImage({
  src,
  alt,
  size = 200,
  ...props
}: Omit<OptimizedImageProps, 'preset' | 'width' | 'height'> & { size?: number }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      optimize={{
        width: size,
        height: size,
        quality: 75,
        format: 'webp',
        smartCrop: true,
      }}
      responsive={false}
      {...props}
    />
  );
}

/**
 * 缩略图组件（预设）
 */
export function ThumbnailImage({
  src,
  alt,
  ...props
}: Omit<OptimizedImageProps, 'preset'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      preset="thumbnail"
      responsive={false}
      {...props}
    />
  );
}

