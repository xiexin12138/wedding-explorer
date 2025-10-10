/**
 * COS 私有资源 URL 签名工具
 * 用于生成临时访问私有存储桶资源的签名 URL
 */

interface SignedUrlCache {
  url: string;
  expiresAt: number;
}

// 缓存已签名的 URL，避免重复请求
const urlCache = new Map<string, SignedUrlCache>();

// 默认签名有效期：3小时（10800秒）
const DEFAULT_EXPIRES_IN = 3600 * 3;

/**
 * 获取签名 URL
 * @param originalUrl 原始 COS URL
 * @param expiresIn 签名有效期（秒），默认3小时
 * @returns 签名后的 URL
 */
export async function getSignedUrl(
  originalUrl: string,
  expiresIn: number = DEFAULT_EXPIRES_IN
): Promise<string> {
  // 如果不是 COS URL，直接返回
  if (!originalUrl.includes('.myqcloud.com')) {
    return originalUrl;
  }

  // 检查缓存
  const cached = urlCache.get(originalUrl);
  const now = Date.now();
  
  if (cached && cached.expiresAt > now + 60000) { // 提前1分钟过期
    return cached.url;
  }

  try {
    // 调用签名 API
    const response = await fetch('/api/sign-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: originalUrl,
        expiresIn,
      }),
    });

    if (!response.ok) {
      console.error('Failed to sign URL:', await response.text());
      return originalUrl; // 失败时返回原始 URL
    }

    const data = await response.json();
    
    if (!data.success || !data.signedUrl) {
      console.error('Invalid sign URL response:', data);
      return originalUrl;
    }

    // 缓存签名 URL
    urlCache.set(originalUrl, {
      url: data.signedUrl,
      expiresAt: new Date(data.expiresAt).getTime(),
    });

    return data.signedUrl;
  } catch (error) {
    console.error('Error signing URL:', error);
    return originalUrl; // 出错时返回原始 URL
  }
}

/**
 * 批量获取签名 URL
 * @param urls 原始 URL 数组
 * @param expiresIn 签名有效期（秒）
 * @returns 签名后的 URL 数组
 */
export async function getSignedUrls(
  urls: string[],
  expiresIn: number = DEFAULT_EXPIRES_IN
): Promise<string[]> {
  return Promise.all(urls.map(url => getSignedUrl(url, expiresIn)));
}

/**
 * 清除 URL 签名缓存
 * @param url 可选，指定要清除的 URL，不传则清除所有
 */
export function clearSignedUrlCache(url?: string): void {
  if (url) {
    urlCache.delete(url);
  } else {
    urlCache.clear();
  }
}

