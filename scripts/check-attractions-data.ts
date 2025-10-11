/**
 * 检查景点数据状态
 */

import { db } from '../lib/db';

async function checkAttractionsData() {
  console.log('🔍 检查景点数据状态...\n');

  try {
    // 检查数据库表是否存在
    console.log('1️⃣ 检查 Attraction 表...');
    const attractionsCount = await db.attraction.count();
    console.log(`   ✅ 表存在，当前有 ${attractionsCount} 个景点\n`);

    if (attractionsCount > 0) {
      console.log('2️⃣ 显示前5个景点:');
      const attractions = await db.attraction.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true,
          rewardCoins: true,
        }
      });
      attractions.forEach((attraction, index) => {
        console.log(`   ${index + 1}. ${attraction.name} (${attraction.type}) - ${attraction.isActive ? '启用' : '禁用'} - 奖励${attraction.rewardCoins}金币`);
      });
      console.log('');
    }

    // 检查用户打卡表
    console.log('3️⃣ 检查 UserAttractionCheckIn 表...');
    const checkInsCount = await db.userAttractionCheckIn.count();
    console.log(`   ✅ 表存在，当前有 ${checkInsCount} 条打卡记录\n`);

    // 检查用户表
    console.log('4️⃣ 检查 User 表...');
    const usersCount = await db.user.count();
    console.log(`   ✅ 表存在，当前有 ${usersCount} 个用户\n`);

  } catch (error) {
    console.error('❌ 检查失败:', error);
    if (error instanceof Error) {
      console.error('   错误信息:', error.message);
    }
  } finally {
    await db.$disconnect();
  }
}

checkAttractionsData()
  .then(() => {
    console.log('✅ 检查完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  });

