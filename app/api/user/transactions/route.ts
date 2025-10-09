/**
 * 用户游戏币流水 API
 * GET /api/user/transactions - 获取用户的游戏币流水记录
 */

import { NextRequest, NextResponse } from 'next/server';
import * as userService from '@/lib/services/user.service';
import type { TransactionType } from '@/app/generated/prisma';

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
    const type = request.nextUrl.searchParams.get('type') as TransactionType | null;

    const result = await userService.getUserTransactions({
      userId,
      page,
      pageSize,
      type,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('获取流水记录失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取流水记录失败',
      },
      { status: 500 }
    );
  }
}

