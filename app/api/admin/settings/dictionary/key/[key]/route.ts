import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// 通过key获取字典项的值
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    // 检查用户是否为管理员
    if (!user.isAdmin) {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const { key } = await params;

    const setting = await db.systemSetting.findUnique({
      where: { 
        key,
        isEnabled: true // 只返回启用的设置项
      },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "字典项不存在或已禁用" },
        { status: 404 }
      );
    }

    // 返回包含value字段的对象，以便客户端可以直接获取.value
    return NextResponse.json({ 
      value: setting.value,
      key: setting.key,
      displayName: setting.displayName,
      valueType: setting.valueType
    });
  } catch (error) {
    console.error("通过key获取字典项失败:", error);
    return NextResponse.json(
      { error: "获取字典项失败" },
      { status: 500 }
    );
  }
}