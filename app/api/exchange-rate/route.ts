import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getDictionaryItemByKey,
} from "@/lib/repositories/dictionary.repository";

// 禁用 Next.js 默认缓存，确保每次请求都获取最新数据
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 场景类型映射到固定的 key
const SCENE_KEY_MAP: Record<string, string> = {
  'gift-exchange': 'game_coin_exchange_list',  // 礼物兑换列表
  'auction': 'game_coin_auction_list',          // 礼物拍卖列表
};

// 获取游戏币兑换项目（所有登录用户都可访问）
export async function GET(request: NextRequest) {
  try {
    // 只需要登录即可，不需要管理员权限
    await requireAuth(request);

    // 获取场景参数（默认为 gift-exchange）
    const { searchParams } = new URL(request.url);
    const scene = searchParams.get('scene') || 'gift-exchange';
    
    // 获取对应场景的 key
    const settingKey = SCENE_KEY_MAP[scene] || SCENE_KEY_MAP['gift-exchange'];

    // 获取字典项
    const setting = await getDictionaryItemByKey(settingKey);
    
    let items = [];
    if (setting && setting.value) {
      try {
        // 解析 JSON 数组
        items = JSON.parse(setting.value);
        // 确保是数组
        if (!Array.isArray(items)) {
          items = [];
        }
      } catch (error) {
        console.error("解析兑换项目数据失败:", error);
        items = [];
      }
    }

    // 返回结果（不缓存，确保实时性）
    return NextResponse.json(items, {
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

