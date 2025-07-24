import { NextRequest, NextResponse } from 'next/server'
import { validateJWTToken } from '@/lib/auth'
import { COOKIE_NAME } from '@/lib/routes.config'
import { getAdminIds } from '@/lib/middleware/config'

export async function GET(request: NextRequest) {
  try {
    // 从 cookie 中获取 JWT token
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      console.log("未找到认证 token, request.cookies:", request.cookies.getAll())
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

    // 检查是否为管理员
    const adminIds = getAdminIds()
    const isAdmin = adminIds.includes(validatedUser.sub)
    
    console.log('✅ 用户认证检查通过:', validatedUser.sub, isAdmin ? '(管理员)' : '(普通用户)')

    // 返回用户信息，包含 data 字段和管理员状态
    return NextResponse.json({
      user: {
        id: validatedUser.sub,
        name: validatedUser.name || validatedUser.nickname,
        email: validatedUser.email,
        username: validatedUser.username,
        isAdmin,
        data: {
          phone: validatedUser.phone || validatedUser.phoneNumber,
          nickname: validatedUser.nickname,
          username: validatedUser.username,
          email: validatedUser.email,
          isAdmin,
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