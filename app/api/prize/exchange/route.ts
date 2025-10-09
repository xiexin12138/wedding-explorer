/**
 * 兑换奖品 API
 * POST /api/prize/exchange - 兑换奖品
 */

import { NextRequest, NextResponse } from 'next/server';
import * as prizeService from '@/lib/services/prize-exchange.service';

export async function POST(request: NextRequest) {
  try {
    // TODO: 从 session 或 token 中获取当前用户 ID
    const body = await request.json();
    const { userId, prizeName, prizeDesc, coinsRequired, remarks } = body;

    if (!userId || !prizeName || !coinsRequired) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    if (coinsRequired <= 0) {
      return NextResponse.json(
        { error: '兑换所需游戏币必须大于0' },
        { status: 400 }
      );
    }

    const exchange = await prizeService.exchangePrize({
      userId,
      prizeName,
      prizeDesc,
      coinsRequired,
      remarks,
    });

    return NextResponse.json({
      success: true,
      data: exchange,
      message: '兑换成功',
    });
  } catch (error) {
    console.error('兑换奖品失败:', error);
    
    // 特殊处理余额不足的错误
    if (error instanceof Error && error.message.includes('余额不足')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '兑换奖品失败',
      },
      { status: 500 }
    );
  }
}

