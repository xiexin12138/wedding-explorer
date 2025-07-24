import { NextRequest, NextResponse } from 'next/server'
import { validateJWTToken } from '@/lib/auth'
import { COOKIE_NAME } from '@/lib/routes.config'
import { getRequestIdFromHeaders, logServerRequest, logServerResponse } from '@/lib/request-tracker'
import { setAuthApiHeaders } from '@/lib/utils'

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const requestId = getRequestIdFromHeaders(request.headers) || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // 记录服务端请求
  logServerRequest(requestId, 'POST', request.nextUrl.pathname, userAgent);
  
  try {
    const { userInfo } = await request.json()

    if (!userInfo || !userInfo.token) {
      const response = NextResponse.json(
        { error: '无效的用户信息' },
        { status: 400 }
      );
      
      // 设置无缓存响应头
      setAuthApiHeaders(response);
      
      // 记录服务端响应
      const duration = performance.now() - startTime;
      logServerResponse(requestId, 'POST', request.nextUrl.pathname, 400, duration);
      
      return response;
    }

    // 使用公钥验证 Authing 返回的 JWT token
    const validatedUser = await validateJWTToken(userInfo.token)
    if (!validatedUser) {
      console.error('❌ JWT token 验证失败')
      const response = NextResponse.json(
        { error: 'Token 验证失败' },
        { status: 401 }
      );
      
      // 设置无缓存响应头
      setAuthApiHeaders(response);
      
      // 记录服务端响应
      const duration = performance.now() - startTime;
      logServerResponse(requestId, 'POST', request.nextUrl.pathname, 401, duration);
      
      return response;
    }
    
    console.log('✅ Authing JWT token HS256 验证通过:', validatedUser.sub)

    // 设置 HttpOnly cookie 存储 JWT token
    const response = NextResponse.json({ 
      success: true,
      message: 'JWT 认证设置成功' 
    })
    
    // 设置安全的 HttpOnly cookie
    response.cookies.set(COOKIE_NAME, userInfo.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 天
      path: '/',
    })

    console.log('✅ JWT token 已设置到 cookie:', COOKIE_NAME)

    // 设置无缓存响应头
    setAuthApiHeaders(response);

    // 记录服务端响应
    const duration = performance.now() - startTime;
    logServerResponse(requestId, 'POST', request.nextUrl.pathname, 200, duration);

    return response;

  } catch (error) {
    console.error('❌ 设置登录状态失败:', error)
    const response = NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
    
    // 设置无缓存响应头
    setAuthApiHeaders(response);
    
    // 记录服务端响应
    const duration = performance.now() - startTime;
    logServerResponse(requestId, 'POST', request.nextUrl.pathname, 500, duration);
    
    return response;
  }
} 