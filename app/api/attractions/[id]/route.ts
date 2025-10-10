import { NextRequest, NextResponse } from "next/server";
import { getAttractionById, updateAttraction, deleteAttraction } from "@/lib/repositories/attractions.repository";
import { requireAuth } from "@/lib/auth";
import { cache, CACHE_KEYS } from "@/lib/cache";
import { deleteAttractionMedia } from "@/lib/cos-file-manager";

// 景点数据缓存键
const ATTRACTIONS_CACHE_KEY = CACHE_KEYS.ATTRACTIONS_DATA;

export const revalidate = 0;

// 更新景点数据（需要管理员权限，只允许更新描述）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("✏️ 开始更新景点流程");
    
    const user = await requireAuth(request);
    console.log("✅ 用户认证成功:", { isAdmin: user.isAdmin, sub: user.sub });
    
    // 检查用户是否为管理员
    if (!user.isAdmin) {
      console.log("❌ 用户不是管理员");
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const { id } = await params;
    console.log("📍 景点 ID:", id);

    if (!id) {
      console.log("❌ 景点 ID 为空");
      return NextResponse.json(
        { error: "景点 ID 不能为空" },
        { status: 400 }
      );
    }

    // 获取请求体
    const body = await request.json();
    const { description, name, position, type, media, unlockDistance, isEnabled, sortOrder } = body;

    // 验证至少有一个字段需要更新
    if (!description && !name && !position && !type && media === undefined && unlockDistance === undefined && isEnabled === undefined && sortOrder === undefined) {
      return NextResponse.json(
        { error: "至少需要提供一个字段进行更新" },
        { status: 400 }
      );
    }

    // 验证字段类型
    if (description && typeof description !== 'string') {
      return NextResponse.json(
        { error: "描述内容格式错误" },
        { status: 400 }
      );
    }

    if (name && typeof name !== 'string') {
      return NextResponse.json(
        { error: "标题格式错误" },
        { status: 400 }
      );
    }

    // 获取当前景点数据
    console.log("🔍 正在获取景点数据...");
    const attraction = await getAttractionById(id);
    
    if (!attraction) {
      console.log("❌ 景点不存在");
      return NextResponse.json(
        { success: false, error: "景点不存在" },
        { status: 404 }
      );
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {};
    if (description) updateData.description = description.trim();
    if (name) updateData.name = name.trim();
    if (position) updateData.position = position;
    if (type) updateData.type = type;
    if (media !== undefined) updateData.media = media;
    if (unlockDistance !== undefined) updateData.unlockDistance = unlockDistance;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    // 更新数据库
    console.log("🔄 正在更新景点数据...");
    const updatedAttraction = await updateAttraction(id, updateData, user.sub);
    console.log("✅ 景点数据更新成功");

    // 清除缓存
    cache.delete(ATTRACTIONS_CACHE_KEY);
    console.log("✅ 缓存已清除");

    return NextResponse.json({ 
      success: true, 
      data: updatedAttraction,
      message: "景点信息更新成功"
    });
  } catch (error) {
    console.error("❌ 更新景点数据失败:", error);
    console.error("错误详情:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // 处理特定错误
    if (error instanceof Error) {
      if (error.message === "景点不存在") {
        return NextResponse.json(
          { success: false, error: "景点不存在" },
          { status: 404 }
        );
      }
      
      if (error.message === "景点键名已存在") {
        return NextResponse.json(
          { success: false, error: "景点键名已存在" },
          { status: 400 }
        );
      }
      
      // 返回具体错误信息
      return NextResponse.json(
        { success: false, error: error.message || "更新景点数据失败" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "更新景点数据失败" },
      { status: 500 }
    );
  }
}

// 删除景点数据（需要管理员权限）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("🗑️ 开始删除景点流程");
    
    const user = await requireAuth(request);
    console.log("✅ 用户认证成功:", { isAdmin: user.isAdmin, sub: user.sub });
    
    // 检查用户是否为管理员
    if (!user.isAdmin) {
      console.log("❌ 用户不是管理员");
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const { id } = await params;
    console.log("📍 景点 ID:", id);

    if (!id) {
      console.log("❌ 景点 ID 为空");
      return NextResponse.json(
        { error: "景点 ID 不能为空" },
        { status: 400 }
      );
    }

    // 1. 先获取景点数据（用于删除 COS 文件）
    console.log("🔍 正在获取景点数据...");
    const attraction = await getAttractionById(id);
    
    if (!attraction) {
      console.log("❌ 景点不存在");
      return NextResponse.json(
        { success: false, error: "景点不存在" },
        { status: 404 }
      );
    }

    // 2. 删除 COS 存储桶中的媒体文件
    console.log("🗑️ 正在删除 COS 媒体文件...");
    let mediaDeleteResult = { success: 0, failed: 0, total: 0, skipped: 0 };
    
    try {
      if (attraction.media && attraction.media.length > 0) {
        mediaDeleteResult = await deleteAttractionMedia(attraction.media);
        console.log("📊 媒体文件删除结果:", mediaDeleteResult);
      } else {
        console.log("ℹ️ 景点没有媒体文件");
      }
    } catch (mediaError) {
      console.error("⚠️ 删除媒体文件时出错（继续删除景点数据）:", mediaError);
      // 即使媒体文件删除失败，也继续删除景点数据
    }

    // 3. 删除景点数据
    console.log("🔄 正在删除景点数据...");
    await deleteAttraction(id);
    console.log("✅ 景点数据删除成功");

    // 4. 清除缓存
    cache.delete(ATTRACTIONS_CACHE_KEY);
    console.log("✅ 缓存已清除");

    // 返回详细的删除结果
    return NextResponse.json({ 
      success: true, 
      message: "景点删除成功",
      details: {
        mediaFiles: mediaDeleteResult,
      }
    });
  } catch (error) {
    console.error("❌ 删除景点数据失败:", error);
    console.error("错误详情:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // 处理特定错误
    if (error instanceof Error) {
      if (error.message === "景点不存在") {
        return NextResponse.json(
          { success: false, error: "景点不存在" },
          { status: 404 }
        );
      }
      
      // 返回具体错误信息
      return NextResponse.json(
        { success: false, error: error.message || "删除景点数据失败" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "删除景点数据失败" },
      { status: 500 }
    );
  }
}

