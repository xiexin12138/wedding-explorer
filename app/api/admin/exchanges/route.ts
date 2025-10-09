/**
 * 管理员兑奖记录管理 API
 * GET /api/admin/exchanges - 获取所有兑奖记录
 */

import { NextRequest, NextResponse } from 'next/server';
import * as prizeService from '@/lib/services/prize-exchange.service';

export async function GET(request: NextRequest) {
  try {
    // TODO: 验证管理员权限

    const page = Number(request.nextUrl.searchParams.get('page') || '1');
    const pageSize = Number(request.nextUrl.searchParams.get('pageSize') || '20');
    const status = request.nextUrl.searchParams.get('status') as any;
    const userId = request.nextUrl.searchParams.get('userId') || undefined;

    const result = await prizeService.getExchangeList({
      page,
      pageSize,
      status,
      userId,
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

