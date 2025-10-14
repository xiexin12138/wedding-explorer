'use client';

import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Coins, Gift, Loader2, ZoomIn } from "lucide-react";
import { SignedImage } from "@/components/SignedImage";
import { getSignedUrl } from "@/lib/cos-url-signer";

interface ExchangeItem {
  id: string;
  giftName: string;
  coinAmount: number;
  description: string;
  emoji?: string;
  sortOrder: number;
  imageUrl?: string;
}

interface PrizeDetailModalProps {
  item: ExchangeItem | null;
  isOpen: boolean;
  onClose: () => void;
}

// 带加载状态的图片组件 - 使用 memo 避免不必要的重新渲染
const LoadingImage = memo(function LoadingImage({ src, alt, onLoad, onError }: { 
  src: string; 
  alt: string; 
  onLoad?: () => void;
  onError?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 当src变化时重置状态
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  return (
    <div className="relative w-full h-full">
      {/* 加载状态 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10 rounded-lg">
          <div className="text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p className="text-sm">加载中...</p>
          </div>
        </div>
      )}
      
      {/* 错误状态 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10 rounded-lg">
          <div className="text-center text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">图片加载失败</p>
          </div>
        </div>
      )}
      
      <SignedImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        fallbackSrc="/images/gift-placeholder.svg"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
});

function PrizeDetailModalComponent({ item, isOpen, onClose }: PrizeDetailModalProps) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [signedFullscreenUrl, setSignedFullscreenUrl] = useState<string>("");
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  
  // 双指缩放相关状态
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);

  // 确保只在客户端渲染 Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // 关闭全屏查看
  const closeFullscreen = useCallback(() => {
    setFullscreenImage(null);
    setSignedFullscreenUrl("");
    setIsImageLoading(false);
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  }, []);

  // 当弹窗关闭时，也关闭全屏预览
  useEffect(() => {
    if (!isOpen) {
      closeFullscreen();
    }
  }, [isOpen, closeFullscreen]);

  // 全屏预览时锁定 body 滚动
  useEffect(() => {
    if (fullscreenImage) {
      // 锁定 body 滚动
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      return () => {
        // 恢复 body 滚动
        document.body.style.overflow = originalStyle;
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }
  }, [fullscreenImage]);

  // ESC 关闭全屏预览
  useEffect(() => {
    if (!fullscreenImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage, closeFullscreen]);

  // 处理图片全屏查看
  const handleImageClick = useCallback(async (imageUrl: string) => {
    if (!imageUrl) return;
    
    // 如果已经有相同的图片URL，直接使用缓存的签名URL
    if (fullscreenImage === imageUrl && signedFullscreenUrl) {
      return;
    }
    
    setFullscreenImage(imageUrl);
    setIsImageLoading(true);
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
    
    try {
      const signedUrl = await getSignedUrl(imageUrl);
      setSignedFullscreenUrl(signedUrl);
    } catch (error) {
      console.error('Failed to get signed URL for fullscreen:', error);
      setSignedFullscreenUrl(imageUrl);
    }
  }, [fullscreenImage, signedFullscreenUrl]);

  // 缩放控制
  const handleZoomIn = useCallback(() => setImageScale(prev => Math.min(prev * 1.5, 5)), []);
  const handleZoomOut = useCallback(() => setImageScale(prev => Math.max(prev / 1.5, 0.5)), []);
  const handleResetZoom = useCallback(() => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  }, []);

  // 拖拽控制
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
  }, [imagePosition.x, imagePosition.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setImagePosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart.x, dragStart.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 计算两指之间的距离
  const getDistance = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // 触摸事件处理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // 单指拖动
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - imagePosition.x, y: touch.clientY - imagePosition.y });
    } else if (e.touches.length === 2) {
      // 双指缩放
      setIsDragging(false);
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
      setInitialScale(imageScale);
    }
  }, [imagePosition.x, imagePosition.y, imageScale, getDistance]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      // 单指拖动
      const touch = e.touches[0];
      setImagePosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && initialPinchDistance) {
      // 双指缩放
      const distance = getDistance(e.touches[0], e.touches[1]);
      const scale = (distance / initialPinchDistance) * initialScale;
      setImageScale(Math.min(Math.max(scale, 0.5), 5));
    }
  }, [isDragging, dragStart.x, dragStart.y, initialPinchDistance, initialScale, getDistance]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      // 所有手指都离开了
      setIsDragging(false);
      setInitialPinchDistance(null);
    } else if (e.touches.length === 1) {
      // 从双指变成单指，重置拖动状态
      setInitialPinchDistance(null);
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - imagePosition.x, y: touch.clientY - imagePosition.y });
    }
  }, [imagePosition.x, imagePosition.y]);

  // 使用 useMemo 缓存图片样式，避免不必要的重新渲染
  const imageStyle = useMemo(() => ({
    transform: `translate(calc(-50% + ${imagePosition.x}px), calc(-50% + ${imagePosition.y}px)) scale(${imageScale})`,
    transformOrigin: "center center",
    transition: "none",
    maxWidth: "90vw",
    maxHeight: "90vh",
    width: "auto",
    height: "auto",
    objectFit: "contain" as const,
    willChange: "transform",
    opacity: isImageLoading ? 0 : 1,
    pointerEvents: "none" as const,
    position: "absolute" as const,
    top: "50%",
    left: "50%",
  }), [imagePosition.x, imagePosition.y, imageScale, isImageLoading]);

  if (!item) return null;

  return (
    <>
      {/* 礼品详情弹窗 */}
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // 如果正在查看全屏图片，阻止Dialog关闭
        if (fullscreenImage) {
          return;
        }
        // 否则正常调用onClose
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent 
        className="max-w-md mx-auto"
        onPointerDownOutside={(e) => {
          // 如果正在查看全屏图片，阻止Dialog关闭
          if (fullscreenImage) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // 如果正在查看全屏图片，阻止Dialog关闭
          if (fullscreenImage) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">{item.emoji || '🎁'}</span>
            {item.giftName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 礼品图片 */}
          {item.imageUrl ? (
            <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden group cursor-pointer"
                 onClick={() => handleImageClick(item.imageUrl!)}>
              <LoadingImage
                src={item.imageUrl}
                alt={item.giftName}
              />
              {/* 放大镜图标 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ) : (
            /* 没有图片时显示占位符 */
            <div className="relative w-full h-48 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无图片</p>
              </div>
            </div>
          )}
          
          {/* 兑换信息 */}
          <div className="flex items-center justify-center">
            <Badge variant="secondary" className="text-base px-4 py-2">
              <Coins className="h-4 w-4 mr-2 text-yellow-600" />
              {item.coinAmount} 游戏币
            </Badge>
          </div>
          
          {/* 礼品描述 */}
          {item.description && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">礼品介绍</h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* 全屏图片查看 - 使用 Portal 渲染到 body，避免影响 Dialog */}
    {mounted && fullscreenImage && createPortal(
      <div
        className="fixed inset-0 bg-black/90 flex items-center justify-center overflow-hidden"
        style={{ 
          zIndex: 2147483647, // 使用最大 z-index
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          pointerEvents: "auto" // 明确设置接收事件
        }}
        role="dialog"
        aria-modal="true"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            closeFullscreen();
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => {
          e.stopPropagation();
          handleTouchStart(e);
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 图片 - 显示在底层 */}
        {signedFullscreenUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={signedFullscreenUrl}
            src={signedFullscreenUrl}
            alt="全屏查看"
            className="select-none pointer-events-none"
            style={imageStyle}
            draggable={false}
            onLoad={() => setIsImageLoading(false)}
            onError={() => setIsImageLoading(false)}
          />
        )}

        {/* 加载中状态 */}
        {isImageLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 pointer-events-none z-20">
            <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
            <p className="text-white text-sm">加载中...</p>
          </div>
        )}

        {/* 关闭按钮 */}
        <button
          type="button"
          className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors"
          style={{ pointerEvents: "auto" }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            closeFullscreen();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label="关闭"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 缩放控制按钮 */}
        <div className="absolute bottom-4 right-4 z-50 flex gap-2">
          <button
            type="button"
            className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            style={{ pointerEvents: "auto" }}
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation(); 
              handleZoomOut(); 
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label="缩小"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            type="button"
            className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            style={{ pointerEvents: "auto" }}
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation(); 
              handleResetZoom(); 
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label="重置"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            type="button"
            className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            style={{ pointerEvents: "auto" }}
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation(); 
              handleZoomIn(); 
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label="放大"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}

// 使用memo优化组件，避免不必要的重新渲染
// 自定义比较函数，只在关键props变化时才重新渲染
export const PrizeDetailModal = memo(PrizeDetailModalComponent, (prevProps, nextProps) => {
  // 只有当这些关键属性变化时才重新渲染
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.item?.id === nextProps.item?.id &&
    prevProps.item?.imageUrl === nextProps.item?.imageUrl
  );
});
