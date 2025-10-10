/**
 * 初始化景点数据到数据字典
 * 将硬编码的示例景点数据迁移到数据字典系统
 */

import { createDictionaryItem, SettingCategory, SettingValueType } from '@/lib/repositories/dictionary.repository';
import { AttractionType } from '@/components/AttractionCard';

// 示例景点数据
const SAMPLE_ATTRACTIONS = [
  {
    key: "chenqiao_cultural_square",
    name: "陈桥文化广场",
    position: [113.2815, 23.1231] as [number, number],
    description: "文化广场，提供休闲娱乐场所",
    type: AttractionType.SCENIC,
    media: [
      {
        type: "image" as const,
        url: "https://example.com/images/cultural-square-1.jpg",
        title: "文化广场全景",
      },
      {
        type: "image" as const,
        url: "https://example.com/images/cultural-square-2.jpg",
        title: "文化广场活动区",
      },
    ],
    unlockDistance: 100,
  },
  {
    key: "chenqiao_village",
    name: "陈桥村",
    position: [113.2825, 23.1241] as [number, number],
    description: "历史悠久的村落",
    type: AttractionType.SCENIC,
    media: [
      {
        type: "image" as const,
        url: "https://example.com/images/village-1.jpg",
        title: "村落全景",
      },
      {
        type: "video" as const,
        url: "https://example.com/videos/village-history.mp4",
        title: "村落历史介绍",
      },
    ],
    unlockDistance: 150,
  },
  {
    key: "renmin_food_square",
    name: "人民美食广场",
    position: [113.2835, 23.1251] as [number, number],
    description: "提供各种当地特色美食的广场",
    type: AttractionType.FOOD,
    media: [
      {
        type: "image" as const,
        url: "https://example.com/images/food-court-1.jpg",
        title: "美食广场全景",
      },
      {
        type: "image" as const,
        url: "https://example.com/images/food-court-2.jpg",
        title: "特色小吃",
      },
    ],
    unlockDistance: 80,
  },
  {
    key: "shenzhen_mixc",
    name: "深圳万象城",
    position: [114.11056116258436, 22.538851422581348] as [number, number],
    description: "极尽奢华的超级老牌商场",
    type: AttractionType.SHOPPING,
    media: [
      {
        type: "image" as const,
        url: "https://example.com/images/mixc-1.jpg",
        title: "万象城外观",
      },
      {
        type: "image" as const,
        url: "https://example.com/images/mixc-2.jpg",
        title: "万象城内部",
      },
    ],
    unlockDistance: 80,
  },
];

async function initAttractionsData() {
  console.log('开始初始化景点数据...');

  try {
    for (const attraction of SAMPLE_ATTRACTIONS) {
      const { key, name, ...attractionData } = attraction;
      
      console.log(`正在创建景点: ${name}`);
      
      // 构建景点数据对象
      const attractionValue = {
        name,
        ...attractionData,
      };

      // 创建数据字典项
      await createDictionaryItem({
        key,
        displayName: name,
        value: JSON.stringify(attractionValue),
        description: `景点数据: ${attractionData.description}`,
        valueType: SettingValueType.JSON,
        category: SettingCategory.ATTRACTIONS,
        isSystem: false,
        isEnabled: true,
        sortOrder: 0,
        createdBy: 'system',
      });

      console.log(`✅ 景点 ${name} 创建成功`);
    }

    console.log('🎉 所有景点数据初始化完成！');
  } catch (error) {
    console.error('❌ 初始化景点数据失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initAttractionsData()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

export { initAttractionsData };
