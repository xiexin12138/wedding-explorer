import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { cache, CACHE_KEYS } from "@/lib/cache";
import {
  getAllDictionaryItems,
  createDictionaryItem,
  SettingCategory,
  SettingValueType,
} from "@/lib/repositories/dictionary.repository";

// 禁用 Next.js 默认缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 获取所有字典项
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // 检查用户是否为管理员
    if (!user.isAdmin) {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    // 先尝试从缓存获取
    const cached = cache.get(CACHE_KEYS.DICTIONARY_ITEMS);
    if (cached) {
      return NextResponse.json(cached);
    }

    // 获取所有字典项
    const settings = await getAllDictionaryItems();

    // 缓存结果（缓存10分钟）
    cache.set(CACHE_KEYS.DICTIONARY_ITEMS, settings, 10 * 60 * 1000);

    return NextResponse.json(settings);
  } catch (error) {
    console.error("获取字典项失败:", error);
    return NextResponse.json(
      { error: "获取字典项失败" },
      { status: 500 }
    );
  }
}

// 创建字典项
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // 检查用户是否为管理员
    if (!user.isAdmin) {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const data = await request.json();
    const { key, displayName, value, description, valueType = SettingValueType.STRING } = data;

    // 验证必填字段
    if (!key || !displayName) {
      return NextResponse.json(
        { error: "键名和显示名称为必填项" },
        { status: 400 }
      );
    }

    // 创建字典项
    const newSetting = await createDictionaryItem({
      key,
      displayName,
      value,
      description,
      valueType,
      category: SettingCategory.SYSTEM,
      isSystem: false,
      isEnabled: true,
      sortOrder: 0,
      createdBy: user.sub,
      updatedBy: user.sub,
    });

    // 清除相关缓存
    cache.delete(CACHE_KEYS.DICTIONARY_ITEMS);
    cache.delete("exchange_rate_items"); // 同时清除兑换项目缓存

    return NextResponse.json(newSetting, { status: 201 });
  } catch (error) {
    console.error("创建字典项失败:", error);
    
    // 处理特定错误
    if (error instanceof Error && error.message === "键名已存在") {
      return NextResponse.json(
        { error: "键名已存在" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "创建字典项失败" },
      { status: 500 }
    );
  }
}