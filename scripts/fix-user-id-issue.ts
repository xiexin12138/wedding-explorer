/**
 * 诊断和修复用户ID问题
 */

import { db } from '../lib/db';

async function diagnoseUserIssue() {
  console.log('🔍 诊断用户ID问题...\n');

  try {
    // 1. 查看所有用户
    console.log('1️⃣ 查看数据库中的所有用户:');
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        nickname: true,
        name: true,
        role: true,
        coins: true,
      }
    });

    console.log(`   找到 ${users.length} 个用户:\n`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}`);
      console.log(`      昵称: ${user.nickname || '未设置'}`);
      console.log(`      邮箱: ${user.email || '未设置'}`);
      console.log(`      角色: ${user.role}`);
      console.log(`      金币: ${user.coins}`);
      console.log('');
    });

    // 2. 检查是否有 Authing 关联
    console.log('2️⃣ 检查 Authing 用户关联:');
    const authingUsers = await db.authingUser.findMany({
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          }
        }
      }
    });

    console.log(`   找到 ${authingUsers.length} 个 Authing 关联:\n`);
    authingUsers.forEach((au, index) => {
      console.log(`   ${index + 1}. Authing ID: ${au.authingId}`);
      console.log(`      用户 ID: ${au.userId}`);
      console.log(`      用户昵称: ${au.user?.nickname || '未设置'}`);
      console.log('');
    });

    // 3. 检查是否有微信关联
    console.log('3️⃣ 检查微信用户关联:');
    const wechatUsers = await db.wechatUser.findMany({
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          }
        }
      }
    });

    console.log(`   找到 ${wechatUsers.length} 个微信关联:\n`);
    wechatUsers.forEach((wu, index) => {
      console.log(`   ${index + 1}. OpenID: ${wu.openId}`);
      console.log(`      用户 ID: ${wu.userId}`);
      console.log(`      用户昵称: ${wu.user?.nickname || '未设置'}`);
      console.log('');
    });

    // 4. 给出建议
    console.log('=' .repeat(50));
    console.log('📋 诊断结果和建议:\n');

    if (users.length === 0) {
      console.log('⚠️  数据库中没有用户!');
      console.log('   建议: 请先登录一次,系统会自动创建用户记录\n');
    } else {
      console.log('✅ 数据库中有用户记录');
      console.log('\n💡 常见问题排查:\n');
      console.log('1. JWT token 中的 sub 字段与数据库用户 ID 是否匹配?');
      console.log('   - 查看浏览器控制台,找到你的 user.sub 值');
      console.log('   - 对比上面列出的用户 ID\n');
      
      console.log('2. 如果 ID 不匹配,可能的原因:');
      console.log('   - Authing 用户 ID 和数据库用户 ID 不一致');
      console.log('   - 用户注册流程有问题');
      console.log('   - 数据迁移时 ID 发生了变化\n');

      console.log('3. 临时解决方案(仅测试用):');
      console.log('   - 使用上面列出的任一有效用户 ID');
      console.log('   - 或者重新登录以同步用户信息\n');
    }

  } catch (error) {
    console.error('❌ 诊断失败:', error);
  } finally {
    await db.$disconnect();
  }
}

diagnoseUserIssue()
  .then(() => {
    console.log('✅ 诊断完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 诊断失败:', error);
    process.exit(1);
  });

