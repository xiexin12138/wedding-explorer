/**
 * 游戏系统配置
 * 可通过环境变量覆盖默认值
 * 
 * 环境变量说明：
 * - INITIAL_USER_COINS: 新用户注册时获得的初始游戏币数量，默认 10
 */

// 确保只在服务端运行
if (typeof window !== 'undefined') {
  throw new Error('🚨 game-config.ts 只能在服务端使用！不能在客户端导入此文件！');
}

/**
 * 游戏系统配置对象
 */
export const GAME_CONFIG = {
  /** 新用户注册时的初始游戏币数量 */
  initialCoins: parseInt(process.env.INITIAL_USER_COINS || '10', 10),
  
  // 未来可以在这里扩展更多游戏配置
  // 例如：
  // /** 每日最多获得游戏币数量 */
  // maxCoinsPerDay: parseInt(process.env.MAX_COINS_PER_DAY || '100', 10),
  // 
  // /** 兑换功能是否开启 */
  // exchangeEnabled: process.env.EXCHANGE_ENABLED === 'true',
} as const;

export type GameConfig = typeof GAME_CONFIG;

