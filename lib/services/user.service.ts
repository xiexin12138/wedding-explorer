/**
 * 用户服务层
 * 处理用户相关的业务逻辑
 */

import * as userRepo from '@/lib/repositories/user.repository';
import * as coinTransactionRepo from '@/lib/repositories/coin-transaction.repository';
import type { User, TransactionType, CoinTransaction, Prisma } from '@/app/generated/prisma';
import { db } from '@/lib/db';
import { GAME_CONFIG } from '@/lib/game-config';
import { getDictionaryItemByKey } from '@/lib/repositories/dictionary.repository';

/**
 * 用户登录或注册（性能优化版本）
 * 如果用户不存在则自动创建
 * 支持 Authing ID、微信 OpenID/UnionID
 * 
 * 优化点：
 * 1. 减少不必要的 JOIN 查询
 * 2. 合并数据库操作，减少往返次数
 * 3. 只在必要时才重新获取用户数据
 */
export async function loginOrRegister(params: {
  authingId?: string;
  openId?: string;
  unionId?: string;
  nickname?: string;
  name?: string;
  avatar?: string;
  email?: string;
  isAdmin?: boolean;
}): Promise<User> {
  try {
    const { authingId, openId, unionId, nickname, name, avatar, email, isAdmin } = params;

    let user: User | null = null;
    let needsReload = false; // 标记是否需要重新加载用户数据

    // 优先通过 authingId 查找（Authing 登录）
    // 性能优化：不加载关联表，减少 JOIN
    if (authingId) {
      user = await userRepo.getUserByAuthingId(authingId, false);
    }

    // 如果没有找到，再通过 unionId 查找（微信跨应用识别）
    if (!user && unionId) {
      user = await userRepo.getUserByUnionId(unionId, false);
    }

    // 如果没有找到，再通过 openId 查找（微信登录）
    if (!user && openId) {
      user = await userRepo.getUserByOpenId(openId, false);
    }

    // 如果用户存在，更新最后登录时间和可能更新的信息
    if (user) {
      // 性能优化：将更新和关联检查合并到一个事务中
      await db.$transaction(async (tx) => {
        // 更新用户信息
        await tx.user.update({
          where: { id: user!.id },
          data: {
            lastLoginAt: new Date(),
            ...(nickname && { nickname }),
            ...(name && { name }),
            ...(avatar && { avatar }),
            ...(email && { email }),
            ...(isAdmin !== undefined && { role: isAdmin ? 'ADMIN' : user!.role }),
          },
        });

        // 如果提供了新的认证信息，使用 upsert 减少查询
        if (authingId) {
          try {
            await tx.authingUser.upsert({
              where: { userId: user!.id },
              update: {},
              create: {
                userId: user!.id,
                authingId,
              },
            });
            needsReload = true;
          } catch (error) {
            // 如果已存在，忽略错误
            console.log('⚠️ Authing 关联已存在或创建失败:', error);
          }
        }

        if (openId || unionId) {
          try {
            await tx.wechatUser.upsert({
              where: { userId: user!.id },
              update: {},
              create: {
                userId: user!.id,
                openId: openId!,
                unionId: unionId,
              },
            });
            needsReload = true;
          } catch (error) {
            // 如果已存在，忽略错误
            console.log('⚠️ 微信关联已存在或创建失败:', error);
          }
        }
      });

      // 只有在创建了新关联时才重新加载用户数据
      if (needsReload) {
        const reloadedUser = await userRepo.getUserById(user.id);
        if (reloadedUser) {
          user = reloadedUser;
        }
      }
    } else {
      // 用户不存在，创建新用户和关联
      user = await db.$transaction(async (tx) => {
        // 从配置中获取初始游戏币数量
        const INITIAL_COINS = GAME_CONFIG.initialCoins;

        // 创建用户（初始化游戏币）
        const newUser = await tx.user.create({
          data: {
            nickname,
            name,
            avatar,
            email,
            role: isAdmin ? 'ADMIN' : 'GUEST',
            lastLoginAt: new Date(),
            coins: INITIAL_COINS,
            totalCoinsEarned: INITIAL_COINS,
          },
        });

        // 创建 Authing 关联
        if (authingId) {
          await tx.authingUser.create({
            data: {
              userId: newUser.id,
              authingId,
            },
          });
        }

        // 创建微信关联
        if (openId) {
          await tx.wechatUser.create({
            data: {
              userId: newUser.id,
              openId,
              unionId,
            },
          });
        }

        // 创建初始游戏币流水记录
        await tx.coinTransaction.create({
          data: {
            userId: newUser.id,
            type: 'SYSTEM',
            amount: INITIAL_COINS,
            balanceBefore: 0,
            balanceAfter: INITIAL_COINS,
            description: '新用户注册奖励',
            businessType: 'REGISTER',
          },
        });

        // 返回完整的用户数据
        return await tx.user.findUnique({
          where: { id: newUser.id },
          include: {
            authingUser: true,
            wechatUser: true,
          },
        }) as User;
      });
    }

    return user;
  } catch (error) {
    console.error('用户登录或注册失败:', error);
    throw new Error('用户登录或注册失败');
  }
}

