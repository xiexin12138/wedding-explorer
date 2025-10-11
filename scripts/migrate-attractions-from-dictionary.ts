/**
 * 将景点数据从字典迁移到数据库表
 * 
 * 使用方法:
 * npx tsx scripts/migrate-attractions-from-dictionary.ts
 */

import { db } from '../lib/db';
import { getDictionaryItemByKey } from '../lib/repositories/dictionary.repository';
import { AttractionType as PrismaAttractionType } from '@/app/generated/prisma';

// 旧的景点接口
interface OldAttraction {
  id: string;
  key: string;
  name: string;
  position: [number, number];
  description: string;
  type: string;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    title?: string;
  }>;
  unlockDistance?: number;
  isEnabled?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

// 景点类型映射
const typeMapping: Record<string, PrismaAttractionType> = {
  'scenic': PrismaAttractionType.SCENIC,
  'food': PrismaAttractionType.FOOD,
  'shopping': PrismaAttractionType.SHOPPING,
  'other': PrismaAttractionType.OTHER,
  'SCENIC': PrismaAttractionType.SCENIC,
  'FOOD': PrismaAttractionType.FOOD,
  'SHOPPING': PrismaAttractionType.SHOPPING,
  'OTHER': PrismaAttractionType.OTHER,
};

async function migrateAttractions() {
  console.log('🚀 开始迁移景点数据...\n');

  try {
    // 1. 从字典中获取景点数据
    console.log('📖 从字典中读取景点数据...');
    const dictionaryItem = await getDictionaryItemByKey('attractions_list');
    
    if (!dictionaryItem || !dictionaryItem.value) {
      console.log('❌ 未找到景点数据,迁移终止');
      return;
    }

    const oldAttractions: OldAttraction[] = JSON.parse(dictionaryItem.value);
    console.log(`✅ 找到 ${oldAttractions.length} 个景点\n`);

    if (oldAttractions.length === 0) {
      console.log('ℹ️  没有景点需要迁移');
      return;
    }

    // 2. 检查数据库中是否已经有景点数据
    const existingCount = await db.attraction.count();
    if (existingCount > 0) {
      console.log(`⚠️  数据库中已有 ${existingCount} 个景点`);
      console.log('是否继续迁移? (将跳过已存在的景点)\n');
      // 在生产环境中,这里应该添加交互式确认
    }

    // 3. 迁移每个景点
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const oldAttraction of oldAttractions) {
      try {
        console.log(`🔄 处理景点: ${oldAttraction.name}`);

        // 检查是否已存在(通过名称和位置)
        const existing = await db.attraction.findFirst({
          where: {
            name: oldAttraction.name,
            longitude: oldAttraction.position[0],
            latitude: oldAttraction.position[1],
          }
        });

        if (existing) {
          console.log(`   ⏭️  跳过 (已存在)`);
          skipCount++;
          continue;
        }

        // 转换景点类型
        const prismaType = typeMapping[oldAttraction.type] || PrismaAttractionType.OTHER;

        // 准备媒体数据
        const mediaJson = oldAttraction.media ? JSON.stringify(oldAttraction.media) : null;

        // 创建新的景点记录
        await db.attraction.create({
          data: {
            name: oldAttraction.name,
            description: oldAttraction.description,
            type: prismaType,
            longitude: oldAttraction.position[0],
            latitude: oldAttraction.position[1],
            unlockDistance: oldAttraction.unlockDistance || 100,
            media: mediaJson,
            rewardCoins: 10, // 默认奖励10金币
            isActive: oldAttraction.isEnabled !== false,
            sortOrder: oldAttraction.sortOrder || 0,
            createdBy: oldAttraction.createdBy || 'migration_script',
          }
        });

        console.log(`   ✅ 迁移成功`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ 迁移失败:`, error);
        errorCount++;
      }
    }

    // 4. 输出迁移结果
    console.log('\n' + '='.repeat(50));
    console.log('📊 迁移结果统计:');
    console.log(`   ✅ 成功: ${successCount} 个`);
    console.log(`   ⏭️  跳过: ${skipCount} 个`);
    console.log(`   ❌ 失败: ${errorCount} 个`);
    console.log(`   📝 总计: ${oldAttractions.length} 个`);
    console.log('='.repeat(50) + '\n');

    if (successCount > 0) {
      console.log('✨ 迁移完成!');
    } else {
      console.log('ℹ️  没有新景点被迁移');
    }

  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// 执行迁移
migrateAttractions()
  .then(() => {
    console.log('\n✅ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 脚本执行失败:', error);
    process.exit(1);
  });

