import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// 获取单个字典项
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    // 检查用户是否为管理员
    if (!user.isAdmin) {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const { id } = await params;

    const setting = await db.systemSetting.findUnique({
      where: { id },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "字典项不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error("获取字典项失败:", error);
    return NextResponse.json(
      { error: "获取字典项失败" },
      { status: 500 }
    );
  }
}

// 更新字典项
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    
    // 检查用户是否为管理员
    if (!user.isAdmin) {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const { id } = params;
    const data = await request.json();
    const { displayName, value, description, isEnabled, sortOrder } = data;

    // 检查字典项是否存在
    const setting = await db.systemSetting.findUnique({
      where: { id },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "字典项不存在" },
        { status: 404 }
      );
    }

    // 系统内置设置不允许修改键名
    if (setting.isSystem && data.key && data.key !== setting.key) {
      return NextResponse.json(
        { error: "系统内置设置不允许修改键名" },
        { status: 400 }
      );
    }

    const updatedSetting = await db.systemSetting.update({
      where: { id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(value !== undefined && { value }),
        ...(description !== undefined && { description }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(data.key !== undefined && { key: data.key }),
        updatedBy: user.sub,
      },
    });

    return NextResponse.json(updatedSetting);
  } catch (error) {
    console.error("更新字典项失败:", error);
    return NextResponse.json(
      { error: "更新字典项失败" },
      { status: 500 }
    );
  }
}

// 删除字典项
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    
    // 检查用户是否为管理员
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "需要管理员权限" },
        { status: 403 }
      );
    }

    const { id } = params;

    // 检查字典项是否存在
    const setting = await db.systemSetting.findUnique({
      where: { id },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "字典项不存在" },
        { status: 404 }
      );
    }

    // 系统内置设置不允许删除
    if (setting.isSystem) {
      return NextResponse.json(
        { error: "系统内置设置不允许删除" },
        { status: 400 }
      );
    }

    await db.systemSetting.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除字典项失败:", error);
    return NextResponse.json(
      { error: "删除字典项失败" },
      { status: 500 }
    );
  }
}