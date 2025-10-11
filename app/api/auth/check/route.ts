import { NextRequest, NextResponse } from 'next/server'
import { isRequestAuthenticated } from '@/lib/auth'
import { getAdminIds } from '@/lib/middleware/config'
import { getRequestIdFromHeaders, logServerRequest, logServerResponse } from '@/lib/request-tracker'
import { setAuthApiHeaders } from '@/lib/utils'
import * as userService from '@/lib/services/user.service'
import { withPerformanceMonitoring, monitorDatabaseOperation } from '@/lib/api-performance-wrapper'

export const dynamic = 'force-dynamic';

export const GET = withPerformanceMonitoring(async (
  request: NextRequest,
  { tracker, dbMonitor, externalMonitor }
) => {
  const requestId = getRequestIdFromHeaders(request.headers) || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // 记录服务端请求
  logServerRequest(requestId, 'GET', request.nextUrl.pathname, userAgent);
  tracker.checkpoint('记录请求日志');
  
  // 使用优化后的认证检查，优先使用中间件传递的用户信息
  const authStart = performance.now();
  const { isLoggedIn, user } = await isRequestAuthenticated(request);
  const authDuration = performance.now() - authStart;
  
  // 如果认证耗时超过1秒，记录为外部服务调用
  if (authDuration > 100) {
    externalMonitor.logCall('Authing认证', authDuration, false);
  }
  tracker.checkpoint('验证用户认证', { isLoggedIn, duration: authDuration });

  if (!isLoggedIn || !user) {
    const response = NextResponse.json({ 
      user: null,
      message: '用户未登录' 
    });
    
    setAuthApiHeaders(response);
    const duration = performance.now();
    logServerResponse(requestId, 'GET', request.nextUrl.pathname, 200, duration);
    
    return response;
  }

  // 检查是否为管理员
  const adminIds = getAdminIds();
  const isAdmin = adminIds.includes(user.sub);
  tracker.checkpoint('检查管理员权限', { isAdmin });

  // 构建用户显示名称（使用多个字段作为后备）
  const displayName = user.name 
    || user.nickname 
    || user.username 
    || (user.email ? user.email.split('@')[0] : undefined)
    || (typeof user.phone === 'string' ? user.phone : undefined)
    || (typeof user.phoneNumber === 'string' ? user.phoneNumber : undefined)
    || `用户${user.sub.substring(0, 8)}`;

  const nickname = user.nickname 
    || user.name 
    || user.username 
    || (user.email ? user.email.split('@')[0] : undefined);
  
  tracker.checkpoint('构建用户信息');

  // 同步用户到数据库
  let dbUser;
  try {
    dbUser = await monitorDatabaseOperation(
      dbMonitor,
      'loginOrRegister',
      'User',
      () => userService.loginOrRegister({
        authingId: user.sub,
        name: displayName,
        nickname: nickname,
        email: user.email,
        avatar: typeof user.picture === 'string' ? user.picture : (typeof user.photo === 'string' ? user.photo : undefined),
        isAdmin,
      })
    );
    tracker.checkpoint('同步用户到数据库', { dbUserId: dbUser.id });
  } catch (error) {
    console.error('⚠️ 同步用户到数据库失败:', error);
    tracker.checkpoint('同步用户失败');
    // 即使同步失败，也继续返回认证信息
  }

  // 返回用户信息，包含 data 字段和管理员状态
  const response = NextResponse.json({
    user: {
      id: user.sub,
      dbId: dbUser?.id,
      name: displayName,
      email: user.email,
      username: user.username,
      isAdmin,
      data: {
        phone: user.phone || user.phoneNumber,
        nickname: nickname,
        username: user.username,
        email: user.email,
        isAdmin,
        dbId: dbUser?.id,
        ...user
      }
    },
    message: '用户已登录'
  });
  
  setAuthApiHeaders(response);
  const duration = performance.now();
  logServerResponse(requestId, 'GET', request.nextUrl.pathname, 200, duration);
  
  return response;
}, {
  name: '用户认证检查',
});