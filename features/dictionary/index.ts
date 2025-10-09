/**
 * Dictionary 功能模块导出
 */

// 导出类型
export type { SystemSetting as DictionaryItem } from '@/app/generated/prisma';

// 从 services 导出客户端函数并使用别名
export {
  getAllDictionaryItems as fetchDictionaryItems,
  createDictionaryItem as createDictionaryItemClient,
  updateDictionaryItem as updateDictionaryItemClient,
  deleteDictionaryItem as deleteDictionaryItemClient,
  getDictionaryItem,
  getDictionaryValueByKey,
  getDictionaryItemByKey as getDictionaryItemByKeyClient,
  getDictionaryItemsByCategory,
  getSystemDictionaryItems,
} from '@/lib/services/dictionary';

