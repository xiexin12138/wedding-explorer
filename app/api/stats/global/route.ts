/**
 * 全局统计 API
 * GET /api/stats/global - 获取全局游戏币统计
 */

import { NextResponse } from 'next/server';
import * as userService from '@/lib/services/user.service';

export async function GET() {
  try {
    const stats = await userService.getGlobalStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('获取全局统计失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取全局统计失败',
      },
      { status: 500 }
    );
  }
}

