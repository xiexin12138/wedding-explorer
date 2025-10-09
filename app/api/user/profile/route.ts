/**
 * 用户资料 API
 * GET /api/user/profile - 获取当前用户信息（含排名）
 */

import { NextRequest, NextResponse } from 'next/server';
import * as userService from '@/lib/services/user.service';
import * as userRepo from '@/lib/repositories/user.repository';
import { isRequestAuthenticated } from '@/lib/auth';
import { getAdminIds } from '@/lib/middleware/config';

export async function GET(request: NextRequest) {
  try {
    // 优先从查询参数获取用户ID，如果没有则从认证信息获取
    const userIdParam = request.nextUrl.searchParams.get('userId');
    
    let user = null;

    if (userIdParam) {
      // 如果提供了 userId 参数，先尝试作为数字 ID 查询
      const numericId = parseInt(userIdParam, 10);
      if (!isNaN(numericId)) {
        console.log('🔍 通过数字 ID 查询用户:', numericId);
        user = await userRepo.getUserById(numericId);
      }
      
      // 如果没找到，尝试作为 authingId 查询
      if (!user) {
        console.log('🔍 通过 Authing ID 查询用户:', userIdParam);
        user = await userRepo.getUserByAuthingId(userIdParam);
      }
    } else {
      // 从认证信息获取
      const { isLoggedIn, user: authUser } = await isRequestAuthenticated(request);
      
      if (!isLoggedIn || !authUser) {
        return NextResponse.json(
          { error: '用户未登录' },
          { status: 401 }
        );
      }
      
      const authingId = authUser.sub; // Authing ID
      console.log('🔍 从认证信息查询用户，Authing ID:', authingId);
      user = await userRepo.getUserByAuthingId(authingId);
    }

    // 如果还是没找到，尝试自动创建/同步用户
    if (!user) {
      console.log('📝 用户不存在，尝试自动同步');
      const { isLoggedIn, user: authUser } = await isRequestAuthenticated(request);
      
      if (isLoggedIn && authUser) {
        const adminIds = getAdminIds();
        const isAdmin = adminIds.includes(authUser.sub);
        
        user = await userService.loginOrRegister({
          authingId: authUser.sub,
          name: authUser.name || authUser.nickname,
          nickname: authUser.nickname,
          email: authUser.email,
          avatar: typeof authUser.picture === 'string' ? authUser.picture : undefined,
          isAdmin,
        });
        console.log('✅ 用户已自动同步到数据库:', user.id);
      } else {
        throw new Error('用户不存在');
      }
    }

    const rank = await userRepo.getUserRank(user.id);

    return NextResponse.json({
      success: true,
      data: {
        user,
        rank,
      },
    });
  } catch (error) {
    console.error('❌ 获取用户资料失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取用户资料失败',
      },
      { status: 500 }
    );
  }
}

