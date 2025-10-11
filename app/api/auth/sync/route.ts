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
  { tracker, dbMonitor }
) => {
  const requestId = getRequestIdFromHeaders(request.headers) || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  logServerRequest(requestId, 'GET', request.nextUrl.pathname, userAgent);
  tracker.checkpoint('记录请求日志');

  const { isLoggedIn, user } = await isRequestAuthenticated(request);
  tracker.checkpoint('验证用户认证', { isLoggedIn });

  if (!isLoggedIn || !user) {
    const response = NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    setAuthApiHeaders(response);
    const duration = performance.now();
    logServerResponse(requestId, 'GET', request.nextUrl.pathname, 401, duration);
    return response;
  }

  const adminIds = getAdminIds();
  const isAdmin = adminIds.includes(user.sub);

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

  // 设定超时预算，避免长尾阻塞
  const withTimeout = async <T>(p: Promise<T>, ms: number): Promise<T> => {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), ms);
    });
    try {
      return await (Promise.race([p, timeoutPromise]) as Promise<T>);
    } finally {
      clearTimeout(timeoutId!);
    }
  };

  try {
    const dbUser = await withTimeout(
      monitorDatabaseOperation(
        dbMonitor,
        'loginOrRegister',
        'User',
        () => userService.loginOrRegister({
          authingId: user.sub,
          name: displayName,
          nickname,
          email: user.email,
          avatar: typeof user.picture === 'string' ? user.picture : (typeof user.photo === 'string' ? user.photo : undefined),
          isAdmin,
        })
      ),
      8000 // 8秒预算
    );

    // dbUser 为服务返回的完整用户对象
    const response = NextResponse.json({ success: true, dbId: (dbUser as { id: string } | null)?.id });
    setAuthApiHeaders(response);
    const duration = performance.now();
    logServerResponse(requestId, 'GET', request.nextUrl.pathname, 200, duration);
    return response;
  } catch (error) {
    console.error('⚠️ 懒同步超时或失败:', error);
    const response = NextResponse.json({ success: false, message: 'sync timeout' }, { status: 504 });
    setAuthApiHeaders(response);
    const duration = performance.now();
    logServerResponse(requestId, 'GET', request.nextUrl.pathname, 504, duration);
    return response;
  }
}, {
  name: '懒同步用户',
});


