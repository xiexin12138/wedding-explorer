import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME } from '@/lib/routes.config'

export async function POST() {
  try {
    const cookieStore = await cookies()

    // 清除 JWT token cookie（Next.js 15 推荐方案）
    cookieStore.delete(COOKIE_NAME)

    console.log('✅ 用户已登出')

    return NextResponse.json({
      success: true,
      message: '登出成功'
    })

  } catch (error) {
    console.error('❌ 登出失败:', error)
    return NextResponse.json(
      { error: '登出失败' },
      { status: 500 }
    )
  }
} 