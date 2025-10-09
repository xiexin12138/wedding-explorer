/**
 * 将数据导入到 CloudBase
 * 使用方法：tsx scripts/import-to-cloudbase.ts
 */

import cloudbase from '@cloudbase/node-sdk';
import fs from 'fs';
import path from 'path';

// 从环境变量加载配置
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      process.env[key.trim()] = value.trim();
    }
  });
}

// 验证环境变量
if (!process.env.CLOUDBASE_ENV_ID || !process.env.CLOUDBASE_SECRET_ID || !process.env.CLOUDBASE_SECRET_KEY) {
  console.error('❌ 缺少必需的环境变量，请在 .env 文件中配置：');
  console.error('   CLOUDBASE_ENV_ID');
  console.error('   CLOUDBASE_SECRET_ID');
  console.error('   CLOUDBASE_SECRET_KEY');
  process.exit(1);
}

// 初始化 CloudBase
const app = cloudbase.init({
  env: process.env.CLOUDBASE_ENV_ID,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
});

const db = app.database();
const collection = db.collection('system_settings');

/**
 * 从数据库导出的 JSON 提取正确的数据
 * 支持从 MySQL 或 PostgreSQL 导出的格式
 */
function extractDataFromDatabaseExport(data: unknown[]): Record<string, unknown>[] {
  if (Array.isArray(data) && data.length > 0) {
    // 检查是否有 json_agg 包装（PostgreSQL 格式）
    const firstItem = data[0] as Record<string, unknown>;
    if (firstItem.json_agg && Array.isArray(firstItem.json_agg)) {
      return firstItem.json_agg as Record<string, unknown>[];
    }
    // 如果已经是正确格式，直接返回
    return data as Record<string, unknown>[];
  }
  return [];
}

/**
 * 转换日期字段
 */
function transformDates(item: Record<string, unknown>) {
  const transformed = { ...item };
  
  // 转换 createdAt
  if (transformed.createdAt) {
    if (typeof transformed.createdAt === 'string') {
      transformed.createdAt = new Date(transformed.createdAt);
    } else if (typeof transformed.createdAt === 'object' && transformed.createdAt !== null && '$date' in transformed.createdAt) {
      transformed.createdAt = new Date((transformed.createdAt as { $date: string }).$date);
    }
  } else {
    transformed.createdAt = new Date();
  }
  
  // 转换 updatedAt
  if (transformed.updatedAt) {
    if (typeof transformed.updatedAt === 'string') {
      transformed.updatedAt = new Date(transformed.updatedAt);
    } else if (typeof transformed.updatedAt === 'object' && transformed.updatedAt !== null && '$date' in transformed.updatedAt) {
      transformed.updatedAt = new Date((transformed.updatedAt as { $date: string }).$date);
    }
  } else {
    transformed.updatedAt = new Date();
  }
  
  return transformed;
}

/**
 * 导入数据
 */
async function importData() {
  const dataFile = process.argv[2] || path.resolve(__dirname, '../../Downloads/system_settings.json');
  
  console.log('📂 读取数据文件:', dataFile);
  
  if (!fs.existsSync(dataFile)) {
    console.error(`❌ 文件不存在: ${dataFile}`);
    console.log('\n使用方法:');
    console.log('  tsx scripts/import-to-cloudbase.ts [数据文件路径]');
    console.log('\n或将数据文件放在 ~/Downloads/system_settings.json');
    process.exit(1);
  }
  
  // 读取 JSON 数据
  let rawData: unknown;
  try {
    const fileContent = fs.readFileSync(dataFile, 'utf-8');
    rawData = JSON.parse(fileContent);
  } catch (error) {
    console.error('❌ 解析 JSON 文件失败:', error);
    process.exit(1);
  }
  
  // 提取正确的数据
  const items = extractDataFromDatabaseExport(rawData as unknown[]);
  
  if (items.length === 0) {
    console.error('❌ 没有找到可导入的数据');
    process.exit(1);
  }
  
  console.log(`\n✅ 找到 ${items.length} 条记录，准备导入...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const item of items) {
    try {
      // 移除数据库的 id 字段（解构但不使用）
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...itemData } = item;
      
      // 转换日期字段
      const transformedData = transformDates(itemData);
      
      // 检查是否已存在相同 key 的记录
      const existing = await collection.where({ key: transformedData.key }).get();
      
      if (existing.data && existing.data.length > 0) {
        // 更新已有记录
        const docId = existing.data[0]._id;
        await collection.doc(docId).update(transformedData);
        console.log(`🔄 更新: ${transformedData.key} (${transformedData.displayName})`);
      } else {
        // 插入新记录
        await collection.add(transformedData);
        console.log(`✅ 导入: ${transformedData.key} (${transformedData.displayName})`);
      }
      
      successCount++;
    } catch (error) {
      console.error(`❌ 导入失败 ${item.key}:`, error);
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 导入完成！`);
  console.log(`   成功: ${successCount} 条`);
  if (failCount > 0) {
    console.log(`   失败: ${failCount} 条`);
  }
  console.log('='.repeat(50) + '\n');
}

// 执行导入
importData().catch((error) => {
  console.error('❌ 导入过程出错:', error);
  process.exit(1);
});

