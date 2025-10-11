import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserCheckInRecord } from "@/lib/repositories/attractions.repository";

export const revalidate = 0;

// 获取打卡状态
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id: attractionId } = await params;

    // 使用数据库用户ID
    const userId = user.dbUserId || user.sub;

    // 获取打卡记录
    const checkInRecord = await getUserCheckInRecord(userId, attractionId);

    if (!checkInRecord) {
      return NextResponse.json({
        success: true,
        data: {
          hasCheckedIn: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        hasCheckedIn: true,
        checkInData: {
          checkedInAt: checkInRecord.checkedInAt.toISOString(),
          coinsEarned: checkInRecord.coinsEarned,
          distance: checkInRecord.distance,
        },
      },
    });
  } catch (error) {
    console.error("获取打卡状态失败:", error);

    return NextResponse.json(
      { error: "获取打卡状态失败" },
      { status: 500 }
    );
  }
}

