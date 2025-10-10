import { NextRequest, NextResponse } from "next/server";
import { deleteDictionaryItem, getDictionaryItemById } from "@/lib/repositories/dictionary.repository";
import { requireAuth } from "@/lib/auth";
import { cache, CACHE_KEYS } from "@/lib/cache";
import { deleteAttractionMedia } from "@/lib/cos-file-manager";

// 景点数据缓存键
const ATTRACTIONS_CACHE_KEY = CACHE_KEYS.ATTRACTIONS_DATA;

export const revalidate = 0;

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
    const attraction = await getDictionaryItemById(id);
    
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
      // 解析景点数据中的媒体文件
      let media: Array<{ type: 'image' | 'video'; url: string; title?: string }> | undefined;
      
      if (attraction.value && typeof attraction.value === 'string') {
        try {
          const attractionData = JSON.parse(attraction.value);
          media = attractionData.media;
        } catch (parseError) {
          console.warn("⚠️ 解析景点数据失败，跳过媒体文件删除:", parseError);
        }
      }

      if (media && media.length > 0) {
        mediaDeleteResult = await deleteAttractionMedia(media);
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
    await deleteDictionaryItem(id);
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
      if (error.message === "字典项不存在") {
        return NextResponse.json(
          { success: false, error: "景点不存在" },
          { status: 404 }
        );
      }
      if (error.message === "系统内置设置不允许删除") {
        return NextResponse.json(
          { success: false, error: "系统内置景点不允许删除" },
          { status: 403 }
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

