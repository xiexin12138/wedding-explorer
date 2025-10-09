/**
 * 兑奖记录仓储层 - Prisma 实现
 * 负责兑奖记录的 CRUD 操作
 */

import { db } from '@/lib/db';
import type { PrizeExchangeRecord, ExchangeStatus, Prisma } from '@/app/generated/prisma';

/**
 * 创建兑奖记录
 */
export async function createPrizeExchange(
  data: Prisma.PrizeExchangeRecordCreateInput
): Promise<PrizeExchangeRecord> {
  try {
    return await db.prizeExchangeRecord.create({
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
    console.error('创建兑奖记录失败:', error);
    throw new Error('创建兑奖记录失败');
  }
}

/**
 * 根据 ID 获取兑奖记录
 */
export async function getPrizeExchangeById(
  id: string
): Promise<PrizeExchangeRecord | null> {
  try {
    return await db.prizeExchangeRecord.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('根据 ID 获取兑奖记录失败:', error);
    throw new Error('获取兑奖记录失败');
  }
}

/**
 * 获取用户的兑奖记录列表
 */
export async function getUserPrizeExchanges(
  userId: number,
  params?: {
    page?: number;
    pageSize?: number;
    status?: ExchangeStatus;
  }
): Promise<{ records: PrizeExchangeRecord[]; total: number }> {
  try {
    const { page = 1, pageSize = 20, status } = params || {};

    const where: Prisma.PrizeExchangeRecordWhereInput = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    const [records, total] = await Promise.all([
      db.prizeExchangeRecord.findMany({
        where,
        orderBy: { exchangedAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      db.prizeExchangeRecord.count({ where }),
    ]);

    return { records, total };
  } catch (error) {
    console.error('获取用户兑奖记录失败:', error);
    throw new Error('获取用户兑奖记录失败');
  }
}

/**
 * 获取所有兑奖记录（支持分页和筛选）
 */
export async function getPrizeExchangeList(params: {
  page?: number;
  pageSize?: number;
  status?: ExchangeStatus;
  userId?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ records: PrizeExchangeRecord[]; total: number }> {
  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      userId,
      startDate,
      endDate,
    } = params;

    const where: Prisma.PrizeExchangeRecordWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.exchangedAt = {};
      if (startDate) {
        where.exchangedAt.gte = startDate;
      }
      if (endDate) {
        where.exchangedAt.lte = endDate;
      }
    }

    const [records, total] = await Promise.all([
      db.prizeExchangeRecord.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { exchangedAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      db.prizeExchangeRecord.count({ where }),
    ]);

    return { records, total };
  } catch (error) {
    console.error('获取兑奖记录列表失败:', error);
    throw new Error('获取兑奖记录列表失败');
  }
}

/**
 * 更新兑奖记录状态
 */
export async function updatePrizeExchangeStatus(
  id: string,
  status: ExchangeStatus,
  processedBy?: string,
  remarks?: string
): Promise<PrizeExchangeRecord> {
  try {
    const updateData: Prisma.PrizeExchangeRecordUpdateInput = {
      status,
    };

    if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'REJECTED') {
      updateData.processedAt = new Date();
    }

    if (processedBy) {
      updateData.processedBy = processedBy;
    }

    if (remarks) {
      updateData.remarks = remarks;
    }

    return await db.prizeExchangeRecord.update({
      where: { id },
      data: updateData,
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
    console.error('更新兑奖记录状态失败:', error);
    throw new Error('更新兑奖记录状态失败');
  }
}

/**
 * 更新兑奖记录
 */
export async function updatePrizeExchange(
  id: string,
  data: Prisma.PrizeExchangeRecordUpdateInput
): Promise<PrizeExchangeRecord> {
  try {
    return await db.prizeExchangeRecord.update({
      where: { id },
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
    console.error('更新兑奖记录失败:', error);
    throw new Error('更新兑奖记录失败');
  }
}

/**
 * 获取兑奖统计信息
 */
export async function getPrizeExchangeStats(params?: {
  startDate?: Date;
  endDate?: Date;
  status?: ExchangeStatus;
}): Promise<{
  totalExchanges: number;
  totalCoinsSpent: number;
  averageCoinsPerExchange: number;
  statusBreakdown: Record<ExchangeStatus, number>;
}> {
  try {
    const { startDate, endDate, status } = params || {};

    const where: Prisma.PrizeExchangeRecordWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.exchangedAt = {};
      if (startDate) {
        where.exchangedAt.gte = startDate;
      }
      if (endDate) {
        where.exchangedAt.lte = endDate;
      }
    }

    // 获取总数和总金额
    const [totalExchanges, aggregateResult] = await Promise.all([
      db.prizeExchangeRecord.count({ where }),
      db.prizeExchangeRecord.aggregate({
        where,
        _sum: {
          coinsSpent: true,
        },
        _avg: {
          coinsSpent: true,
        },
      }),
    ]);

    // 获取各状态的数量
    const statusGroups = await db.prizeExchangeRecord.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true,
      },
    });

    const statusBreakdown: Record<string, number> = {};
    statusGroups.forEach(group => {
      statusBreakdown[group.status] = group._count.status;
    });

    return {
      totalExchanges,
      totalCoinsSpent: aggregateResult._sum.coinsSpent ?? 0,
      averageCoinsPerExchange: Math.round(aggregateResult._avg.coinsSpent ?? 0),
      statusBreakdown: statusBreakdown as Record<ExchangeStatus, number>,
    };
  } catch (error) {
    console.error('获取兑奖统计信息失败:', error);
    throw new Error('获取兑奖统计信息失败');
  }
}

/**
 * 删除兑奖记录（物理删除，谨慎使用）
 */
export async function deletePrizeExchange(id: string): Promise<void> {
  try {
    await db.prizeExchangeRecord.delete({
      where: { id },
    });
  } catch (error) {
    console.error('删除兑奖记录失败:', error);
    throw new Error('删除兑奖记录失败');
  }
}

