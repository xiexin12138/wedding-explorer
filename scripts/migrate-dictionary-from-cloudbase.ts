/**
 * 数据字典迁移脚本：从 CloudBase 迁移到 MySQL
 * 
 * 使用方法：
 * npx tsx scripts/migrate-dictionary-from-cloudbase.ts
 */

import cloudbase from '@cloudbase/node-sdk';
import { db } from '../lib/db';
import type { SettingValueType, SettingCategory } from '@/app/generated/prisma';

// CloudBase 配置
const app = cloudbase.init({
  env: process.env.CLOUDBASE_ENV_ID || '',
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
});

const cloudbaseDB = app.database();
const CLOUDBASE_COLLECTION = 'system_settings';

// CloudBase 数据结构
interface CloudBaseDictionaryItem {
  _id: string;
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

async function main() {
  console.log('🚀 开始迁移数据字典从 CloudBase 到 MySQL...\n');

  try {
    // 1. 从 CloudBase 获取所有数据
    console.log('📥 从 CloudBase 获取数据...');
    const result = await cloudbaseDB
      .collection(CLOUDBASE_COLLECTION)
      .orderBy('sortOrder', 'asc')
      .get();

    const cloudbaseItems = result.data as CloudBaseDictionaryItem[];
    console.log(`✅ 从 CloudBase 获取到 ${cloudbaseItems.length} 条记录\n`);

    if (cloudbaseItems.length === 0) {
      console.log('⚠️  CloudBase 中没有数据，退出迁移');
      return;
    }

    // 2. 检查 MySQL 中是否已有数据
    const existingCount = await db.systemSetting.count();
    if (existingCount > 0) {
      console.log(`⚠️  MySQL 中已存在 ${existingCount} 条记录`);
      console.log('是否要清空现有数据并重新导入？(y/N)');
      
      // 在脚本中，我们直接跳过，避免误删数据
      console.log('❌ 为安全起见，脚本不会自动清空数据');
      console.log('💡 如需重新导入，请手动清空 system_settings 表后再运行脚本\n');
    }

    // 3. 迁移数据
    console.log('📤 开始迁移数据到 MySQL...');
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const item of cloudbaseItems) {
      try {
        // 检查 key 是否已存在
        const existing = await db.systemSetting.findUnique({
          where: { key: item.key },
        });

        if (existing) {
          console.log(`⏭️  跳过已存在的 key: ${item.key}`);
          skipCount++;
          continue;
        }

        // 创建新记录
        await db.systemSetting.create({
          data: {
            key: item.key,
            displayName: item.displayName,
            value: item.value || null,
            valueType: item.valueType as SettingValueType,
            category: item.category as SettingCategory,
            description: item.description || null,
            isSystem: item.isSystem,
            isEnabled: item.isEnabled,
            sortOrder: item.sortOrder,
            createdBy: item.createdBy || null,
            updatedBy: item.updatedBy || null,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          },
        });

        console.log(`✅ 成功导入: ${item.key} - ${item.displayName}`);
        successCount++;
      } catch (error) {
        console.error(`❌ 导入失败 (${item.key}):`, error);
        errorCount++;
      }
    }

    // 4. 输出统计结果
    console.log('\n📊 迁移完成！统计信息：');
    console.log(`   ✅ 成功: ${successCount} 条`);
    console.log(`   ⏭️  跳过: ${skipCount} 条`);
    console.log(`   ❌ 失败: ${errorCount} 条`);
    console.log(`   📝 总计: ${cloudbaseItems.length} 条\n`);

    // 5. 验证数据
    const finalCount = await db.systemSetting.count();
    console.log(`🔍 MySQL 中现有记录数: ${finalCount}`);

    // 6. 显示一些示例数据
    console.log('\n📋 示例数据（前 5 条）：');
    const samples = await db.systemSetting.findMany({
      take: 5,
      orderBy: { sortOrder: 'asc' },
    });
    
    samples.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.key} (${item.category}) - ${item.displayName}`);
      console.log(`      值: ${item.value?.substring(0, 50)}${item.value && item.value.length > 50 ? '...' : ''}`);
    });

    console.log('\n✨ 迁移完成！');
  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// 执行迁移
main()
  .then(() => {
    console.log('\n👋 脚本执行完毕');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 脚本执行失败:', error);
    process.exit(1);
  });

