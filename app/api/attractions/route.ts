import { NextRequest, NextResponse } from "next/server";
import { getAllDictionaryItems, createDictionaryItem } from "@/lib/repositories/dictionary.repository";
import { SettingCategory, SettingValueType } from "@/lib/repositories/dictionary.repository";
import { requireAuth } from "@/lib/auth";
import { cache, CACHE_KEYS } from "@/lib/cache";

// 景点数据缓存键
const ATTRACTIONS_CACHE_KEY = CACHE_KEYS.ATTRACTIONS_DATA;

export const revalidate = 0;

// 获取所有景点数据
export async function GET() {
  try {
    // 先尝试从缓存获取
    const cached = cache.get(ATTRACTIONS_CACHE_KEY);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    // 从数据字典获取景点分类的所有数据
    const attractions = await getAllDictionaryItems(SettingCategory.ATTRACTIONS, true);

    // 解析景点数据（JSON格式）
    const parsedAttractions = attractions.map((item) => {
      try {
        const attractionData = JSON.parse(item.value || '{}');
        return {
          id: item._id,
          key: item.key,
          ...attractionData,
        };
      } catch (error) {
        console.error(`解析景点数据失败 (${item.key}):`, error);
        return null;
      }
    }).filter(Boolean);

    // 缓存结果（缓存5分钟）
    cache.set(ATTRACTIONS_CACHE_KEY, parsedAttractions, 5 * 60 * 1000);

    return NextResponse.json({ 
      success: true, 
      data: parsedAttractions 
    });
  } catch (error) {
    console.error("获取景点数据失败:", error);
    return NextResponse.json(
      { success: false, error: "获取景点数据失败" },
      { status: 500 }
    );
  }
}

// 创建新的景点数据（需要管理员权限）
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // 检查用户是否为管理员
    if (!user.isAdmin) {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const attractionData = await request.json();
    const { key, name, position, description, type, media, unlockDistance } = attractionData;

    // 验证必填字段
    if (!key || !name || !position || !description || !type) {
      return NextResponse.json(
        { error: "景点键名、名称、位置、描述和类型为必填项" },
        { status: 400 }
      );
    }

    // 构建景点数据对象
    const attractionValue = {
      name,
      position,
      description,
      type,
      media: media || [],
      unlockDistance: unlockDistance || 100,
    };

    // 创建数据字典项
    const newAttraction = await createDictionaryItem({
      key,
      displayName: name,
      value: JSON.stringify(attractionValue),
      description: `景点数据: ${description}`,
      valueType: SettingValueType.JSON,
      category: SettingCategory.ATTRACTIONS,
      isSystem: false,
      isEnabled: true,
      sortOrder: 0,
      createdBy: user.sub,
    });

    // 清除缓存
    cache.delete(ATTRACTIONS_CACHE_KEY);

    // 返回创建的景点数据
    const result = {
      id: newAttraction._id,
      key: newAttraction.key,
      ...attractionValue,
    };

    return NextResponse.json({ 
      success: true, 
      data: result 
    }, { status: 201 });
  } catch (error) {
    console.error("创建景点数据失败:", error);
    
    // 处理特定错误
    if (error instanceof Error && error.message === "键名已存在") {
      return NextResponse.json(
        { error: "景点键名已存在" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "创建景点数据失败" },
      { status: 500 }
    );
  }
}
