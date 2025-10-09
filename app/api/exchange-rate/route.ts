import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getAllDictionaryItems,
  type DictionaryItem,
} from "@/lib/repositories/dictionary.repository";

// 禁用 Next.js 默认缓存，确保每次请求都获取最新数据
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 场景类型映射到 key 前缀
const SCENE_KEY_PREFIX_MAP: Record<string, string> = {
  'gift-exchange': 'game_coin_item_',        // 礼物兑换
  'auction': 'game_coin_auction_',           // 礼物拍卖
};

// 获取游戏币兑换项目（所有登录用户都可访问）
export async function GET(request: NextRequest) {
  try {
    // 只需要登录即可，不需要管理员权限
    await requireAuth(request);

    // 获取场景参数（默认为 gift-exchange）
    const { searchParams } = new URL(request.url);
    const scene = searchParams.get('scene') || 'gift-exchange';
    
    // 获取对应场景的 key 前缀
    const keyPrefix = SCENE_KEY_PREFIX_MAP[scene] || SCENE_KEY_PREFIX_MAP['gift-exchange'];

    // 获取所有字典项
    const settings = await getAllDictionaryItems();

    // 过滤出对应场景的字典项
    const coinItems = settings
      .filter((item: DictionaryItem) => item.key.startsWith(keyPrefix))
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

