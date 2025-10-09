/**
 * 管理员调整用户游戏币 API
 * POST /api/admin/user/adjust-coins - 调整用户游戏币
 */

import { NextRequest, NextResponse } from 'next/server';
import * as userService from '@/lib/services/user.service';

export async function POST(request: NextRequest) {
  try {
    // TODO: 验证管理员权限并获取管理员 ID
    const body = await request.json();
    const { userId, amount, description, operatorId } = body;

    if (!userId || amount === undefined || !description || !operatorId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    if (amount === 0) {
      return NextResponse.json(
        { error: '调整金额不能为0' },
        { status: 400 }
      );
    }

    const result = await userService.adminAdjustCoins({
      userId,
      amount,
      description,
      operatorId,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: '调整成功',
    });
  } catch (error) {
    console.error('调整游戏币失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '调整游戏币失败',
      },
      { status: 500 }
    );
  }
}

