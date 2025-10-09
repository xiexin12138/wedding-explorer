/**
 * 游戏币排行榜 API
 * GET /api/leaderboard - 获取游戏币排行榜
 */

import { NextRequest, NextResponse } from 'next/server';
import * as userService from '@/lib/services/user.service';

export async function GET(request: NextRequest) {
  try {
    const page = Number(request.nextUrl.searchParams.get('page') || '1');
    const pageSize = Number(request.nextUrl.searchParams.get('pageSize') || '10');

    const result = await userService.getCoinLeaderboard({
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('获取排行榜失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取排行榜失败',
      },
      { status: 500 }
    );
  }
}

