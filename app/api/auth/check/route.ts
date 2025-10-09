import { NextRequest, NextResponse } from 'next/server'
import { isRequestAuthenticated } from '@/lib/auth'
import { getAdminIds } from '@/lib/middleware/config'
import { getRequestIdFromHeaders, logServerRequest, logServerResponse } from '@/lib/request-tracker'
import { setAuthApiHeaders } from '@/lib/utils'
import * as userService from '@/lib/services/user.service'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const requestId = getRequestIdFromHeaders(request.headers) || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // 记录服务端请求
  logServerRequest(requestId, 'GET', request.nextUrl.pathname, userAgent);
  
  try {
    // 使用优化后的认证检查，优先使用中间件传递的用户信息
    const { isLoggedIn, user } = await isRequestAuthenticated(request)

    if (!isLoggedIn || !user) {
      console.log("用户未登录或认证失败")
      const response = NextResponse.json({ 
        user: null,
        message: '用户未登录' 
      });
      
      // 设置无缓存响应头
      setAuthApiHeaders(response);
      
      // 记录服务端响应
      const duration = performance.now() - startTime;
      logServerResponse(requestId, 'GET', request.nextUrl.pathname, 200, duration);
      
      return response;
    }

    // 检查是否为管理员
    const adminIds = getAdminIds()
    const isAdmin = adminIds.includes(user.sub)
    
    console.log('✅ 用户认证检查通过:', user.sub, isAdmin ? '(管理员)' : '(普通用户)')

    // 同步用户到数据库
    let dbUser;
    try {
      dbUser = await userService.loginOrRegister({
        authingId: user.sub,
        name: user.name || user.nickname,
        nickname: user.nickname,
        email: user.email,
        avatar: typeof user.picture === 'string' ? user.picture : (typeof user.photo === 'string' ? user.photo : undefined),
        isAdmin,
      });
      console.log('✅ 用户已同步到数据库:', dbUser.id);
    } catch (error) {
      console.error('⚠️ 同步用户到数据库失败:', error);
      // 即使同步失败，也继续返回认证信息
    }

    // 返回用户信息，包含 data 字段和管理员状态
    const response = NextResponse.json({
      user: {
        id: user.sub,
        dbId: dbUser?.id, // 添加数据库 ID
        name: user.name || user.nickname,
        email: user.email,
        username: user.username,
        isAdmin,
        data: {
          phone: user.phone || user.phoneNumber,
          nickname: user.nickname,
          username: user.username,
          email: user.email,
          isAdmin,
          dbId: dbUser?.id, // 数据库 ID
          // 添加其他可能的用户数据字段
          ...user
        }
      },
      message: '用户已登录'
    });
    
    // 设置无缓存响应头
    setAuthApiHeaders(response);
    
    // 记录服务端响应
    const duration = performance.now() - startTime;
    logServerResponse(requestId, 'GET', request.nextUrl.pathname, 200, duration);
    
    return response;

  } catch (error) {
    console.error('❌ 检查用户登录状态失败:', error)
    const response = NextResponse.json(
      { 
        user: null,
        error: '服务器内部错误' 
      },
      { status: 500 }
    );
    
    // 设置无缓存响应头
    setAuthApiHeaders(response);
    
    // 记录服务端响应
    const duration = performance.now() - startTime;
    logServerResponse(requestId, 'GET', request.nextUrl.pathname, 500, duration);
    
    return response;
  }
}