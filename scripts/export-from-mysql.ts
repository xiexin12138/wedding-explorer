/**
 * 从 MySQL 导出数据到 JSON 文件
 * 使用方法：tsx scripts/export-from-mysql.ts [输出文件路径]
 */

import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

interface ExportOptions {
  outputPath?: string;
  tables?: string[];
  pretty?: boolean;
}

/**
 * 导出单个表的数据
 */
async function exportTable(tableName: string) {
  console.log(`📤 导出表: ${tableName}`);
  
  try {
    // 根据表名查询数据
    let data: any[] = [];
    
    switch (tableName) {
      case 'system_settings':
        data = await db.systemSetting.findMany({
          orderBy: { sortOrder: 'asc' }
        });
        break;
      case 'activity_timeline':
        data = await db.activityTimeline.findMany({
          orderBy: { startTime: 'asc' }
        });
        break;
      // 可以添加更多表
      default:
        console.warn(`⚠️  未知的表名: ${tableName}`);
        return null;
    }
    
    console.log(`   ✅ 导出 ${data.length} 条记录`);
    return { tableName, count: data.length, data };
  } catch (error) {
    console.error(`   ❌ 导出失败:`, error);
    return null;
  }
}

/**
 * 导出所有表
 */
async function exportAllTables(options: ExportOptions = {}) {
  const {
    outputPath = path.resolve(process.cwd(), 'backup'),
    tables = ['system_settings', 'activity_timeline'],
    pretty = true
  } = options;
  
  console.log('🚀 开始导出数据...\n');
  console.log(`📂 输出目录: ${outputPath}`);
  console.log(`📋 导出表: ${tables.join(', ')}\n`);
  
  // 确保输出目录存在
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
    console.log(`📁 创建输出目录: ${outputPath}\n`);
  }
  
  const results: any[] = [];
  let totalCount = 0;
  
  // 导出每个表
  for (const tableName of tables) {
    const result = await exportTable(tableName);
    if (result) {
      results.push(result);
      totalCount += result.count;
      
      // 写入单独的 JSON 文件
      const filename = `${tableName}_${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(outputPath, filename);
      
      fs.writeFileSync(
        filepath,
        JSON.stringify(result.data, null, pretty ? 2 : 0),
        'utf-8'
      );
      
      console.log(`   💾 已保存: ${filename}\n`);
    }
  }
  
  // 创建汇总文件
  const summaryFilename = `backup_summary_${new Date().toISOString().split('T')[0]}.json`;
  const summaryFilepath = path.join(outputPath, summaryFilename);
  
  const summary = {
    exportTime: new Date().toISOString(),
    totalTables: results.length,
    totalRecords: totalCount,
    tables: results.map(r => ({ name: r.tableName, count: r.count })),
    databaseInfo: {
      type: 'mysql',
      prismaVersion: require('../package.json').dependencies['@prisma/client']
    }
  };
  
  fs.writeFileSync(
    summaryFilepath,
    JSON.stringify(summary, null, 2),
    'utf-8'
  );
  
  console.log('='.repeat(50));
  console.log('🎉 导出完成！');
  console.log(`   总表数: ${results.length}`);
  console.log(`   总记录数: ${totalCount}`);
  console.log(`   输出目录: ${outputPath}`);
  console.log('='.repeat(50));
  
  return summary;
}

/**
 * 导出指定表到单个文件
 */
async function exportToSingleFile(tableName: string, outputFile: string) {
  console.log(`🚀 导出表 ${tableName} 到 ${outputFile}...\n`);
  
  const result = await exportTable(tableName);
  
  if (result) {
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      outputFile,
      JSON.stringify(result.data, null, 2),
      'utf-8'
    );
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 导出完成！');
    console.log(`   记录数: ${result.count}`);
    console.log(`   文件: ${outputFile}`);
    console.log('='.repeat(50));
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.length === 0) {
      // 无参数：导出所有表到 backup 目录
      await exportAllTables();
    } else if (args.length === 1) {
      // 一个参数：指定输出目录
      await exportAllTables({ outputPath: args[0] });
    } else if (args.length === 2) {
      // 两个参数：指定表名和输出文件
      await exportToSingleFile(args[0], args[1]);
    } else {
      console.log('使用方法：');
      console.log('  tsx scripts/export-from-mysql.ts                          # 导出所有表到 backup/ 目录');
      console.log('  tsx scripts/export-from-mysql.ts ./my-backup              # 导出所有表到指定目录');
      console.log('  tsx scripts/export-from-mysql.ts system_settings data.json # 导出指定表到文件');
    }
  } catch (error) {
    console.error('❌ 导出失败:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// 执行导出
main();

