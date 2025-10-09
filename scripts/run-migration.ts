#!/usr/bin/env tsx
/**
 * 执行用户ID迁移的主脚本
 * 
 * 使用方法:
 * npm run migrate:user-ids
 * 或
 * npx tsx scripts/run-migration.ts
 */

import { migrateUserIdsToUuid } from './migrate-user-ids-to-uuid';

async function main() {
  console.log('🚀 开始执行用户ID迁移...');
  console.log('⚠️  请确保已经备份了数据库！');
  
  // 等待用户确认
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise<string>((resolve) => {
    rl.question('是否继续执行迁移？(输入 "yes" 确认): ', resolve);
  });
  
  rl.close();
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ 迁移已取消');
    process.exit(0);
  }
  
  try {
    await migrateUserIdsToUuid();
    console.log('✅ 迁移完成！');
    console.log('📝 下一步：');
    console.log('  1. 运行 npx prisma generate 重新生成客户端');
    console.log('  2. 重启应用程序');
    console.log('  3. 测试所有功能是否正常');
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
