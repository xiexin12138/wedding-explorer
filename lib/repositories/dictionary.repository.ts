/**
 * 数据字典仓储层 - CloudBase 实现
 * 负责数据字典的 CRUD 操作
 */

import { cloudbaseDB, COLLECTIONS } from '@/lib/cloudbase';

// 数据字典数据结构
export interface DictionaryItem {
  _id?: string; // CloudBase 使用 _id 作为主键
  key: string;
  displayName: string;
  value?: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY';
  category: string;
  description?: string;
  isSystem: boolean;
  isEnabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// 设置分类枚举
export enum SettingCategory {
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY',
  NOTIFICATION = 'NOTIFICATION',
  WEDDING = 'WEDDING',
  VENUE = 'VENUE',
  GUEST = 'GUEST',
  SCHEDULE = 'SCHEDULE',
  MAP = 'MAP',
  CHAT = 'CHAT',
  ANALYTICS = 'ANALYTICS',
  UI_UX = 'UI_UX',
}

// 设置值类型枚举
export enum SettingValueType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  ARRAY = 'ARRAY',
}

const collection = cloudbaseDB.collection(COLLECTIONS.SYSTEM_SETTINGS);

/**
 * 获取所有字典项
 */
export async function getAllDictionaryItems(
  category?: string,
  isEnabled?: boolean
): Promise<DictionaryItem[]> {
  try {
    let query = collection.where({});

    // 添加条件过滤
    const conditions: any = {};
    if (category) {
      conditions.category = category;
    }
    if (isEnabled !== undefined) {
      conditions.isEnabled = isEnabled;
    }

    if (Object.keys(conditions).length > 0) {
      query = collection.where(conditions);
    }

    const result = await query.orderBy('sortOrder', 'asc').get();

    return result.data as DictionaryItem[];
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
    const result = await collection.doc(id).get();

    if (!result.data || result.data.length === 0) {
      return null;
    }

    return result.data[0] as DictionaryItem;
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
    const result = await collection.where({ key }).get();

    if (!result.data || result.data.length === 0) {
      return null;
    }

    return result.data[0] as DictionaryItem;
  } catch (error) {
    console.error('根据 key 获取字典项失败:', error);
    throw new Error('获取字典项失败');
  }
}

/**
 * 创建字典项
 */
export async function createDictionaryItem(
  data: Omit<DictionaryItem, '_id' | 'createdAt' | 'updatedAt'>
): Promise<DictionaryItem> {
  try {
    // 检查 key 是否已存在
    const existing = await getDictionaryItemByKey(data.key);
    if (existing) {
      throw new Error('键名已存在');
    }

    const now = new Date();
    const newItem = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.add(newItem);

    // 返回创建的数据（包含 _id）
    return {
      _id: result.id,
      ...newItem,
    } as DictionaryItem;
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
  data: Partial<Omit<DictionaryItem, '_id' | 'createdAt' | 'updatedAt'>>
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

    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await collection.doc(id).update(updateData);

    // 获取更新后的数据
    const updated = await getDictionaryItemById(id);
    if (!updated) {
      throw new Error('更新后获取数据失败');
    }

    return updated;
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

    await collection.doc(id).remove();
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

