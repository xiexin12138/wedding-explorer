const AUTHING_APP_ID = process.env.NEXT_PUBLIC_AUTHING_APP_ID;
const AUTHING_APP_SECRET = process.env.AUTHING_APP_SECRET;
const AUTHING_APP_HOST = process.env.AUTHING_APP_HOST;

if (!AUTHING_APP_ID) {
  console.error('❌ NEXT_PUBLIC_AUTHING_APP_ID 环境变量未设置');
  throw new Error('NEXT_PUBLIC_AUTHING_APP_ID environment variable is required');
}

export { AUTHING_APP_ID, AUTHING_APP_SECRET, AUTHING_APP_HOST };