/**
 * 获取用户信息（包含排名）
 */
export async function getUserProfile(userId: string): Promise<{
  user: User;
  rank: number;
}> {
  try {
    const user = await userRepo.getUserById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const rank = await userRepo.getUserRank(userId);

    return { user, rank };
  } catch (error) {
    console.error('获取用户资料失败:', error);
    throw new Error('获取用户资料失败');
  }
}

/**
 * 增加用户游戏币（事务操作，包含流水记录）
 */
export async function addCoins(params: {
  userId: string;
  amount: number;
  description: string;
  type?: TransactionType;
  businessType?: string;
  relatedBusinessId?: string;
  operatorId?: string;
}): Promise<{
  user: User;
  transaction: CoinTransaction;
}> {
  try {
    const {
      userId,
      amount,
      description,
      type = 'EARN',
      businessType,
      relatedBusinessId,
      operatorId,
    } = params;

    if (amount <= 0) {
      throw new Error('增加的游戏币数量必须大于0');
    }

    // 使用事务确保数据一致性
    const result = await db.$transaction(async (tx) => {
      // 获取当前余额
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { coins: true },
      });

      if (!currentUser) {
        throw new Error('用户不存在');
      }

      const balanceBefore = currentUser.coins;
      const balanceAfter = balanceBefore + amount;

      // 更新用户游戏币
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          coins: { increment: amount },
          totalCoinsEarned: { increment: amount },
        },
      });

      // 创建流水记录
      const transaction = await tx.coinTransaction.create({
        data: {
          userId,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          description,
          businessType,
          relatedBusinessId,
          operatorId,
        },
      });

      return { user: updatedUser, transaction };
    });

    return result;
  } catch (error) {
    console.error('增加游戏币失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('增加游戏币失败');
  }
}

/**
 * 扣除用户游戏币（事务操作，包含流水记录）
 */
export async function deductCoins(params: {
  userId: string;
  amount: number;
  description: string;
  type?: TransactionType;
  businessType?: string;
  relatedBusinessId?: string;
  relatedExchangeId?: string;
  operatorId?: string;
}): Promise<{
  user: User;
  transaction: CoinTransaction;
}> {
  try {
    const {
      userId,
      amount,
      description,
      type = 'SPEND',
      businessType,
      relatedBusinessId,
      relatedExchangeId,
      operatorId,
    } = params;

    if (amount <= 0) {
      throw new Error('扣除的游戏币数量必须大于0');
    }

    // 使用事务确保数据一致性
    const result = await db.$transaction(async (tx) => {
      // 获取当前余额
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { coins: true },
      });

      if (!currentUser) {
        throw new Error('用户不存在');
      }

      const balanceBefore = currentUser.coins;

      // 检查余额是否足够
      if (balanceBefore < amount) {
        throw new Error('游戏币余额不足');
      }

      const balanceAfter = balanceBefore - amount;

      // 更新用户游戏币
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          coins: { decrement: amount },
          totalCoinsSpent: { increment: amount },
        },
      });

      // 创建流水记录（负数表示扣除）
      const transaction = await tx.coinTransaction.create({
        data: {
          userId,
          type,
          amount: -amount, // 负数表示扣除
          balanceBefore,
          balanceAfter,
          description,
          businessType,
          relatedBusinessId,
          relatedExchangeId,
          operatorId,
        },
      });

      return { user: updatedUser, transaction };
    });

    return result;
  } catch (error) {
    console.error('扣除游戏币失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('扣除游戏币失败');
  }
}

