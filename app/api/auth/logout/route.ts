import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/routes.config'

export async function POST() {
  try {
    // 创建响应对象
    const response = NextResponse.json({
      success: true,
      message: '登出成功'
    })

    // 清除 JWT token cookie（通过响应 headers）
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0), // 设置为过期时间
      path: '/',
    })

    // 清除其他相关 cookies
    response.cookies.set('authjs.csrf-token', '', {
      expires: new Date(0),
      path: '/',
    })

    response.cookies.set('authjs.callback-url', '', {
      expires: new Date(0),
      path: '/',
    })

    console.log('✅ 用户已登出，cookies 已清除')
    return response

  } catch (error) {
    console.error('❌ 登出失败:', error)
    return NextResponse.json(
      { error: '登出失败' },
      { status: 500 }
    )
  }
} 