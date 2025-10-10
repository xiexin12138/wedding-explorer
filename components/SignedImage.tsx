'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { getSignedUrl } from '@/lib/cos-url-signer';

interface SignedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackSrc?: string;
}

/**
 * 支持私有 COS 资源的图片组件
 * 自动处理 URL 签名，支持私有存储桶
 */
export function SignedImage({ 
  src, 
  fallbackSrc = 'https://files.authing.co/authing-console/default-user-avatar.png',
  alt,
  ...props 
}: SignedImageProps) {
  const [signedSrc, setSignedSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSignedUrl = async () => {
      try {
        setIsLoading(true);
        const signed = await getSignedUrl(src);
        if (isMounted) {
          setSignedSrc(signed);
          setError(false);
        }
      } catch (err) {
        console.error('Failed to load signed URL:', err);
        if (isMounted) {
          setError(true);
          setSignedSrc(fallbackSrc);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!error) {
      setError(true);
      setSignedSrc(fallbackSrc);
    }
  };

  return (
    <Image
      {...props}
      src={signedSrc}
      alt={alt}
      onError={handleError}
      className={`${props.className || ''} ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity`}
    />
  );
}

