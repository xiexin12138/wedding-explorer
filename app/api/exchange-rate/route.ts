import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getAllDictionaryItems,
  type DictionaryItem,
} from "@/lib/repositories/dictionary.repository";

// 禁用 Next.js 默认缓存，确保每次请求都获取最新数据
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 获取游戏币兑换项目（所有登录用户都可访问）
export async function GET(request: NextRequest) {
  try {
    // 只需要登录即可，不需要管理员权限
    await requireAuth(request);

    // 获取所有字典项
    const settings = await getAllDictionaryItems();

    // 过滤出游戏币相关的字典项（key 以 game_coin_item_ 开头）
    const coinItems = settings
      .filter((item: DictionaryItem) => item.key.startsWith("game_coin_item_"))
      .map((item: DictionaryItem) => ({
        ...item,
        id: item._id,
      }))
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    // 返回结果（不缓存，确保实时性）
    return NextResponse.json(coinItems, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("获取兑换项目失败:", error);
    return NextResponse.json(
      { error: "获取兑换项目失败" },
      { status: 500 }
    );
  }
}

