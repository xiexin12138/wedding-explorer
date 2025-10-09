/**
 * 管理员更新兑奖状态 API
 * PUT /api/admin/exchanges/:id/status - 更新兑奖记录状态
 */

import { NextRequest, NextResponse } from 'next/server';
import * as prizeService from '@/lib/services/prize-exchange.service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    // TODO: 验证管理员权限并获取管理员 ID
    const body = await request.json();
    const { status, operatorId, remarks } = body;

    if (!status) {
      return NextResponse.json(
        { error: '缺少状态参数' },
        { status: 400 }
      );
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '无效的状态值' },
        { status: 400 }
      );
    }

    const exchange = await prizeService.updateExchangeStatus({
      exchangeId: resolvedParams.id,
      status,
      operatorId,
      remarks,
    });

    return NextResponse.json({
      success: true,
      data: exchange,
      message: '状态更新成功',
    });
  } catch (error) {
    console.error('更新兑奖状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新兑奖状态失败',
      },
      { status: 500 }
    );
  }
}

