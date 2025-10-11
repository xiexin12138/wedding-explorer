/**
 * 用户资料 API
 * GET /api/user/profile - 获取当前用户信息（含排名）
 */

import { NextRequest, NextResponse } from 'next/server';
import * as userService from '@/lib/services/user.service';
import * as userRepo from '@/lib/repositories/user.repository';
import { isRequestAuthenticated } from '@/lib/auth';
import { getAdminIds } from '@/lib/middleware/config';
import { withPerformanceMonitoring, monitorDatabaseOperation } from '@/lib/api-performance-wrapper';

export const GET = withPerformanceMonitoring(async (
  request: NextRequest,
  { tracker, dbMonitor }
) => {
  // 优先从查询参数获取用户ID，如果没有则从认证信息获取
  const userIdParam = request.nextUrl.searchParams.get('userId');
  tracker.checkpoint('解析查询参数', { userIdParam });
  
  let user = null;

  if (userIdParam) {
    // 如果提供了 userId 参数，先尝试作为用户 ID 查询
    user = await monitorDatabaseOperation(
      dbMonitor,
      'findUnique',
      'User',
      () => userRepo.getUserById(userIdParam)
    );
    
    // 如果没找到，尝试作为 authingId 查询
    if (!user) {
      user = await monitorDatabaseOperation(
        dbMonitor,
        'findByAuthingId',
        'User',
        () => userRepo.getUserByAuthingId(userIdParam)
      );
    }
    tracker.checkpoint('通过参数查询用户', { found: !!user });
  } else {
    // 从认证信息获取
    const { isLoggedIn, user: authUser } = await isRequestAuthenticated(request);
    tracker.checkpoint('验证用户认证', { isLoggedIn });
    
    if (!isLoggedIn || !authUser) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      );
    }
    
    const authingId = authUser.sub;
    user = await monitorDatabaseOperation(
      dbMonitor,
      'findByAuthingId',
      'User',
      () => userRepo.getUserByAuthingId(authingId)
    );
    tracker.checkpoint('通过认证信息查询用户', { found: !!user });
  }

  // 如果还是没找到，尝试自动创建/同步用户
  if (!user) {
    const { isLoggedIn, user: authUser } = await isRequestAuthenticated(request);
    
    if (isLoggedIn && authUser) {
      const adminIds = getAdminIds();
      const isAdmin = adminIds.includes(authUser.sub);
      
      // 构建用户显示名称（使用多个字段作为后备）
      const displayName = authUser.name 
        || authUser.nickname 
        || authUser.username 
        || (authUser.email ? authUser.email.split('@')[0] : undefined)
        || (typeof authUser.phone === 'string' ? authUser.phone : undefined)
        || (typeof authUser.phoneNumber === 'string' ? authUser.phoneNumber : undefined)
        || `用户${authUser.sub.substring(0, 8)}`;

      const nickname = authUser.nickname 
        || authUser.name 
        || authUser.username 
        || (authUser.email ? authUser.email.split('@')[0] : undefined);
      
      user = await monitorDatabaseOperation(
        dbMonitor,
        'loginOrRegister',
        'User',
        () => userService.loginOrRegister({
          authingId: authUser.sub,
          name: displayName,
          nickname: nickname,
          email: authUser.email,
          avatar: typeof authUser.picture === 'string' ? authUser.picture : undefined,
          isAdmin,
        })
      );
      tracker.checkpoint('自动同步用户到数据库', { userId: user.id });
    } else {
      throw new Error('用户不存在');
    }
  }

  const rank = await monitorDatabaseOperation(
    dbMonitor,
    'getUserRank',
    'User',
    () => userRepo.getUserRank(user.id)
  );
  tracker.checkpoint('获取用户排名', { rank });

  return NextResponse.json({
    success: true,
    data: {
      user,
      rank,
    },
  });
}, {
  name: '获取用户资料',
});

