#!/usr/bin/env tsx
/**
 * 用户ID迁移脚本：将自增整数ID迁移为UUID
 * 
 * 这个脚本会：
 * 1. 为所有现有用户生成新的UUID
 * 2. 创建ID映射表
 * 3. 更新所有相关表的外键引用
 * 4. 验证数据完整性
 * 
 * 注意：运行此脚本前请务必备份数据库！
 */

import { PrismaClient } from '../app/generated/prisma';
import { createId } from '@paralleldrive/cuid2';

const db = new PrismaClient();

interface UserIdMapping {
  oldId: number;
  newId: string;
}

async function main() {
  console.log('🚀 开始用户ID迁移...');
  
  try {
    // 1. 获取所有现有用户
    console.log('📋 获取所有现有用户...');
    const existingUsers = await db.$queryRaw<Array<{
      id: number;
      email: string | null;
      nickname: string | null;
      name: string | null;
      avatar: string | null;
      role: string;
      isActive: boolean;
      lastLoginAt: Date | null;
      coins: number;
      totalCoinsEarned: number;
      totalCoinsSpent: number;
      createdAt: Date;
      updatedAt: Date;
    }>>`SELECT * FROM users ORDER BY id`;
    
    console.log(`📊 找到 ${existingUsers.length} 个用户需要迁移`);
    
    if (existingUsers.length === 0) {
      console.log('✅ 没有用户需要迁移');
      return;
    }
    
    // 2. 生成ID映射
    console.log('🔄 生成用户ID映射...');
    const userIdMappings: UserIdMapping[] = existingUsers.map(user => ({
      oldId: user.id,
      newId: createId()
    }));
    
    console.log('📝 ID映射示例:');
    userIdMappings.slice(0, 3).forEach(mapping => {
      console.log(`  ${mapping.oldId} -> ${mapping.newId}`);
    });
    
    // 3. 开始事务迁移
    console.log('🔄 开始数据库事务迁移...');
    
    await db.$transaction(async (tx) => {
      // 3.1 创建临时用户表
      console.log('  📋 创建临时用户表...');
      await tx.$executeRaw`
        CREATE TABLE users_new (
          id VARCHAR(191) PRIMARY KEY,
          email VARCHAR(255),
          nickname VARCHAR(100),
          name VARCHAR(100),
          avatar TEXT,
          role ENUM('ADMIN', 'BRIDE', 'GROOM', 'FAMILY', 'FRIEND', 'GUEST') DEFAULT 'GUEST',
          isActive BOOLEAN DEFAULT TRUE,
          lastLoginAt DATETIME(3),
          coins INT DEFAULT 0,
          totalCoinsEarned INT DEFAULT 0,
          totalCoinsSpent INT DEFAULT 0,
          createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
          updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          INDEX idx_email (email),
          INDEX idx_role (role),
          INDEX idx_coins (coins),
          INDEX idx_totalCoinsEarned (totalCoinsEarned),
          INDEX idx_isActive (isActive)
        )
      `;
      
      // 3.2 插入用户数据到新表
      console.log('  📝 迁移用户数据...');
      for (const user of existingUsers) {
        const mapping = userIdMappings.find(m => m.oldId === user.id)!;
        await tx.$executeRaw`
          INSERT INTO users_new (
            id, email, nickname, name, avatar, role, isActive, 
            lastLoginAt, coins, totalCoinsEarned, totalCoinsSpent, 
            createdAt, updatedAt
          ) VALUES (
            ${mapping.newId}, ${user.email}, ${user.nickname}, ${user.name}, 
            ${user.avatar}, ${user.role}, ${user.isActive}, ${user.lastLoginAt}, 
            ${user.coins}, ${user.totalCoinsEarned}, ${user.totalCoinsSpent}, 
            ${user.createdAt}, ${user.updatedAt}
          )
        `;
      }
      
      // 3.3 更新 authing_users 表
      console.log('  🔄 更新 authing_users 表...');
      const authingUsers = await tx.$queryRaw<Array<{
        id: number;
        userId: number;
        authingId: string;
        createdAt: Date;
        updatedAt: Date;
      }>>`SELECT * FROM authing_users`;
      
      if (authingUsers.length > 0) {
        await tx.$executeRaw`
          CREATE TABLE authing_users_new (
            id VARCHAR(191) PRIMARY KEY,
            userId VARCHAR(191) UNIQUE NOT NULL,
            authingId VARCHAR(100) UNIQUE NOT NULL,
            createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
            updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            INDEX idx_authingId (authingId),
            INDEX idx_userId (userId)
          )
        `;
        
        for (const authUser of authingUsers) {
          const userMapping = userIdMappings.find(m => m.oldId === authUser.userId);
          if (userMapping) {
            await tx.$executeRaw`
              INSERT INTO authing_users_new (id, userId, authingId, createdAt, updatedAt)
              VALUES (${createId()}, ${userMapping.newId}, ${authUser.authingId}, ${authUser.createdAt}, ${authUser.updatedAt})
            `;
          }
        }
      }
      
      // 3.4 更新 wechat_users 表
      console.log('  🔄 更新 wechat_users 表...');
      const wechatUsers = await tx.$queryRaw<Array<{
        id: number;
        userId: number;
        openId: string;
        unionId: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>>`SELECT * FROM wechat_users`;
      
      if (wechatUsers.length > 0) {
        await tx.$executeRaw`
          CREATE TABLE wechat_users_new (
            id VARCHAR(191) PRIMARY KEY,
            userId VARCHAR(191) UNIQUE NOT NULL,
            openId VARCHAR(100) UNIQUE NOT NULL,
            unionId VARCHAR(100) UNIQUE,
            createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
            updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            INDEX idx_openId (openId),
            INDEX idx_unionId (unionId),
            INDEX idx_userId (userId)
          )
        `;
        
        for (const wechatUser of wechatUsers) {
          const userMapping = userIdMappings.find(m => m.oldId === wechatUser.userId);
          if (userMapping) {
            await tx.$executeRaw`
              INSERT INTO wechat_users_new (id, userId, openId, unionId, createdAt, updatedAt)
              VALUES (${createId()}, ${userMapping.newId}, ${wechatUser.openId}, ${wechatUser.unionId}, ${wechatUser.createdAt}, ${wechatUser.updatedAt})
            `;
          }
        }
      }
      
      // 3.5 更新 prize_exchange_records 表
      console.log('  🔄 更新 prize_exchange_records 表...');
      const prizeRecords = await tx.$queryRaw<Array<{
        id: string;
        userId: number;
        prizeName: string;
        prizeDesc: string | null;
        coinsSpent: number;
        userCoinsSnapshot: number;
        status: string;
        remarks: string | null;
        exchangedAt: Date;
        processedAt: Date | null;
        processedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>>`SELECT * FROM prize_exchange_records`;
      
      if (prizeRecords.length > 0) {
        await tx.$executeRaw`
          CREATE TABLE prize_exchange_records_new (
            id VARCHAR(191) PRIMARY KEY,
            userId VARCHAR(191) NOT NULL,
            prizeName VARCHAR(200) NOT NULL,
            prizeDesc TEXT,
            coinsSpent INT NOT NULL,
            userCoinsSnapshot INT NOT NULL,
            status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REJECTED') DEFAULT 'PENDING',
            remarks TEXT,
            exchangedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
            processedAt DATETIME(3),
            processedBy VARCHAR(100),
            createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
            updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            INDEX idx_userId (userId),
            INDEX idx_status (status),
            INDEX idx_exchangedAt (exchangedAt)
          )
        `;
        
        for (const record of prizeRecords) {
          const userMapping = userIdMappings.find(m => m.oldId === record.userId);
          if (userMapping) {
            await tx.$executeRaw`
              INSERT INTO prize_exchange_records_new (
                id, userId, prizeName, prizeDesc, coinsSpent, userCoinsSnapshot,
                status, remarks, exchangedAt, processedAt, processedBy, createdAt, updatedAt
              ) VALUES (
                ${record.id}, ${userMapping.newId}, ${record.prizeName}, ${record.prizeDesc},
                ${record.coinsSpent}, ${record.userCoinsSnapshot}, ${record.status}, ${record.remarks},
                ${record.exchangedAt}, ${record.processedAt}, ${record.processedBy}, ${record.createdAt}, ${record.updatedAt}
              )
            `;
          }
        }
      }
      
      // 3.6 更新 coin_transactions 表
      console.log('  🔄 更新 coin_transactions 表...');
      const coinTransactions = await tx.$queryRaw<Array<{
        id: string;
        userId: number;
        type: string;
        amount: number;
        balanceBefore: number;
        balanceAfter: number;
        description: string;
        relatedExchangeId: string | null;
        relatedBusinessId: string | null;
        businessType: string | null;
        createdAt: Date;
        operatorId: string | null;
      }>>`SELECT * FROM coin_transactions`;
      
      if (coinTransactions.length > 0) {
        await tx.$executeRaw`
          CREATE TABLE coin_transactions_new (
            id VARCHAR(191) PRIMARY KEY,
            userId VARCHAR(191) NOT NULL,
            type ENUM('EARN', 'SPEND', 'ADMIN_ADD', 'ADMIN_SUB', 'REFUND', 'SYSTEM') NOT NULL,
            amount INT NOT NULL,
            balanceBefore INT NOT NULL,
            balanceAfter INT NOT NULL,
            description VARCHAR(500) NOT NULL,
            relatedExchangeId VARCHAR(100),
            relatedBusinessId VARCHAR(100),
            businessType VARCHAR(50),
            createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
            operatorId VARCHAR(100),
            INDEX idx_userId (userId),
            INDEX idx_type (type),
            INDEX idx_createdAt (createdAt),
            INDEX idx_businessType (businessType)
          )
        `;
        
        for (const transaction of coinTransactions) {
          const userMapping = userIdMappings.find(m => m.oldId === transaction.userId);
          if (userMapping) {
            await tx.$executeRaw`
              INSERT INTO coin_transactions_new (
                id, userId, type, amount, balanceBefore, balanceAfter, description,
                relatedExchangeId, relatedBusinessId, businessType, createdAt, operatorId
              ) VALUES (
                ${transaction.id}, ${userMapping.newId}, ${transaction.type}, ${transaction.amount},
                ${transaction.balanceBefore}, ${transaction.balanceAfter}, ${transaction.description},
                ${transaction.relatedExchangeId}, ${transaction.relatedBusinessId}, ${transaction.businessType},
                ${transaction.createdAt}, ${transaction.operatorId}
              )
            `;
          }
        }
      }
      
      // 4. 替换原表
      console.log('  🔄 替换原表...');
      
      // 删除外键约束（如果存在）
      await tx.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;
      
      // 删除原表并重命名新表
      await tx.$executeRaw`DROP TABLE IF EXISTS users`;
      await tx.$executeRaw`RENAME TABLE users_new TO users`;
      
      if (authingUsers.length > 0) {
        await tx.$executeRaw`DROP TABLE IF EXISTS authing_users`;
        await tx.$executeRaw`RENAME TABLE authing_users_new TO authing_users`;
      }
      
      if (wechatUsers.length > 0) {
        await tx.$executeRaw`DROP TABLE IF EXISTS wechat_users`;
        await tx.$executeRaw`RENAME TABLE wechat_users_new TO wechat_users`;
      }
      
      if (prizeRecords.length > 0) {
        await tx.$executeRaw`DROP TABLE IF EXISTS prize_exchange_records`;
        await tx.$executeRaw`RENAME TABLE prize_exchange_records_new TO prize_exchange_records`;
      }
      
      if (coinTransactions.length > 0) {
        await tx.$executeRaw`DROP TABLE IF EXISTS coin_transactions`;
        await tx.$executeRaw`RENAME TABLE coin_transactions_new TO coin_transactions`;
      }
      
      await tx.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
    });
    
    // 5. 验证迁移结果
    console.log('✅ 验证迁移结果...');
    const newUserCount = await db.user.count();
    console.log(`📊 迁移后用户数量: ${newUserCount}`);
    
    if (newUserCount !== existingUsers.length) {
      throw new Error(`用户数量不匹配！期望: ${existingUsers.length}, 实际: ${newUserCount}`);
    }
    
    // 验证一些示例用户的数据
    const sampleUsers = await db.user.findMany({
      take: 3,
      include: {
        authingUser: true,
        wechatUser: true,
        prizeExchanges: true,
        coinTransactions: true
      }
    });
    
    console.log('📋 示例用户数据:');
    sampleUsers.forEach(user => {
      console.log(`  用户ID: ${user.id}, 昵称: ${user.nickname}, 游戏币: ${user.coins}`);
      console.log(`    关联记录 - Authing: ${user.authingUser ? '✅' : '❌'}, 兑奖: ${user.prizeExchanges.length}, 流水: ${user.coinTransactions.length}`);
    });
    
    console.log('🎉 用户ID迁移完成！');
    console.log('📝 迁移摘要:');
    console.log(`  - 迁移用户数量: ${existingUsers.length}`);
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// 运行迁移
if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ 迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 迁移脚本执行失败:', error);
      process.exit(1);
    });
}

export { main as migrateUserIdsToUuid };
