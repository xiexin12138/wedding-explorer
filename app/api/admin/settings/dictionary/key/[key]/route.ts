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

    // 返回包含value字段的对象，以便客户端可以直接获取.value
    return NextResponse.json({ 
      value: setting.value,
      key: setting.key,
      displayName: setting.displayName,
      valueType: setting.valueType
    });
  } catch (error) {
    console.error("通过key获取字典项失败:", error);
    return NextResponse.json(
      { error: "获取字典项失败" },
      { status: 500 }
    );
  }
}