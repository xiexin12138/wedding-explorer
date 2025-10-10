/**
 * 景点数据仓储层
 * 将所有景点作为一个列表存储在单个字典项中
 */

import { getDictionaryItemByKey, updateDictionaryItem, SettingCategory, SettingValueType, createDictionaryItem } from './dictionary.repository';
import { AttractionType } from '@/components/AttractionCard';

// 景点数据接口
export interface Attraction {
  id: string; // 唯一标识
  key: string; // 景点的唯一键名（用于代码引用）
  name: string;
  position: [number, number];
  description: string;
  type: AttractionType;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    title?: string;
  }>;
  unlockDistance?: number;
  isEnabled?: boolean; // 是否启用
  sortOrder?: number; // 排序
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

// 景点列表的字典键
const ATTRACTIONS_LIST_KEY = 'attractions_list';

/**
 * 获取所有景点数据
 */
export async function getAllAttractions(includeDisabled: boolean = false): Promise<Attraction[]> {
  try {
    const dictionaryItem = await getDictionaryItemByKey(ATTRACTIONS_LIST_KEY);
    
    if (!dictionaryItem || !dictionaryItem.value) {
      // 如果不存在，返回空数组
      return [];
    }

    try {
      const attractions = JSON.parse(dictionaryItem.value) as Attraction[];
      
      // 过滤掉禁用的景点（如果需要）
      if (!includeDisabled) {
        return attractions.filter(a => a.isEnabled !== false);
      }
      
      return attractions;
    } catch (parseError) {
      console.error('解析景点数据失败:', parseError);
      return [];
    }
  } catch (error) {
    console.error('获取景点数据失败:', error);
    throw new Error('获取景点数据失败');
  }
}

/**
 * 根据 ID 获取单个景点
 */
export async function getAttractionById(id: string): Promise<Attraction | null> {
  try {
    const attractions = await getAllAttractions(true); // 包括禁用的景点
    return attractions.find(a => a.id === id) || null;
  } catch (error) {
    console.error('根据 ID 获取景点失败:', error);
    throw new Error('获取景点失败');
  }
}

/**
 * 根据 key 获取单个景点
 */
export async function getAttractionByKey(key: string): Promise<Attraction | null> {
  try {
    const attractions = await getAllAttractions(true); // 包括禁用的景点
    return attractions.find(a => a.key === key) || null;
  } catch (error) {
    console.error('根据 key 获取景点失败:', error);
    throw new Error('获取景点失败');
  }
}

/**
 * 创建新景点
 */
export async function createAttraction(
  data: Omit<Attraction, 'id' | 'createdAt' | 'updatedAt'>,
  createdBy?: string
): Promise<Attraction> {
  try {
    const attractions = await getAllAttractions(true);
    
    // 检查 key 是否已存在
    const existingByKey = attractions.find(a => a.key === data.key);
    if (existingByKey) {
      throw new Error('景点键名已存在');
    }

    // 生成新的 ID（使用时间戳 + 随机数）
    const newId = `attraction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const now = new Date();
    const newAttraction: Attraction = {
      id: newId,
      ...data,
      isEnabled: data.isEnabled !== false, // 默认启用
      sortOrder: data.sortOrder || 0,
      createdAt: now,
      updatedAt: now,
      createdBy,
    };

    // 添加到列表
    attractions.push(newAttraction);

    // 保存到字典
    await saveAttractionsList(attractions, createdBy);

    return newAttraction;
  } catch (error) {
    console.error('创建景点失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('创建景点失败');
  }
}

/**
 * 更新景点
 */
export async function updateAttraction(
  id: string,
  data: Partial<Omit<Attraction, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>,
  updatedBy?: string
): Promise<Attraction> {
  try {
    const attractions = await getAllAttractions(true);
    
    const index = attractions.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error('景点不存在');
    }

    // 如果更新了 key，检查是否与其他景点冲突
    if (data.key && data.key !== attractions[index].key) {
      const existingByKey = attractions.find(a => a.key === data.key && a.id !== id);
      if (existingByKey) {
        throw new Error('景点键名已存在');
      }
    }

    // 更新景点
    attractions[index] = {
      ...attractions[index],
      ...data,
      updatedAt: new Date(),
      updatedBy,
    };

    // 保存到字典
    await saveAttractionsList(attractions, updatedBy);

    return attractions[index];
  } catch (error) {
    console.error('更新景点失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('更新景点失败');
  }
}

/**
 * 删除景点
 */
export async function deleteAttraction(id: string): Promise<void> {
  try {
    const attractions = await getAllAttractions(true);
    
    const index = attractions.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error('景点不存在');
    }

    // 从列表中移除
    attractions.splice(index, 1);

    // 保存到字典
    await saveAttractionsList(attractions);
  } catch (error) {
    console.error('删除景点失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('删除景点失败');
  }
}

/**
 * 批量更新景点（用于排序等操作）
 */
export async function batchUpdateAttractions(
  updates: Array<{ id: string; data: Partial<Omit<Attraction, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>> }>,
  updatedBy?: string
): Promise<Attraction[]> {
  try {
    const attractions = await getAllAttractions(true);
    
    const now = new Date();
    for (const update of updates) {
      const index = attractions.findIndex(a => a.id === update.id);
      if (index !== -1) {
        attractions[index] = {
          ...attractions[index],
          ...update.data,
          updatedAt: now,
          updatedBy,
        };
      }
    }

    // 保存到字典
    await saveAttractionsList(attractions, updatedBy);

    return attractions;
  } catch (error) {
    console.error('批量更新景点失败:', error);
    throw new Error('批量更新景点失败');
  }
}

/**
 * 保存景点列表到字典
 */
async function saveAttractionsList(attractions: Attraction[], updatedBy?: string): Promise<void> {
  try {
    // 按照 sortOrder 排序
    attractions.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
    const attractionsJson = JSON.stringify(attractions);
    
    // 检查字典项是否存在
    const dictionaryItem = await getDictionaryItemByKey(ATTRACTIONS_LIST_KEY);
    
    if (dictionaryItem && dictionaryItem._id) {
      // 更新现有字典项
      await updateDictionaryItem(dictionaryItem._id, {
        value: attractionsJson,
        updatedBy,
      });
    } else {
      // 创建新字典项
      await createDictionaryItem({
        key: ATTRACTIONS_LIST_KEY,
        displayName: '景点列表',
        value: attractionsJson,
        description: '所有景点数据的集合',
        valueType: SettingValueType.JSON,
        category: SettingCategory.ATTRACTIONS,
        isSystem: true, // 标记为系统设置，不允许直接删除
        isEnabled: true,
        sortOrder: 0,
        createdBy: updatedBy || 'system',
      });
    }
  } catch (error) {
    console.error('保存景点列表失败:', error);
    throw new Error('保存景点列表失败');
  }
}

/**
 * 初始化景点列表（如果不存在）
 */
export async function initAttractionsListIfNotExists(): Promise<void> {
  try {
    const dictionaryItem = await getDictionaryItemByKey(ATTRACTIONS_LIST_KEY);
    
    if (!dictionaryItem) {
      // 创建空的景点列表
      await saveAttractionsList([]);
      console.log('✅ 景点列表初始化成功');
    }
  } catch (error) {
    console.error('初始化景点列表失败:', error);
    throw new Error('初始化景点列表失败');
  }
}

