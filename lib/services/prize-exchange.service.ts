/**
 * 兑奖服务层
 * 处理兑奖相关的业务逻辑
 */

import * as prizeExchangeRepo from '@/lib/repositories/prize-exchange.repository';
import type { PrizeExchangeRecord, ExchangeStatus } from '@/app/generated/prisma';
import { db } from '@/lib/db';

/**
 * 兑换奖品参数
 */
export interface ExchangePrizeParams {
  userId: number;
  prizeName: string;
  prizeDesc?: string;
  coinsRequired: number;
  remarks?: string;
}

/**
 * 兑换奖品（事务操作）
 */
export async function exchangePrize(
  params: ExchangePrizeParams
): Promise<PrizeExchangeRecord> {
  try {
    const { userId, prizeName, prizeDesc, coinsRequired, remarks } = params;

    if (coinsRequired <= 0) {
      throw new Error('兑换所需游戏币必须大于0');
    }

    // 使用事务确保数据一致性
    const result = await db.$transaction(async (tx) => {
      // 获取用户当前游戏币余额
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { coins: true },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查余额是否足够
      if (user.coins < coinsRequired) {
        throw new Error(`游戏币余额不足，当前余额：${user.coins}，需要：${coinsRequired}`);
      }

      const userCoinsSnapshot = user.coins;

      // 扣除游戏币（使用 userService 确保创建流水记录）
      // 但这里在事务中，所以直接操作
      const balanceBefore = user.coins;
      const balanceAfter = balanceBefore - coinsRequired;

      await tx.user.update({
        where: { id: userId },
        data: {
          coins: { decrement: coinsRequired },
          totalCoinsSpent: { increment: coinsRequired },
        },
      });

      // 创建兑奖记录
      const exchangeRecord = await tx.prizeExchangeRecord.create({
        data: {
          userId,
          prizeName,
          prizeDesc,
          coinsSpent: coinsRequired,
          userCoinsSnapshot,
          status: 'PENDING',
          remarks,
        },
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

      // 创建游戏币流水记录
      await tx.coinTransaction.create({
        data: {
          userId,
          type: 'SPEND',
          amount: -coinsRequired,
          balanceBefore,
          balanceAfter,
          description: `兑换奖品：${prizeName}`,
          businessType: 'PRIZE_EXCHANGE',
          relatedBusinessId: exchangeRecord.id,
          relatedExchangeId: exchangeRecord.id,
        },
      });

      return exchangeRecord;
    });

    return result;
  } catch (error) {
    console.error('兑换奖品失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('兑换奖品失败');
  }
}

/**
 * 取消兑奖（退回游戏币）
 */
export async function cancelExchange(params: {
  exchangeId: string;
  operatorId?: string;
  reason?: string;
}): Promise<PrizeExchangeRecord> {
  try {
    const { exchangeId, operatorId, reason } = params;

    // 使用事务确保数据一致性
    const result = await db.$transaction(async (tx) => {
      // 获取兑奖记录
      const exchange = await tx.prizeExchangeRecord.findUnique({
        where: { id: exchangeId },
      });

      if (!exchange) {
        throw new Error('兑奖记录不存在');
      }

      // 只有待处理或处理中的记录可以取消
      if (exchange.status !== 'PENDING' && exchange.status !== 'PROCESSING') {
        throw new Error('该兑奖记录不能取消');
      }

      // 获取用户当前余额
      const user = await tx.user.findUnique({
        where: { id: exchange.userId },
        select: { coins: true },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      const balanceBefore = user.coins;
      const balanceAfter = balanceBefore + exchange.coinsSpent;

      // 退回游戏币
      await tx.user.update({
        where: { id: exchange.userId },
        data: {
          coins: { increment: exchange.coinsSpent },
          totalCoinsSpent: { decrement: exchange.coinsSpent }, // 减少消费总数
        },
      });

      // 更新兑奖记录状态
      const updatedExchange = await tx.prizeExchangeRecord.update({
        where: { id: exchangeId },
        data: {
          status: 'CANCELLED',
          processedAt: new Date(),
          processedBy: operatorId,
          remarks: reason
            ? `${exchange.remarks ? exchange.remarks + '\n' : ''}取消原因：${reason}`
            : exchange.remarks,
        },
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

      // 创建退款流水记录
      await tx.coinTransaction.create({
        data: {
          userId: exchange.userId,
          type: 'REFUND',
          amount: exchange.coinsSpent,
          balanceBefore,
          balanceAfter,
          description: `兑奖取消退款：${exchange.prizeName}`,
          businessType: 'PRIZE_EXCHANGE',
          relatedBusinessId: exchangeId,
          relatedExchangeId: exchangeId,
          operatorId,
        },
      });

      return updatedExchange;
    });

    return result;
  } catch (error) {
    console.error('取消兑奖失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('取消兑奖失败');
  }
}

/**
 * 拒绝兑奖（退回游戏币）
 */
export async function rejectExchange(params: {
  exchangeId: string;
  operatorId: string;
  reason: string;
}): Promise<PrizeExchangeRecord> {
  try {
    const { exchangeId, operatorId, reason } = params;

    // 使用事务确保数据一致性
    const result = await db.$transaction(async (tx) => {
      // 获取兑奖记录
      const exchange = await tx.prizeExchangeRecord.findUnique({
        where: { id: exchangeId },
      });

      if (!exchange) {
        throw new Error('兑奖记录不存在');
      }

      // 只有待处理或处理中的记录可以拒绝
      if (exchange.status !== 'PENDING' && exchange.status !== 'PROCESSING') {
        throw new Error('该兑奖记录不能拒绝');
      }

      // 获取用户当前余额
      const user = await tx.user.findUnique({
        where: { id: exchange.userId },
        select: { coins: true },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      const balanceBefore = user.coins;
      const balanceAfter = balanceBefore + exchange.coinsSpent;

      // 退回游戏币
      await tx.user.update({
        where: { id: exchange.userId },
        data: {
          coins: { increment: exchange.coinsSpent },
          totalCoinsSpent: { decrement: exchange.coinsSpent },
        },
      });

      // 更新兑奖记录状态
      const updatedExchange = await tx.prizeExchangeRecord.update({
        where: { id: exchangeId },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          processedBy: operatorId,
          remarks: `${exchange.remarks ? exchange.remarks + '\n' : ''}拒绝原因：${reason}`,
        },
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

      // 创建退款流水记录
      await tx.coinTransaction.create({
        data: {
          userId: exchange.userId,
          type: 'REFUND',
          amount: exchange.coinsSpent,
          balanceBefore,
          balanceAfter,
          description: `兑奖被拒绝退款：${exchange.prizeName}`,
          businessType: 'PRIZE_EXCHANGE',
          relatedBusinessId: exchangeId,
          relatedExchangeId: exchangeId,
          operatorId,
        },
      });

      return updatedExchange;
    });

    return result;
  } catch (error) {
    console.error('拒绝兑奖失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('拒绝兑奖失败');
  }
}

/**
 * 更新兑奖记录状态
 */
export async function updateExchangeStatus(params: {
  exchangeId: string;
  status: ExchangeStatus;
  operatorId?: string;
  remarks?: string;
}): Promise<PrizeExchangeRecord> {
  try {
    const { exchangeId, status, operatorId, remarks } = params;

    // 如果是取消或拒绝状态，需要退回游戏币
    if (status === 'CANCELLED') {
      return await cancelExchange({ exchangeId, operatorId, reason: remarks });
    }

    if (status === 'REJECTED') {
      if (!operatorId) {
        throw new Error('拒绝兑奖需要提供操作人ID');
      }
      return await rejectExchange({
        exchangeId,
        operatorId,
        reason: remarks || '未提供原因',
      });
    }

    // 其他状态直接更新
    return await prizeExchangeRepo.updatePrizeExchangeStatus(
      exchangeId,
      status,
      operatorId,
      remarks
    );
  } catch (error) {
    console.error('更新兑奖状态失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('更新兑奖状态失败');
  }
}

/**
 * 获取用户的兑奖记录
 */
export async function getUserExchanges(params: {
  userId: number;
  page?: number;
  pageSize?: number;
  status?: ExchangeStatus;
}) {
  try {
    return await prizeExchangeRepo.getUserPrizeExchanges(params.userId, {
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
    });
  } catch (error) {
    console.error('获取用户兑奖记录失败:', error);
    throw new Error('获取用户兑奖记录失败');
  }
}

/**
 * 获取兑奖记录列表（管理员）
 */
export async function getExchangeList(params: {
  page?: number;
  pageSize?: number;
  status?: ExchangeStatus;
  userId?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    return await prizeExchangeRepo.getPrizeExchangeList(params);
  } catch (error) {
    console.error('获取兑奖记录列表失败:', error);
    throw new Error('获取兑奖记录列表失败');
  }
}

/**
 * 获取兑奖统计信息
 */
export async function getExchangeStats(params?: {
  startDate?: Date;
  endDate?: Date;
  status?: ExchangeStatus;
}) {
  try {
    return await prizeExchangeRepo.getPrizeExchangeStats(params);
  } catch (error) {
    console.error('获取兑奖统计失败:', error);
    throw new Error('获取兑奖统计失败');
  }
}

/**
 * 获取兑奖记录详情
 */
export async function getExchangeDetail(exchangeId: string) {
  try {
    const exchange = await prizeExchangeRepo.getPrizeExchangeById(exchangeId);
    if (!exchange) {
      throw new Error('兑奖记录不存在');
    }
    return exchange;
  } catch (error) {
    console.error('获取兑奖详情失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('获取兑奖详情失败');
  }
}

