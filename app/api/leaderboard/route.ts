/**
 * 游戏币排行榜 API
 * GET /api/leaderboard - 获取游戏币排行榜
 */

import { NextRequest, NextResponse } from 'next/server';
import * as userService from '@/lib/services/user.service';

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get('limit') || '10');
    const offset = Number(request.nextUrl.searchParams.get('offset') || '0');

    const result = await userService.getCoinLeaderboard({
      limit,
      offset,
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

