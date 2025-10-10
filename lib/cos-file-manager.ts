/**
 * COS 文件管理工具
 * 用于删除存储桶中的文件
 */

import COS from 'cos-nodejs-sdk-v5';

// COS 配置
const cos = new COS({
  SecretId: process.env.TENCENT_SECRET_ID!,
  SecretKey: process.env.TENCENT_SECRET_KEY!,
});

const BUCKET = process.env.NEXT_PUBLIC_TENCENT_COS_BUCKET_NAME!;
const REGION = process.env.NEXT_PUBLIC_TENCENT_COS_REGION!;

/**
 * 从 COS URL 提取对象键（Key）
 * @param url COS 完整 URL
 * @returns 对象键（路径）
 * 
 * @example
 * extractKeyFromUrl('https://bucket.cos.region.myqcloud.com/path/to/file.jpg')
 * // 返回: 'path/to/file.jpg'
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    // 检查是否为 COS URL
    if (!url.includes('.myqcloud.com')) {
      console.warn('不是 COS URL，跳过删除:', url);
      return null;
    }

    const urlObj = new URL(url);
    // 去掉开头的 /
    const key = urlObj.pathname.substring(1);
    
    // 解码 URL 编码的字符
    return decodeURIComponent(key);
  } catch (error) {
    console.error('解析 URL 失败:', url, error);
    return null;
  }
}

/**
 * 删除单个 COS 文件
 * @param key 对象键（文件路径）
 * @returns 是否删除成功
 */
export async function deleteCOSFile(key: string): Promise<boolean> {
  try {
    console.log(`🗑️ 准备删除 COS 文件: ${key}`);
    
    await cos.deleteObject({
      Bucket: BUCKET,
      Region: REGION,
      Key: key,
    });

    console.log(`✅ COS 文件删除成功: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ COS 文件删除失败: ${key}`, error);
    // 如果文件不存在，也视为删除成功
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      console.log(`ℹ️ 文件不存在，跳过: ${key}`);
      return true;
    }
    return false;
  }
}

/**
 * 删除 COS 文件（通过 URL）
 * @param url COS 文件 URL
 * @returns 是否删除成功
 */
export async function deleteCOSFileByUrl(url: string): Promise<boolean> {
  const key = extractKeyFromUrl(url);
  
  if (!key) {
    console.warn('无法提取文件键，跳过删除:', url);
    return false;
  }

  return deleteCOSFile(key);
}

/**
 * 批量删除 COS 文件
 * @param keys 对象键数组
 * @returns 删除结果统计
 */
export async function batchDeleteCOSFiles(keys: string[]): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  if (keys.length === 0) {
    return { success: 0, failed: 0, total: 0 };
  }

  console.log(`🗑️ 批量删除 COS 文件，共 ${keys.length} 个`);

  try {
    // COS 批量删除最多支持 1000 个对象
    const batchSize = 1000;
    const batches = [];
    
    for (let i = 0; i < keys.length; i += batchSize) {
      batches.push(keys.slice(i, i + batchSize));
    }

    let successCount = 0;
    let failedCount = 0;

    for (const batch of batches) {
      try {
        const result = await cos.deleteMultipleObject({
          Bucket: BUCKET,
          Region: REGION,
          Objects: batch.map(key => ({ Key: key })),
        });

        // 统计删除结果
        if (result.Deleted) {
          successCount += result.Deleted.length;
        }
        if (result.Error) {
          failedCount += result.Error.length;
          console.error('批量删除部分失败:', result.Error);
        }
      } catch (error) {
        console.error('批量删除失败:', error);
        failedCount += batch.length;
      }
    }

    console.log(`✅ 批量删除完成: 成功 ${successCount}, 失败 ${failedCount}`);

    return {
      success: successCount,
      failed: failedCount,
      total: keys.length,
    };
  } catch (error) {
    console.error('批量删除 COS 文件失败:', error);
    return {
      success: 0,
      failed: keys.length,
      total: keys.length,
    };
  }
}

/**
 * 批量删除 COS 文件（通过 URL）
 * @param urls COS 文件 URL 数组
 * @returns 删除结果统计
 */
export async function batchDeleteCOSFilesByUrls(urls: string[]): Promise<{
  success: number;
  failed: number;
  total: number;
  skipped: number;
}> {
  if (urls.length === 0) {
    return { success: 0, failed: 0, total: 0, skipped: 0 };
  }

  console.log(`🗑️ 批量删除 COS 文件（通过 URL），共 ${urls.length} 个`);

  // 提取所有有效的文件键
  const keys: string[] = [];
  let skippedCount = 0;

  for (const url of urls) {
    const key = extractKeyFromUrl(url);
    if (key) {
      keys.push(key);
    } else {
      skippedCount++;
    }
  }

  const result = await batchDeleteCOSFiles(keys);

  return {
    ...result,
    skipped: skippedCount,
  };
}

/**
 * 从景点媒体数据中提取所有文件 URL（包括图片和视频的转码文件）
 * 
 * 转码规则：
 * - 图片：原格式 + .jpg 转码文件
 * - 视频：原格式 + .mp4 转码文件
 * 
 * @param media 景点媒体数组
 * @returns 文件 URL 数组（包含原文件和转码文件）
 */
export function extractMediaUrls(media?: Array<{
  type: 'image' | 'video';
  url: string;
  title?: string;
}>): string[] {
  if (!media || media.length === 0) {
    return [];
  }

  const urls: string[] = [];

  for (const item of media) {
    // 添加原始文件 URL
    urls.push(item.url);

    // 图片和视频都需要删除转码后的文件
    if (item.type === 'image') {
      // 图片转码逻辑：原始文件可能是任意格式（png, webp, gif等），转码后统一为 .jpg
      // 例如：uploads/xxx-photo.png -> uploads/xxx-photo.jpg
      const transcodedJpgUrl = item.url.replace(/\.[^/.]+$/, '.jpg');
      
      // 只有当转码后的 URL 与原始 URL 不同时才添加（避免重复删除）
      if (transcodedJpgUrl !== item.url) {
        urls.push(transcodedJpgUrl);
        console.log(`🖼️ 检测到图片文件，将同时删除转码文件: ${transcodedJpgUrl}`);
      }
    } else if (item.type === 'video') {
      // 视频转码逻辑：原始文件可能是任意格式，转码后统一为 .mp4
      // 例如：uploads/xxx-video.mov -> uploads/xxx-video.mp4
      const transcodedMp4Url = item.url.replace(/\.[^/.]+$/, '.mp4');
      
      // 只有当转码后的 URL 与原始 URL 不同时才添加（避免重复删除）
      if (transcodedMp4Url !== item.url) {
        urls.push(transcodedMp4Url);
        console.log(`🎬 检测到视频文件，将同时删除转码文件: ${transcodedMp4Url}`);
      }
    }
  }

  return urls.filter(Boolean);
}

/**
 * 删除景点相关的所有媒体文件
 * @param media 景点媒体数组
 * @returns 删除结果统计
 */
export async function deleteAttractionMedia(media?: Array<{
  type: 'image' | 'video';
  url: string;
  title?: string;
}>): Promise<{
  success: number;
  failed: number;
  total: number;
  skipped: number;
}> {
  const urls = extractMediaUrls(media);
  
  if (urls.length === 0) {
    console.log('ℹ️ 景点没有媒体文件，无需删除');
    return { success: 0, failed: 0, total: 0, skipped: 0 };
  }

  console.log(`🗑️ 删除景点媒体文件，共 ${urls.length} 个`);
  
  return batchDeleteCOSFilesByUrls(urls);
}

