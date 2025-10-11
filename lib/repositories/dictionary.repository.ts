/**
 * 数据字典仓储层 - Prisma MySQL 实现
 * 负责数据字典的 CRUD 操作
 */

import { db } from '@/lib/db';
import type { SystemSetting } from '@/app/generated/prisma';
import { SettingCategory, SettingValueType } from '@/app/generated/prisma';

// 数据字典数据结构（使用 Prisma 生成的类型）
export type DictionaryItem = SystemSetting;

// 导出枚举供其他模块使用
export { SettingCategory, SettingValueType };

/**
 * 获取所有字典项
 */
export async function getAllDictionaryItems(
  category?: SettingCategory,
  isEnabled?: boolean
): Promise<DictionaryItem[]> {
  try {
    const where: {
      category?: SettingCategory;
      isEnabled?: boolean;
    } = {};

    if (category) {
      where.category = category;
    }
    if (isEnabled !== undefined) {
      where.isEnabled = isEnabled;
    }

    const items = await db.systemSetting.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return items;
  } catch (error) {
    console.error('获取字典项失败:', error);
    throw new Error('获取字典项失败');
  }
}

/**
 * 根据 ID 获取单个字典项
 */
export async function getDictionaryItemById(id: string): Promise<DictionaryItem | null> {
  try {
    const item = await db.systemSetting.findUnique({
      where: { id },
    });

    return item;
  } catch (error) {
    console.error('根据 ID 获取字典项失败:', error);
    throw new Error('获取字典项失败');
  }
}

/**
 * 根据 key 获取字典项
 */
export async function getDictionaryItemByKey(key: string): Promise<DictionaryItem | null> {
  try {
    const item = await db.systemSetting.findUnique({
      where: { key },
    });

    return item;
  } catch (error) {
    console.error('根据 key 获取字典项失败:', error);
    throw new Error('获取字典项失败');
  }
}

/**
 * 创建字典项
 */
export async function createDictionaryItem(
  data: Omit<DictionaryItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DictionaryItem> {
  try {
    // 检查 key 是否已存在
    const existing = await getDictionaryItemByKey(data.key);
    if (existing) {
      throw new Error('键名已存在');
    }

    const item = await db.systemSetting.create({
      data: {
        key: data.key,
        displayName: data.displayName,
        value: data.value,
        valueType: data.valueType,
        category: data.category,
        description: data.description,
        isSystem: data.isSystem,
        isEnabled: data.isEnabled,
        sortOrder: data.sortOrder,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
      },
    });

    return item;
  } catch (error) {
    console.error('创建字典项失败:', error);
    if (error instanceof Error && error.message === '键名已存在') {
      throw error;
    }
    throw new Error('创建字典项失败');
  }
}

/**
 * 更新字典项
 */
export async function updateDictionaryItem(
  id: string,
  data: Partial<Omit<DictionaryItem, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<DictionaryItem> {
  try {
    // 检查字典项是否存在
    const existing = await getDictionaryItemById(id);
    if (!existing) {
      throw new Error('字典项不存在');
    }

    // 系统内置设置不允许修改键名
    if (existing.isSystem && data.key && data.key !== existing.key) {
      throw new Error('系统内置设置不允许修改键名');
    }

    const item = await db.systemSetting.update({
      where: { id },
      data,
    });

    return item;
  } catch (error) {
    console.error('更新字典项失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('更新字典项失败');
  }
}

/**
 * 删除字典项
 */
export async function deleteDictionaryItem(id: string): Promise<void> {
  try {
    // 检查字典项是否存在
    const existing = await getDictionaryItemById(id);
    if (!existing) {
      throw new Error('字典项不存在');
    }

    // 系统内置设置不允许删除
    if (existing.isSystem) {
      throw new Error('系统内置设置不允许删除');
    }

    await db.systemSetting.delete({
      where: { id },
    });
  } catch (error) {
    console.error('删除字典项失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('删除字典项失败');
  }
}

/**
 * 清除所有缓存相关的辅助函数
 */
export function clearDictionaryCache() {
  // 这个函数将在 API 路由中调用
  // 实际的缓存清除逻辑在 cache.ts 中
}

