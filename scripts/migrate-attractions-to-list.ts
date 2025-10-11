/**
 * 迁移景点数据：将独立的字典项合并为单个列表
 * 
 * 此脚本将：
 * 1. 读取所有 ATTRACTIONS 分类的字典项
 * 2. 将它们合并为一个景点列表
 * 3. 创建新的 attractions_list 字典项
 * 4. （可选）删除旧的独立景点字典项
 */

import { getAllDictionaryItems, SettingCategory, getDictionaryItemByKey, createDictionaryItem, deleteDictionaryItem, SettingValueType } from '@/lib/repositories/dictionary.repository';
import { Attraction } from '@/lib/repositories/attractions.repository';
import * as readline from 'readline';

// 景点列表的字典键
const ATTRACTIONS_LIST_KEY = 'attractions_list';

async function migrateAttractionsToList() {
  console.log('🚀 开始迁移景点数据...\n');

  try {
    // 1. 检查是否已经存在 attractions_list
    const existingList = await getDictionaryItemByKey(ATTRACTIONS_LIST_KEY);
    if (existingList) {
      console.log('⚠️  警告：attractions_list 已经存在！');
      console.log('现有数据:', existingList.value?.substring(0, 100) + '...');
      
      const shouldContinue = await promptUser('\n是否继续？这将覆盖现有的 attractions_list。(y/n): ');
      if (!shouldContinue) {
        console.log('❌ 迁移已取消');
        process.exit(0);
      }
    }

    // 2. 获取所有 ATTRACTIONS 分类的字典项
    console.log('📖 正在读取现有景点数据...');
    const oldAttractions = await getAllDictionaryItems(SettingCategory.ATTRACTIONS, true);
    console.log(`✅ 找到 ${oldAttractions.length} 个景点字典项\n`);

    if (oldAttractions.length === 0) {
      console.log('ℹ️  没有找到需要迁移的景点数据');
      process.exit(0);
    }

    // 3. 解析并转换为新的数据格式
    console.log('🔄 正在转换数据格式...');
    const newAttractionsList: Attraction[] = [];
    const errors: Array<{ key: string; error: string }> = [];

    for (const item of oldAttractions) {
      // 跳过 attractions_list 本身
      if (item.key === ATTRACTIONS_LIST_KEY) {
        console.log(`⏭️  跳过 ${item.key}`);
        continue;
      }

      try {
        console.log(`  处理: ${item.key} - ${item.displayName}`);
        
        // 解析 JSON 数据
        let attractionData;
        try {
          attractionData = JSON.parse(item.value || '{}');
        } catch (parseError) {
          throw new Error(`解析 JSON 失败: ${parseError}`);
        }

        // 构建新的景点对象
        const newAttraction: Attraction = {
          id: item._id || `attraction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: attractionData.name || item.displayName,
          description: attractionData.description || '',
          type: attractionData.type || 'SCENIC',
          position: attractionData.position || [0, 0],
          unlockDistance: attractionData.unlockDistance || 100,
          media: attractionData.media || [],
          rewardCoins: attractionData.rewardCoins || 10,
          isActive: item.isEnabled !== false,
          sortOrder: item.sortOrder || 0,
          createdAt: item.createdAt || new Date(),
          updatedAt: item.updatedAt || new Date(),
          createdBy: item.createdBy,
          updatedBy: item.updatedBy,
        };

        newAttractionsList.push(newAttraction);
        console.log(`    ✅ 转换成功`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`    ❌ 转换失败: ${errorMessage}`);
        errors.push({ key: item.key, error: errorMessage });
      }
    }

    console.log(`\n📊 转换结果:`);
    console.log(`  - 成功: ${newAttractionsList.length} 个景点`);
    console.log(`  - 失败: ${errors.length} 个景点\n`);

    if (errors.length > 0) {
      console.log('❌ 转换失败的景点:');
      errors.forEach(({ key, error }) => {
        console.log(`  - ${key}: ${error}`);
      });
      
      const shouldContinue = await promptUser('\n是否继续保存成功转换的景点？(y/n): ');
      if (!shouldContinue) {
        console.log('❌ 迁移已取消');
        process.exit(0);
      }
    }

    if (newAttractionsList.length === 0) {
      console.log('❌ 没有成功转换的景点数据，迁移已取消');
      process.exit(1);
    }

    // 4. 保存为新的 attractions_list
    console.log('💾 正在保存新的景点列表...');
    const attractionsJson = JSON.stringify(newAttractionsList, null, 2);

    if (existingList && existingList._id) {
      // 更新现有记录
      const { updateDictionaryItem } = await import('@/lib/repositories/dictionary.repository');
      await updateDictionaryItem(existingList._id, {
        value: attractionsJson,
        updatedBy: 'migration_script',
      });
      console.log('✅ 已更新现有的 attractions_list');
    } else {
      // 创建新记录
      await createDictionaryItem({
        key: ATTRACTIONS_LIST_KEY,
        displayName: '景点列表',
        value: attractionsJson,
        description: '所有景点数据的集合（由迁移脚本创建）',
        valueType: SettingValueType.JSON,
        category: SettingCategory.ATTRACTIONS,
        isSystem: true,
        isEnabled: true,
        sortOrder: 0,
        createdBy: 'migration_script',
      });
      console.log('✅ 已创建新的 attractions_list');
    }

    // 5. 询问是否删除旧的字典项
    console.log('\n📝 迁移完成！');
    console.log(`   新的景点列表包含 ${newAttractionsList.length} 个景点`);
    
    const shouldDelete = await promptUser('\n是否删除旧的独立景点字典项？(y/n): ');
    
    if (shouldDelete) {
      console.log('\n🗑️  正在删除旧的景点字典项...');
      let deleteSuccess = 0;
      let deleteFailed = 0;

      for (const item of oldAttractions) {
        if (item.key === ATTRACTIONS_LIST_KEY || !item._id) {
          continue;
        }

        try {
          await deleteDictionaryItem(item._id);
          console.log(`  ✅ 已删除: ${item.key}`);
          deleteSuccess++;
        } catch (error) {
          console.error(`  ❌ 删除失败: ${item.key} - ${error}`);
          deleteFailed++;
        }
      }

      console.log(`\n📊 删除结果:`);
      console.log(`  - 成功: ${deleteSuccess} 个`);
      console.log(`  - 失败: ${deleteFailed} 个`);
    } else {
      console.log('\n⏭️  保留旧的景点字典项');
      console.log('⚠️  注意：请在确认新系统运行正常后手动删除旧数据');
    }

    console.log('\n🎉 迁移完成！');
  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    console.error('错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// 辅助函数：提示用户输入
function promptUser(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// 运行迁移
if (require.main === module) {
  migrateAttractionsToList()
    .then(() => {
      console.log('\n✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { migrateAttractionsToList };

