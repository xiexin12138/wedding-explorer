import { NextRequest, NextResponse } from 'next/server'
import { validateJWTToken } from '@/lib/auth'
import { COOKIE_NAME } from '@/lib/routes.config'

export async function POST(request: NextRequest) {
  try {
    const { userInfo } = await request.json()

    if (!userInfo || !userInfo.token) {
      return NextResponse.json(
        { error: '无效的用户信息' },
        { status: 400 }
      )
    }

    // 使用公钥验证 Authing 返回的 JWT token
    const validatedUser = await validateJWTToken(userInfo.token)
    if (!validatedUser) {
      console.error('❌ JWT token 验证失败')
      return NextResponse.json(
        { error: 'Token 验证失败' },
        { status: 401 }
      )
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

    return response

  } catch (error) {
    console.error('❌ 设置登录状态失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 