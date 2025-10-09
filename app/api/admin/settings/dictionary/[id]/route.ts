import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { cache, CACHE_KEYS } from "@/lib/cache";
import {
  getDictionaryItemById,
  updateDictionaryItem,
  deleteDictionaryItem,
} from "@/lib/repositories/dictionary.repository";

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

    // 使用 CloudBase 仓储层获取数据
    const setting = await getDictionaryItemById(id);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    // 检查用户是否为管理员
    if (!user.isAdmin) {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();
    const { displayName, value, description, isEnabled, sortOrder } = data;

    // 构建更新数据对象
    const updateData: Record<string, string | number | boolean | undefined> = {
      updatedBy: user.sub,
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (value !== undefined) updateData.value = value;
    if (description !== undefined) updateData.description = description;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (data.key !== undefined) updateData.key = data.key;

    // 使用 CloudBase 仓储层更新数据
    const updatedSetting = await updateDictionaryItem(id, updateData);

    // 清除相关缓存
    cache.delete(CACHE_KEYS.DICTIONARY_ITEMS);

    return NextResponse.json(updatedSetting);
  } catch (error) {
    console.error("更新字典项失败:", error);
    
    // 处理特定错误
    if (error instanceof Error) {
      if (error.message === "字典项不存在") {
        return NextResponse.json(
          { error: "字典项不存在" },
          { status: 404 }
        );
      }
      if (error.message === "系统内置设置不允许修改键名") {
        return NextResponse.json(
          { error: "系统内置设置不允许修改键名" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "更新字典项失败" },
      { status: 500 }
    );
  }
}

// 删除字典项
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // 使用 CloudBase 仓储层删除数据
    await deleteDictionaryItem(id);

    // 清除相关缓存
    cache.delete(CACHE_KEYS.DICTIONARY_ITEMS);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除字典项失败:", error);
    
    // 处理特定错误
    if (error instanceof Error) {
      if (error.message === "字典项不存在") {
        return NextResponse.json(
          { error: "字典项不存在" },
          { status: 404 }
        );
      }
      if (error.message === "系统内置设置不允许删除") {
        return NextResponse.json(
          { error: "系统内置设置不允许删除" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "删除字典项失败" },
      { status: 500 }
    );
  }
}