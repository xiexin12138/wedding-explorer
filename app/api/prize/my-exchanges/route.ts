/**
 * 我的兑奖记录 API
 * GET /api/prize/my-exchanges - 获取当前用户的兑奖记录
 */

import { NextRequest, NextResponse } from 'next/server';
import * as prizeService from '@/lib/services/prize-exchange.service';
import type { ExchangeStatus } from '@/app/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    // TODO: 从 session 或 token 中获取当前用户 ID
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      );
    }

    const page = Number(request.nextUrl.searchParams.get('page') || '1');
    const pageSize = Number(request.nextUrl.searchParams.get('pageSize') || '20');
    const statusParam = request.nextUrl.searchParams.get('status');
    const status = statusParam as ExchangeStatus | undefined;

    const result = await prizeService.getUserExchanges({
      userId,
      page,
      pageSize,
      status,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('获取兑奖记录失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取兑奖记录失败',
      },
      { status: 500 }
    );
  }
}

