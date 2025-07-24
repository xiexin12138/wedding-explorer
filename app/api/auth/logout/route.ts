import { NextRequest, NextResponse } from 'next/server'
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
    // 创建响应对象
    const response = NextResponse.json({
      success: true,
      message: '登出成功'
    });

    // 清除 JWT token cookie（通过响应 headers）
    // 使用多种方式确保在 iOS Safari 中正确清除
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // 使用 maxAge: 0 替代 expires，更好的 iOS 兼容性
      path: '/',
      // 不设置 domain，让 cookie 只对当前域名有效
    })

    // 额外设置一个过期时间为过去的 cookie，确保清除
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date('1970-01-01'), // 设置为 1970 年，确保过期
      path: '/',
    })

    // 清除其他相关 cookies
    response.cookies.set('authjs.csrf-token', '', {
      maxAge: 0, // 使用 maxAge: 0
      path: '/',
    })

    response.cookies.set('authjs.callback-url', '', {
      maxAge: 0, // 使用 maxAge: 0
      path: '/',
    })

    console.log('✅ 用户已登出，cookies 已清除')
    
    // 设置无缓存响应头
    setAuthApiHeaders(response);
    
    // 记录服务端响应
    const duration = performance.now() - startTime;
    logServerResponse(requestId, 'POST', request.nextUrl.pathname, 200, duration);
    
    return response;

  } catch (error) {
    console.error('❌ 登出失败:', error)
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