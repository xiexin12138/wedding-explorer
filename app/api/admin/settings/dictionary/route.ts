import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { cache, CACHE_KEYS } from "@/lib/cache";
import {
  getAllDictionaryItems,
  createDictionaryItem,
  SettingCategory,
  SettingValueType,
  type DictionaryItem,
} from "@/lib/repositories/dictionary.repository";

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

    // 使用 CloudBase 仓储层获取数据（获取所有字典项，不限制分类）
    const settings = await getAllDictionaryItems();

    // 将 _id 转换为 id（CloudBase 使用 _id，前端使用 id）
    const transformedSettings = settings.map((item: DictionaryItem) => ({
      ...item,
      id: item._id,
    }));

    // 缓存结果（缓存10分钟）
    cache.set(CACHE_KEYS.DICTIONARY_ITEMS, transformedSettings, 10 * 60 * 1000);

    return NextResponse.json(transformedSettings);
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

    // 使用 CloudBase 仓储层创建数据
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
    });

    // 清除相关缓存
    cache.delete(CACHE_KEYS.DICTIONARY_ITEMS);

    // 将 _id 转换为 id（CloudBase 使用 _id，前端使用 id）
    const transformedSetting = {
      ...newSetting,
      id: newSetting._id,
    };

    return NextResponse.json(transformedSetting, { status: 201 });
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