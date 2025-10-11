/**
 * 用户仓储层 - Prisma 实现
 * 负责用户的 CRUD 操作和游戏币管理
 */

import { db } from '@/lib/db';
import type { User, Prisma, UserRole } from '@/app/generated/prisma';

/**
 * 创建用户
 */
export async function createUser(
  data: Prisma.UserCreateInput
): Promise<User> {
  try {
    return await db.user.create({
      data,
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    throw new Error('创建用户失败');
  }
}

/**
 * 根据 ID 获取用户
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    return await db.user.findUnique({
      where: { id },
      include: {
        authingUser: true,
        wechatUser: true,
      },
    });
  } catch (error) {
    console.error('根据 ID 获取用户失败:', error);
    throw new Error('获取用户失败');
  }
}

/**
 * 根据 OpenID 获取用户
 * @param includeRelations 是否包含关联表数据（默认：false，性能优化）
 */
export async function getUserByOpenId(
  openId: string,
  includeRelations: boolean = false
): Promise<User | null> {
  try {
    const wechatUser = await db.wechatUser.findUnique({
      where: { openId },
      include: {
        user: includeRelations ? {
          include: {
            authingUser: true,
            wechatUser: true,
          },
        } : true,
      },
    });
    return wechatUser?.user || null;
  } catch (error) {
    console.error('根据 OpenID 获取用户失败:', error);
    throw new Error('获取用户失败');
  }
}

/**
 * 根据 UnionID 获取用户
 * @param includeRelations 是否包含关联表数据（默认：false，性能优化）
 */
export async function getUserByUnionId(
  unionId: string,
  includeRelations: boolean = false
): Promise<User | null> {
  try {
    const wechatUser = await db.wechatUser.findUnique({
      where: { unionId },
      include: {
        user: includeRelations ? {
          include: {
            authingUser: true,
            wechatUser: true,
          },
        } : true,
      },
    });
    return wechatUser?.user || null;
  } catch (error) {
    console.error('根据 UnionID 获取用户失败:', error);
    throw new Error('获取用户失败');
  }
}

/**
 * 根据 AuthingID 获取用户
 * @param includeRelations 是否包含关联表数据（默认：false，性能优化）
 */
export async function getUserByAuthingId(
  authingId: string,
  includeRelations: boolean = false
): Promise<User | null> {
  try {
    const authingUser = await db.authingUser.findUnique({
      where: { authingId },
      include: {
        user: includeRelations ? {
          include: {
            authingUser: true,
            wechatUser: true,
          },
        } : true,
      },
    });
    return authingUser?.user || null;
  } catch (error) {
    console.error('根据 AuthingID 获取用户失败:', error);
    throw new Error('获取用户失败');
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(
  id: string,
  data: Prisma.UserUpdateInput
): Promise<User> {
  try {
    return await db.user.update({
      where: { id },
      data,
      include: {
        authingUser: true,
        wechatUser: true,
      },
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    throw new Error('更新用户失败');
  }
}

/**
 * 更新用户最后登录时间
 */
export async function updateLastLogin(id: string): Promise<User> {
  try {
    return await db.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
      include: {
        authingUser: true,
        wechatUser: true,
      },
    });
  } catch (error) {
    console.error('更新最后登录时间失败:', error);
    throw new Error('更新最后登录时间失败');
  }
}

/**
 * 获取用户游戏币余额
 */
export async function getUserCoins(userId: string): Promise<number> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { coins: true },
    });
    return user?.coins ?? 0;
  } catch (error) {
    console.error('获取用户游戏币失败:', error);
    throw new Error('获取用户游戏币失败');
  }
}

/**
 * 增加用户游戏币（原子操作）
 */
export async function addUserCoins(
  userId: string,
  amount: number
): Promise<User> {
  try {
    return await db.user.update({
      where: { id: userId },
      data: {
        coins: { increment: amount },
        totalCoinsEarned: { increment: amount },
      },
    });
  } catch (error) {
    console.error('增加用户游戏币失败:', error);
    throw new Error('增加用户游戏币失败');
  }
}

