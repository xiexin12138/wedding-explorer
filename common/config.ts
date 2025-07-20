const AUTHING_APP_ID = process.env.NEXT_PUBLIC_AUTHING_APP_ID;

if (!AUTHING_APP_ID) {
  console.error('❌ NEXT_PUBLIC_AUTHING_APP_ID 环境变量未设置');
  throw new Error('NEXT_PUBLIC_AUTHING_APP_ID environment variable is required');
}

export { AUTHING_APP_ID };