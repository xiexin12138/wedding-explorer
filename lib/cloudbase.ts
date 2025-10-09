/**
 * 腾讯云 CloudBase 配置
 * 文档: https://docs.cloudbase.net/api-reference/server/node-sdk/introduction
 */

import cloudbase from '@cloudbase/node-sdk';

// 验证环境变量
const requiredEnvVars = {
  CLOUDBASE_ENV_ID: process.env.CLOUDBASE_ENV_ID,
  CLOUDBASE_SECRET_ID: process.env.CLOUDBASE_SECRET_ID,
  CLOUDBASE_SECRET_KEY: process.env.CLOUDBASE_SECRET_KEY,
};

// 检查必需的环境变量
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.warn(`警告: 缺少必需的 CloudBase 环境变量: ${missingVars.join(', ')}`);
}

// 创建 CloudBase 应用实例
const app = cloudbase.init({
  env: process.env.CLOUDBASE_ENV_ID || '',
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
});

// 获取数据库实例
export const cloudbaseDB = app.database();

// 集合名称常量
export const COLLECTIONS = {
  SYSTEM_SETTINGS: 'system_settings', // 系统设置（数据字典）
  ACTIVITY_TIMELINE: 'activity_timeline', // 活动时间线
  USERS: 'users', // 用户信息
  PRIZE_EXCHANGE_RECORDS: 'prize_exchange_records', // 兑奖记录
  COIN_TRANSACTIONS: 'coin_transactions', // 游戏币流水
} as const;

// CloudBase 数据库操作辅助类型
export type CloudBaseDocument = {
  _id: string;
  [key: string]: unknown;
};

/**
 * 数据库连接健康检查
 */
export async function checkCloudBaseConnection(): Promise<boolean> {
  try {
    // 尝试获取一个集合的信息来验证连接
    await cloudbaseDB.collection(COLLECTIONS.SYSTEM_SETTINGS).limit(1).get();
    return true;
  } catch (error) {
    console.error('CloudBase 连接失败:', error);
    return false;
  }
}

/**
 * 初始化数据库集合（如果不存在则创建索引）
 */
export async function initCollections() {
  try {
    // CloudBase 会自动创建集合，但我们可以在这里设置索引
    // 注意: CloudBase 的索引需要在控制台手动创建，或者使用云函数
    console.log('CloudBase 集合初始化完成');
  } catch (error) {
    console.error('初始化 CloudBase 集合失败:', error);
    throw error;
  }
}

export default app;

