import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getAttractionById,
  checkUserAttractionCheckIn,
} from "@/lib/repositories/attractions.repository";
import { db } from "@/lib/db";
import { TransactionType } from "@/app/generated/prisma";

export const revalidate = 0;

// 打卡景点
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id: attractionId } = await params;

    // 调试日志:查看用户信息
    console.log('👤 当前用户信息:', {
      authingId: user.sub,
      dbUserId: user.dbUserId,
      isAdmin: user.isAdmin,
    });

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

    const userId = user.dbUserId; // 使用数据库用户ID
    const body = await request.json();
    const { distance, longitude, latitude } = body;

    // 获取景点信息
    const attraction = await getAttractionById(attractionId);
    if (!attraction) {
      return NextResponse.json({ error: "景点不存在" }, { status: 404 });
    }

    // 检查景点是否启用
    if (!attraction.isActive) {
      return NextResponse.json({ error: "该景点暂未开放" }, { status: 400 });
    }

    // 检查用户是否已经打卡过
    const hasCheckedIn = await checkUserAttractionCheckIn(
      userId,
      attractionId
    );
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
    console.log('🔍 检查用户是否存在:', userId);
    const existingUser = await db.user.findUnique({
      where: { id: userId }
    });

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

    console.log('✅ 用户存在:', existingUser.nickname || existingUser.id);

    // 使用事务处理打卡和金币奖励
    const result = await db.$transaction(async (tx) => {
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
    });

    return NextResponse.json({
      success: true,
      data: {
        success: true,
        coinsEarned: result.coinsEarned,
        newBalance: result.newBalance,
        checkedInAt: result.checkInRecord.checkedInAt,
      },
    });
  } catch (error) {
    console.error("打卡失败:", error);
    console.error("错误详情:", error instanceof Error ? error.message : String(error));
    console.error("错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息");

    // 返回更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : "打卡失败";
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

