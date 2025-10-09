/**
 * 用户服务层
 * 处理用户相关的业务逻辑
 */

import * as userRepo from '@/lib/repositories/user.repository';
import * as coinTransactionRepo from '@/lib/repositories/coin-transaction.repository';
import type { User, TransactionType, CoinTransaction } from '@/app/generated/prisma';
import { db } from '@/lib/db';

/**
 * 用户登录或注册
 * 如果用户不存在则自动创建
 * 支持 Authing ID、微信 OpenID/UnionID
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

    // 优先通过 authingId 查找（Authing 登录）
    if (authingId) {
      user = await userRepo.getUserByAuthingId(authingId);
    }

    // 如果没有找到，再通过 unionId 查找（微信跨应用识别）
    if (!user && unionId) {
      user = await userRepo.getUserByUnionId(unionId);
    }

    // 如果没有找到，再通过 openId 查找（微信登录）
    if (!user && openId) {
      user = await userRepo.getUserByOpenId(openId);
    }

    // 如果用户存在，更新最后登录时间和可能更新的信息
    if (user) {
      user = await userRepo.updateUser(user.id, {
        lastLoginAt: new Date(),
        ...(nickname && { nickname }),
        ...(name && { name }),
        ...(avatar && { avatar }),
        ...(email && { email }),
        ...(isAdmin !== undefined && { role: isAdmin ? 'ADMIN' : user.role }),
      });

      // 如果提供了新的认证信息，检查是否已存在关联
      if (authingId) {
        const existingAuthingUser = await db.authingUser.findFirst({
          where: { userId: user.id },
        });
        if (!existingAuthingUser) {
          await db.authingUser.create({
            data: {
              userId: user.id,
              authingId,
            },
          });
        }
      }

      if (openId || unionId) {
        const existingWechatUser = await db.wechatUser.findFirst({
          where: { userId: user.id },
        });
        if (!existingWechatUser) {
          await db.wechatUser.create({
            data: {
              userId: user.id,
              openId: openId!,
              unionId: unionId,
            },
          });
        }
      }

      // 重新获取用户数据（包含新创建的关联）
      user = await userRepo.getUserById(user.id) as User;
    } else {
      // 用户不存在，创建新用户和关联
      user = await db.$transaction(async (tx) => {
        // 初始游戏币数量
        const INITIAL_COINS = 10;

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
  page?: number;
  pageSize?: number;
}): Promise<{
  leaderboard: User[];
  total: number;
  currentPage: number;
  pageSize: number;
}> {
  try {
    const { page = 1, pageSize = 10 } = params;
    const offset = (page - 1) * pageSize;

    const leaderboard = await userRepo.getCoinLeaderboard(pageSize, offset);

    // 获取总用户数
    const total = await db.user.count({
      where: { isActive: true },
    });

    return {
      leaderboard,
      total,
      currentPage: page,
      pageSize,
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
    return await coinTransactionRepo.getUserCoinTransactions(params.userId, {
      page: params.page,
      pageSize: params.pageSize,
      type: params.type,
      startDate: params.startDate,
      endDate: params.endDate,
    });
  } catch (error) {
    console.error('获取用户流水失败:', error);
    throw new Error('获取用户流水失败');
  }
}

