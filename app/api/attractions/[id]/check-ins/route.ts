import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAttractionCheckIns, getAttractionCheckInStats } from "@/lib/repositories/attractions.repository";

export const revalidate = 0;

// 获取某个景点的打卡记录列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户登录（但不要求特定权限，所有登录用户都可以查看）
    await requireAuth(request);
    
    const { id: attractionId } = await params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const orderBy = (searchParams.get("orderBy") || "checkedInAt") as 'checkedInAt' | 'distance';
    const order = (searchParams.get("order") || "desc") as 'asc' | 'desc';
    const includeStats = searchParams.get("includeStats") === "true";

    const result = await getAttractionCheckIns(attractionId, {
      page,
      pageSize,
      orderBy,
      order,
    });

    // 如果请求包含统计信息
    let stats = undefined;
    if (includeStats) {
      stats = await getAttractionCheckInStats(attractionId);
    }

    return NextResponse.json({
      success: true,
      data: {
        checkIns: result.checkIns,
        total: result.total,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize),
        stats,
      },
    });
  } catch (error) {
    console.error("获取景点打卡记录失败:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "获取景点打卡记录失败" 
      },
      { status: 500 }
    );
  }
}

