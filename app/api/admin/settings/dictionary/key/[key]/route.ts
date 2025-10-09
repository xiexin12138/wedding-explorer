import { NextRequest, NextResponse } from "next/server";
import { getDictionaryItemByKey } from "@/lib/repositories/dictionary.repository";

// 通过key获取字典项的值
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    // 使用 CloudBase 仓储层获取数据
    const setting = await getDictionaryItemByKey(key);

    if (!setting || !setting.isEnabled) {
      return NextResponse.json(
        { error: "字典项不存在或已禁用" },
        { status: 404 }
      );
    }

    // 返回完整的字典项对象（包含 id 用于后续更新）
    return NextResponse.json({ 
      id: setting._id,  // 将 _id 映射为 id
      value: setting.value,
      key: setting.key,
      displayName: setting.displayName,
      valueType: setting.valueType,
      description: setting.description,
      category: setting.category,
      sortOrder: setting.sortOrder,
      isEnabled: setting.isEnabled,
    });
  } catch (error) {
    console.error("通过key获取字典项失败:", error);
    return NextResponse.json(
      { error: "获取字典项失败" },
      { status: 500 }
    );
  }
}