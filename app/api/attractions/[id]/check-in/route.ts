import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getAttractionById,
  checkUserAttractionCheckIn,
} from "@/lib/repositories/attractions.repository";
import { db } from "@/lib/db";
import { TransactionType } from "@/app/generated/prisma";
import { withPerformanceMonitoring, monitorDatabaseOperation } from "@/lib/api-performance-wrapper";

export const revalidate = 0;

// 打卡景点
export const POST = withPerformanceMonitoring(async (
  request: NextRequest,
  { params, tracker, dbMonitor }
) => {
  // 解析参数
  const { id: attractionId } = await params;
  tracker.checkpoint('解析请求参数');

  // 用户认证
  const user = await requireAuth(request);
  tracker.checkpoint('用户认证完成', { userId: user.sub });

  // 检查是否有数据库用户ID
  if (!user.dbUserId) {
    console.error('❌ 用户未关联到数据库!', { authingId: user.sub });
    return NextResponse.json(
      { 
        error: "用户信息异常,请联系管理员",
        details: "用户未关联到数据库"
      },
      { status: 500 }
    );
  }

  const userId = user.dbUserId;
  
  // 解析请求体
  const body = await request.json();
  const { distance, longitude, latitude } = body;
  tracker.checkpoint('解析请求体', { distance, hasLocation: !!(longitude && latitude) });

  // 获取景点信息
  const attraction = await monitorDatabaseOperation(
    dbMonitor,
    'findUnique',
    'Attraction',
    () => getAttractionById(attractionId)
  );
  tracker.checkpoint('获取景点信息', { attractionId, found: !!attraction });

  if (!attraction) {
    return NextResponse.json({ error: "景点不存在" }, { status: 404 });
  }

  // 检查景点是否启用
  if (!attraction.isActive) {
    return NextResponse.json({ error: "该景点暂未开放" }, { status: 400 });
  }

  // 检查用户是否已经打卡过
  const hasCheckedIn = await monitorDatabaseOperation(
    dbMonitor,
    'findFirst',
    'UserAttractionCheckIn',
    () => checkUserAttractionCheckIn(userId, attractionId)
  );
  tracker.checkpoint('检查打卡状态', { hasCheckedIn });

  if (hasCheckedIn) {
    return NextResponse.json(
      { error: "您已经打卡过该景点" },
      { status: 400 }
    );
  }

  // 验证距离（如果提供了距离信息）
  if (distance !== undefined && distance > attraction.unlockDistance) {
    return NextResponse.json(
      {
        error: `您距离景点太远，需要在${attraction.unlockDistance}米内才能打卡`,
      },
      { status: 400 }
    );
  }

  // 验证用户是否存在
  const existingUser = await monitorDatabaseOperation(
    dbMonitor,
    'findUnique',
    'User',
    () => db.user.findUnique({ where: { id: userId } })
  );
  tracker.checkpoint('验证用户存在', { userId, exists: !!existingUser });

  if (!existingUser) {
    console.error('❌ 用户不存在于数据库中!', { userId });
    return NextResponse.json(
      { 
        error: "用户信息异常,请重新登录",
        details: `用户ID ${userId} 不存在于数据库中`
      },
      { status: 400 }
    );
  }

  // 使用事务处理打卡和金币奖励
  const result = await monitorDatabaseOperation(
    dbMonitor,
    'transaction',
    'Database',
    () => db.$transaction(async (tx) => {
      // 创建打卡记录
      const checkInRecord = await tx.userAttractionCheckIn.create({
        data: {
          userId: userId,
          attractionId: attractionId,
          distance: distance || null,
          coinsEarned: attraction.rewardCoins,
          longitude: longitude || null,
          latitude: latitude || null,
        },
      });

      // 更新用户金币
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          coins: { increment: attraction.rewardCoins },
          totalCoinsEarned: { increment: attraction.rewardCoins },
        },
      });

      // 创建金币交易记录
      await tx.coinTransaction.create({
        data: {
          userId: userId,
          type: TransactionType.EARN,
          amount: attraction.rewardCoins,
          balanceBefore: updatedUser.coins - attraction.rewardCoins,
          balanceAfter: updatedUser.coins,
          description: `打卡景点「${attraction.name}」获得奖励`,
          relatedBusinessId: attractionId,
          businessType: "ATTRACTION_CHECK_IN",
        },
      });

      return {
        checkInRecord,
        coinsEarned: attraction.rewardCoins,
        newBalance: updatedUser.coins,
      };
    })
  );
  tracker.checkpoint('完成打卡事务', { coinsEarned: result.coinsEarned });

  return NextResponse.json({
    success: true,
    data: {
      success: true,
      coinsEarned: result.coinsEarned,
      newBalance: result.newBalance,
      checkedInAt: result.checkInRecord.checkedInAt,
    },
  });
}, {
  name: '景点打卡',
  logRequestBody: true,
});

