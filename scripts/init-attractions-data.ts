/**
 * 初始化景点数据到数据字典
 * 使用新的景点列表数据结构
 */

import { createAttraction, getAllAttractions } from '@/lib/repositories/attractions.repository';
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
    // 检查是否已有景点数据
    const existingAttractions = await getAllAttractions(true);
    if (existingAttractions.length > 0) {
      console.log(`⚠️  警告：已存在 ${existingAttractions.length} 个景点`);
      console.log('如果需要重新初始化，请先清空现有数据');
      return;
    }

    console.log(`准备创建 ${SAMPLE_ATTRACTIONS.length} 个示例景点...\n`);

    for (const attraction of SAMPLE_ATTRACTIONS) {
      const { key, name, position, ...attractionData } = attraction;
      
      console.log(`正在创建景点: ${name}`);
      
      try {
        // 使用新的 createAttraction 方法
        await createAttraction({
          name,
          longitude: position[0],
          latitude: position[1],
          ...attractionData,
        }, 'system');

        console.log(`  ✅ 景点 ${name} 创建成功`);
      } catch (error) {
        console.error(`  ❌ 景点 ${name} 创建失败:`, error);
      }
    }

    console.log('\n🎉 所有景点数据初始化完成！');
    
    // 显示创建结果
    const finalAttractions = await getAllAttractions(true);
    console.log(`\n📊 当前景点总数: ${finalAttractions.length}`);
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

// 导出函数供其他模块使用
export { initAttractionsData };