/**
 * 管理员调整用户游戏币
 */
export async function adminAdjustCoins(params: {
  userId: string;
  amount: number;
  description: string;
  operatorId: string;
}): Promise<{
  user: User;
  transaction: CoinTransaction;
}> {
  try {
    const { userId, amount, description, operatorId } = params;

    if (amount === 0) {
      throw new Error('调整金额不能为0');
    }

    // 根据金额正负决定是增加还是扣除
    if (amount > 0) {
      return await addCoins({
        userId,
        amount,
        description: `[管理员调整] ${description}`,
        type: 'ADMIN_ADD',
        operatorId,
      });
    } else {
      return await deductCoins({
        userId,
        amount: Math.abs(amount),
        description: `[管理员扣除] ${description}`,
        type: 'ADMIN_SUB',
        operatorId,
      });
    }
  } catch (error) {
    console.error('管理员调整游戏币失败:', error);
    throw new Error('管理员调整游戏币失败');
  }
}

/**
 * 获取游戏币排行榜
 */
export async function getCoinLeaderboard(params: {
  limit?: number;
  offset?: number;
}): Promise<{
  leaderboard: User[];
  total: number;
  totalUsers: number;
  offset: number;
  limit: number;
}> {
  try {
    const { limit = 10, offset = 0 } = params;

    // 从数据字典获取最低上榜门槛
    const minCoinsThresholdItem = await getDictionaryItemByKey(
      'LEADERBOARD_MIN_COIN_THRESHOLD'
    );
    const minCoins = minCoinsThresholdItem?.value
      ? parseInt(minCoinsThresholdItem.value, 10) + 1
      : 0;

    const where: Prisma.UserWhereInput = {
      isActive: true,
      coins: {
        gte: minCoins,
      },
    };

    const leaderboard = await userRepo.getCoinLeaderboard(
      limit,
      offset,
      minCoins
    );

    // 获取满足条件的上榜用户数
    const total = await db.user.count({
      where,
    });

    // 获取所有活跃用户总数
    const totalUsers = await db.user.count({
      where: { isActive: true },
    });

    return {
      leaderboard,
      total,
      totalUsers,
      offset,
      limit,
    };
  } catch (error) {
    console.error('获取排行榜失败:', error);
    throw new Error('获取排行榜失败');
  }
}

/**
 * 获取全局游戏币统计
 */
export async function getGlobalStats() {
  try {
    return await userRepo.getGlobalCoinStats();
  } catch (error) {
    console.error('获取全局统计失败:', error);
    throw new Error('获取全局统计失败');
  }
}

/**
 * 获取用户的游戏币流水
 */
export async function getUserTransactions(params: {
  userId: string;
  page?: number;
  pageSize?: number;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    
    const result = await coinTransactionRepo.getUserCoinTransactions(params.userId, {
      page,
      pageSize,
      type: params.type,
      startDate: params.startDate,
      endDate: params.endDate,
    });
    
    const totalPages = Math.ceil(result.total / pageSize);
    
    return {
      ...result,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error('获取用户流水失败:', error);
    throw new Error('获取用户流水失败');
  }
}

