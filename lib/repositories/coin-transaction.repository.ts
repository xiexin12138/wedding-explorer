/**
 * 游戏币流水仓储层 - Prisma 实现
 * 负责游戏币流水记录的 CRUD 操作
 */

import { db } from '@/lib/db';
import type { CoinTransaction, TransactionType, Prisma } from '@/app/generated/prisma';

/**
 * 创建游戏币流水记录
 */
export async function createCoinTransaction(
  data: Prisma.CoinTransactionCreateInput
): Promise<CoinTransaction> {
  try {
    return await db.coinTransaction.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('创建游戏币流水记录失败:', error);
    throw new Error('创建游戏币流水记录失败');
  }
}

/**
 * 根据 ID 获取流水记录
 */
export async function getCoinTransactionById(
  id: string
): Promise<CoinTransaction | null> {
  try {
    return await db.coinTransaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('根据 ID 获取流水记录失败:', error);
    throw new Error('获取流水记录失败');
  }
}

/**
 * 获取用户的流水记录列表
 */
export async function getUserCoinTransactions(
  userId: string,
  params?: {
    page?: number;
    pageSize?: number;
    type?: TransactionType;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{ transactions: CoinTransaction[]; total: number }> {
  try {
    const { page = 1, pageSize = 20, type, startDate, endDate } = params || {};

    const where: Prisma.CoinTransactionWhereInput = {
      userId,
    };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [transactions, total] = await Promise.all([
      db.coinTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      db.coinTransaction.count({ where }),
    ]);

    return { transactions, total };
  } catch (error) {
    console.error('获取用户流水记录失败:', error);
    throw new Error('获取用户流水记录失败');
  }
}

/**
 * 获取所有流水记录（支持分页和筛选）
 */
export async function getCoinTransactionList(params: {
  page?: number;
  pageSize?: number;
  type?: TransactionType;
  userId?: string;
  businessType?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ transactions: CoinTransaction[]; total: number }> {
  try {
    const {
      page = 1,
      pageSize = 20,
      type,
      userId,
      businessType,
      startDate,
      endDate,
    } = params;

    const where: Prisma.CoinTransactionWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (userId) {
      where.userId = userId;
    }

    if (businessType) {
      where.businessType = businessType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [transactions, total] = await Promise.all([
      db.coinTransaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      db.coinTransaction.count({ where }),
    ]);

    return { transactions, total };
  } catch (error) {
    console.error('获取流水记录列表失败:', error);
    throw new Error('获取流水记录列表失败');
  }
}

/**
 * 获取流水统计信息
 */
export async function getCoinTransactionStats(params?: {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalTransactions: number;
  totalEarned: number;
  totalSpent: number;
  netChange: number;
  typeBreakdown: Record<TransactionType, number>;
}> {
  try {
    const { userId, startDate, endDate } = params || {};

    const where: Prisma.CoinTransactionWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // 获取总数
    const totalTransactions = await db.coinTransaction.count({ where });

    // 按类型分组统计
    const typeGroups = await db.coinTransaction.groupBy({
      by: ['type'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        type: true,
      },
    });

    let totalEarned = 0;
    let totalSpent = 0;
    const typeBreakdown: Record<string, number> = {};

    typeGroups.forEach(group => {
      const sum = group._sum.amount ?? 0;
      typeBreakdown[group.type] = group._count.type;

      if (sum > 0) {
        totalEarned += sum;
      } else {
        totalSpent += Math.abs(sum);
      }
    });

    return {
      totalTransactions,
      totalEarned,
      totalSpent,
      netChange: totalEarned - totalSpent,
      typeBreakdown: typeBreakdown as Record<TransactionType, number>,
    };
  } catch (error) {
    console.error('获取流水统计信息失败:', error);
    throw new Error('获取流水统计信息失败');
  }
}

/**
 * 获取用户某个业务类型的流水记录
 */
export async function getUserBusinessTransactions(
  userId: string,
  businessType: string,
  relatedBusinessId?: string
): Promise<CoinTransaction[]> {
  try {
    const where: Prisma.CoinTransactionWhereInput = {
      userId,
      businessType,
    };

    if (relatedBusinessId) {
      where.relatedBusinessId = relatedBusinessId;
    }

    return await db.coinTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('获取业务流水记录失败:', error);
    throw new Error('获取业务流水记录失败');
  }
}

