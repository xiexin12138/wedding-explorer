import { NextRequest, NextResponse } from 'next/server';
import COS from 'cos-nodejs-sdk-v5';

export const revalidate = 0;

// 创建 COS 客户端实例
const createCOSClient = () => {
  const {
    TENCENT_SECRET_ID,
    TENCENT_SECRET_KEY,
  } = process.env;

  if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY) {
    throw new Error('Missing Tencent Cloud credentials');
  }

  return new COS({
    SecretId: TENCENT_SECRET_ID,
    SecretKey: TENCENT_SECRET_KEY,
  });
};

// 生成签名 URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, expiresIn = 3600 } = body; // 默认1小时过期

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const {
      NEXT_PUBLIC_TENCENT_COS_BUCKET_NAME,
      NEXT_PUBLIC_TENCENT_COS_REGION,
    } = process.env;

    if (!NEXT_PUBLIC_TENCENT_COS_BUCKET_NAME || !NEXT_PUBLIC_TENCENT_COS_REGION) {
      return NextResponse.json(
        { error: 'COS configuration missing' },
        { status: 500 }
      );
    }

    // 从完整 URL 中提取 Key
    // URL 格式: https://bucket-name.cos.region.myqcloud.com/path/to/file
    const urlObj = new URL(url);
    const key = urlObj.pathname.startsWith('/') 
      ? urlObj.pathname.slice(1) 
      : urlObj.pathname;

    const cos = createCOSClient();

    // 生成签名 URL
    const signedUrl = cos.getObjectUrl({
      Bucket: NEXT_PUBLIC_TENCENT_COS_BUCKET_NAME,
      Region: NEXT_PUBLIC_TENCENT_COS_REGION,
      Key: key,
      Sign: true,
      Expires: expiresIn, // 签名有效期（秒）
    });

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate signed URL' 
      },
      { status: 500 }
    );
  }
}

