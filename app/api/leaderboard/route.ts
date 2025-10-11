/**
 * 游戏币排行榜 API
 * GET /api/leaderboard - 获取游戏币排行榜
 */

import { NextRequest, NextResponse } from 'next/server';
import * as userService from '@/lib/services/user.service';
import { withPerformanceMonitoring } from '@/lib/api-performance-wrapper';

export const GET = withPerformanceMonitoring(async (
  request: NextRequest,
  { tracker }
) => {
  const limit = Number(request.nextUrl.searchParams.get('limit') || '10');
  const offset = Number(request.nextUrl.searchParams.get('offset') || '0');
  tracker.checkpoint('解析查询参数', { limit, offset });

  const result = await userService.getCoinLeaderboard({
    limit,
    offset,
  });
  tracker.checkpoint('获取排行榜数据', { 
    total: result.total, 
    returned: result.leaderboard.length 
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
}, {
  name: '获取排行榜',
});

