'use client';

import { useState, useEffect, useRef } from 'react';
import { getAdaptiveVideoPath, ClientVideoOptimization } from '@/lib/video-optimizer';
import { getSignedUrl } from '@/lib/cos-url-signer';

interface OptimizedVideoProps extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'src' | 'poster'> {
  /** 视频 URL 或对象路径 */
  src: string;
  /** 自定义封面图 URL */
  poster?: string;
  /** 设备类型，用于自适应码率 */
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  /** 
   * 基础视频路径（不含设备后缀）
   * 如果提供，将自动根据设备类型选择对应版本
   * 例如：baseVideoPath="video/demo" 会选择 "video/demo_mobile.mp4" 等
   */
  baseVideoPath?: string;
}

/**
 * 优化版视频组件
 * 
 * 功能：
 * 1. 自适应码率（根据设备类型选择预转码的视频版本）
 * 2. 支持私有存储桶签名访问
 * 3. 智能预加载策略（根据设备和网络条件）
 * 4. 移动端优化（微信H5兼容）
 * 
 * 注意：
 * - 视频需要提前通过后端API转码为不同码率版本
 * - 视频截图需要提前生成，作为封面图传入
 * 
 * @example
 * ```tsx
 * // 使用自适应视频（需要提前转码为 demo_mobile.mp4, demo_tablet.mp4, demo_desktop.mp4）
 * <OptimizedVideo
 *   baseVideoPath="video/demo"
 *   poster="video/demo_poster.jpg"
 *   controls
 *   className="w-full"
 * />
 * 
 * // 使用单一视频
 * <OptimizedVideo
 *   src="video/demo.mp4"
 *   poster="video/demo_poster.jpg"
 *   controls
 *   className="w-full"
 * />
 * ```
 */
export function OptimizedVideo({
  src,
  poster: customPoster,
  deviceType,
  baseVideoPath,
  className,
  ...videoProps  // 其他原生 video 属性
}: OptimizedVideoProps) {
  const [signedSrc, setSignedSrc] = useState<string>(src);
  const [posterUrl, setPosterUrl] = useState<string | undefined>(customPoster);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 检测设备类型
  const detectedDeviceType = deviceType || (
    typeof window !== 'undefined' 
      ? (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop')
      : 'mobile'
  );

  // 获取网络类型（如果支持）
  const networkType = typeof navigator !== 'undefined' && 'connection' in navigator
    ? (navigator as { connection?: { effectiveType?: '4g' | '3g' | 'wifi' | 'slow-2g' | '2g' } }).connection?.effectiveType
    : undefined;

  // 智能预加载策略
  const preloadStrategy = ClientVideoOptimization.getPreloadStrategy(
    detectedDeviceType,
    networkType
  );

  useEffect(() => {
    let isMounted = true;

    const loadOptimizedVideo = async () => {
      try {
        setIsLoading(true);

        // 1. 确定视频URL：如果提供了baseVideoPath，使用自适应路径
        const videoPath = baseVideoPath 
          ? getAdaptiveVideoPath(baseVideoPath, detectedDeviceType)
          : src;

        console.log('🎬 OptimizedVideo - 原始视频路径:', src);
        console.log('🎬 OptimizedVideo - 处理后视频路径:', videoPath);

        // 2. 签名视频 URL（如果是COS私有资源）
        const signed = await getSignedUrl(videoPath);
        console.log('🎬 OptimizedVideo - 签名后 URL:', signed);

        // 3. 如果有封面图，也进行签名
        let finalPosterUrl = customPoster;
        if (customPoster) {
          finalPosterUrl = await getSignedUrl(customPoster);
          console.log('🎬 OptimizedVideo - 封面图 URL:', finalPosterUrl);
        }

        if (isMounted) {
          setSignedSrc(signed);
          setPosterUrl(finalPosterUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ OptimizedVideo - 加载视频失败:', error);
        if (isMounted) {
          // 出错时使用原始 URL
          console.log('⚠️ OptimizedVideo - 使用原始 URL:', src);
          setSignedSrc(src);
          setIsLoading(false);
        }
      }
    };

    loadOptimizedVideo();

    return () => {
      isMounted = false;
    };
  }, [src, baseVideoPath, customPoster, detectedDeviceType]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('❌ 视频加载错误:', {
      src: signedSrc,
      error: e,
      networkState: videoRef.current?.networkState,
      readyState: videoRef.current?.readyState,
    });
  };

  return (
    <video
      ref={videoRef}
      src={signedSrc}
      poster={posterUrl}
      preload={preloadStrategy}
      playsInline  // 微信H5必需，避免全屏播放
      onError={handleVideoError}
      {...{
        'webkit-playsinline': 'true',  // iOS 微信兼容
        'x5-playsinline': 'true',      // Android 微信兼容
        'x5-video-player-type': 'h5',  // 启用H5播放器
        'x5-video-player-fullscreen': 'true',  // 全屏方式
      }}
      {...videoProps}  // 只传递原生 video 属性
      className={`${className || ''} ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity`}
    />
  );
}

/**
 * 视频封面组件
 * 用于显示预生成的视频封面图
 * 
 * 注意：视频截图需要通过后端API异步任务生成，不能实时生成
 */
export function VideoThumbnail({
  src,
  alt = '视频封面',
  width = 400,
  height = 300,
  className,
}: {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadThumbnail = async () => {
      try {
        // 对封面图URL进行签名（如果是私有资源）
        const signed = await getSignedUrl(src);

        if (isMounted) {
          setThumbnailUrl(signed);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load video thumbnail:', err);
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    };

    loadThumbnail();

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (isLoading) {
    return (
      <div 
        className={`bg-gray-200 dark:bg-gray-800 animate-pulse ${className}`}
        style={{ width, height }}
      />
    );
  }

  if (error || !thumbnailUrl) {
    return (
      <div 
        className={`bg-gray-300 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          封面加载失败
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={thumbnailUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}

