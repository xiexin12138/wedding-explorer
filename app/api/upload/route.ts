import { NextResponse } from 'next/server';
import { sts } from 'tencentcloud-sdk-nodejs';

const StsClient = sts.v20180813.Client;

export async function POST() {
  try {
    // 1. 从环境变量中获取配置
    const {
      TENCENT_SECRET_ID,
      TENCENT_SECRET_KEY,
      NEXT_PUBLIC_TENCENT_COS_BUCKET_NAME,
      NEXT_PUBLIC_TENCENT_COS_REGION,
    } = process.env;

    // 检查配置是否存在
    if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY || !NEXT_PUBLIC_TENCENT_COS_BUCKET_NAME || !NEXT_PUBLIC_TENCENT_COS_REGION) {
      console.error('Missing Tencent Cloud environment variables for STS');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const clientConfig = {
      credential: {
        secretId: TENCENT_SECRET_ID,
        secretKey: TENCENT_SECRET_KEY,
      },
      region: NEXT_PUBLIC_TENCENT_COS_REGION, // 使用环境变量中配置的地域
      profile: {
        httpProfile: {
          endpoint: 'sts.tencentcloudapi.com',
        },
      },
    };

    const client = new StsClient(clientConfig);

    // 从存储桶名称中提取 APPID（格式：bucket-name-appid）
    const bucketParts = NEXT_PUBLIC_TENCENT_COS_BUCKET_NAME.split('-');
    const appId = bucketParts[bucketParts.length - 1];

    // 2. 定义权限策略 (Policy)
    // 授权所有对指定存储桶的读、写和分块上传操作
    const policy = {
      version: '2.0',
      statement: [
        {
          action: [
            // 简单上传
            'cos:PutObject',
            // 分块上传
            'cos:InitiateMultipartUpload',
            'cos:ListMultipartUploads',
            'cos:ListParts',
            'cos:UploadPart',
            'cos:CompleteMultipartUpload',
            'cos:AbortMultipartUpload',
          ],
          effect: 'allow',
          resource: [
            // 授予对存储桶内所有对象的权限
            `qcs::cos:${NEXT_PUBLIC_TENCENT_COS_REGION}:uid/${appId}:${NEXT_PUBLIC_TENCENT_COS_BUCKET_NAME}/*`,
          ],
        },
      ],
    };

    const params = {
      Name: 'cos-sts-policy',
      Policy: JSON.stringify(policy),
      DurationSeconds: 1800, // 临时密钥有效期，单位秒，30分钟
    };

    // 3. 调用STS服务获取临时密钥
    const data = await client.GetFederationToken(params);

    // 4. 返回临时密钥给前端
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error getting STS federation token:', error);
    return NextResponse.json({ error: 'Failed to get temporary credentials' }, { status: 500 });
  }
}