/**
 * 扣除用户游戏币（原子操作，会检查余额）
 */
export async function deductUserCoins(
  userId: string,
  amount: number
): Promise<User> {
  try {
    // 先检查余额
    const currentCoins = await getUserCoins(userId);
    if (currentCoins < amount) {
      throw new Error('游戏币余额不足');
    }

    return await db.user.update({
      where: { id: userId },
      data: {
        coins: { decrement: amount },
        totalCoinsSpent: { increment: amount },
      },
    });
  } catch (error) {
    console.error('扣除用户游戏币失败:', error);
    if (error instanceof Error && error.message === '游戏币余额不足') {
      throw error;
    }
    throw new Error('扣除用户游戏币失败');
  }
}

/**
 * 获取游戏币排行榜（按当前游戏币余额排序）
 * @param limit 返回数量，默认 10
 * @param offset 偏移量，默认 0
 * @param minCoins 最低上榜游戏币数
 */
export async function getCoinLeaderboard(
  limit: number = 10,
  offset: number = 0,
  minCoins: number = 0,
): Promise<User[]> {
  try {
    const where: Prisma.UserWhereInput = {
      isActive: true,
    };

    if (minCoins > 0) {
      where.coins = {
        gte: minCoins,
      };
    }

    return await db.user.findMany({
      where,
      orderBy: {
        coins: 'desc', // 按当前游戏币余额排序，而不是累计获得
      },
      take: limit,
      skip: offset,
    });
  } catch (error) {
    console.error('获取游戏币排行榜失败:', error);
    throw new Error('获取游戏币排行榜失败');
  }
}

/**
 * 获取某个用户在排行榜中的排名
 */
export async function getUserRank(userId: string): Promise<number> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { coins: true },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 计算有多少用户的当前游戏币余额大于当前用户
    const rank = await db.user.count({
      where: {
        coins: { gt: user.coins },
        isActive: true,
      },
    });

    return rank + 1; // 排名从 1 开始
  } catch (error) {
    console.error('获取用户排名失败:', error);
    throw new Error('获取用户排名失败');
  }
}

/**
 * 获取全局游戏币统计信息
 */
export async function getGlobalCoinStats(): Promise<{
  totalUsers: number;
  totalCoins: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  averageCoins: number;
}> {
  try {
    // 获取用户总数
    const totalUsers = await db.user.count({
      where: { isActive: true },
    });

    // 聚合统计
    const stats = await db.user.aggregate({
      where: { isActive: true },
      _sum: {
        coins: true,
        totalCoinsEarned: true,
        totalCoinsSpent: true,
      },
      _avg: {
        coins: true,
      },
    });

    return {
      totalUsers,
      totalCoins: stats._sum.coins ?? 0,
      totalCoinsEarned: stats._sum.totalCoinsEarned ?? 0,
      totalCoinsSpent: stats._sum.totalCoinsSpent ?? 0,
      averageCoins: Math.round(stats._avg.coins ?? 0),
    };
  } catch (error) {
    console.error('获取全局游戏币统计失败:', error);
    throw new Error('获取全局游戏币统计失败');
  }
}

/**
 * 获取用户列表（支持分页和筛选）
 */
export async function getUserList(params: {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  isActive?: boolean;
  searchKeyword?: string;
}): Promise<{ users: User[]; total: number }> {
  try {
    const {
      page = 1,
      pageSize = 20,
      role,
      isActive,
      searchKeyword,
    } = params;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (searchKeyword) {
      where.OR = [
        { nickname: { contains: searchKeyword } },
        { name: { contains: searchKeyword } },
        { email: { contains: searchKeyword } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      db.user.count({ where }),
    ]);

    return { users, total };
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw new Error('获取用户列表失败');
  }
}

/**
 * 删除用户（软删除，设置为不活跃）
 */
export async function softDeleteUser(id: string): Promise<User> {
  try {
    return await db.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    throw new Error('删除用户失败');
  }
}

