import { NextRequest, NextResponse } from 'next/server'
import { validateJWTToken } from '@/lib/auth'
import { COOKIE_NAME } from '@/lib/routes.config'

export async function GET(request: NextRequest) {
  try {
    // 从 cookie 中获取 JWT token
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json({ 
        user: null,
        message: '未找到认证 token' 
      })
    }

    // 验证 JWT token
    const validatedUser = await validateJWTToken(token)
    if (!validatedUser) {
      console.error('❌ JWT token 验证失败')
      return NextResponse.json({ 
        user: null,
        message: 'Token 验证失败' 
      })
    }

    console.log('✅ 用户认证检查通过:', validatedUser.sub)

    // 返回用户信息，包含 data 字段
    return NextResponse.json({
      user: {
        id: validatedUser.sub,
        name: validatedUser.name || validatedUser.nickname,
        email: validatedUser.email,
        username: validatedUser.username,
        data: {
          phone: validatedUser.phone || validatedUser.phoneNumber,
          nickname: validatedUser.nickname,
          username: validatedUser.username,
          email: validatedUser.email,
          // 添加其他可能的用户数据字段
          ...validatedUser
        }
      },
      message: '用户已登录'
    })

  } catch (error) {
    console.error('❌ 检查用户登录状态失败:', error)
    return NextResponse.json(
      { 
        user: null,
        error: '服务器内部错误' 
      },
      { status: 500 }
    )
  }
} 