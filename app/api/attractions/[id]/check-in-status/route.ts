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
    // requireAuth 会自动创建用户如果不存在
    const user = await requireAuth(request);
    const { id: attractionId } = await params;

    // requireAuth 保证 dbUserId 一定存在
    const userId = user.dbUserId!;

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
    
    // 返回更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : "获取打卡状态失败";

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}

