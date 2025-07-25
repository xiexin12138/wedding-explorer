import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getMiddlewareConfig } from './config'
import { createLoggerHandler } from './handlers/logger'
import { createAuthHandler } from './handlers/auth'
import { createAdminHandler } from './handlers/admin'
import { isMobileDevice, isIOSDevice, isAndroidDevice } from './utils/device'
import { createNextResponse } from './utils/response'
import type { MiddlewareHandler, MiddlewareContext } from './types'

/**
 * 中间件处理器管理器
 */
class MiddlewareManager {
  private handlers: MiddlewareHandler[] = []
  
  constructor() {
    this.initializeHandlers()
  }

  /**
   * 初始化处理器
   */
  private initializeHandlers(): void {
    const config = getMiddlewareConfig()
    
    // 按照执行顺序添加处理器
    this.handlers = [
      createLoggerHandler(config.logger),
      createAuthHandler(config.auth),
      createAdminHandler(config.admin)
    ]
  }

  /**
   * 执行中间件处理链
   */
  async execute(request: NextRequest): Promise<NextResponse> {
    const context = this.createContext(request)
    
    // 依次执行每个处理器
    for (const handler of this.handlers) {
      try {
        const result = await handler.handle(context)
        
        // 如果处理器返回了响应，则停止执行链并返回响应
        if (result) {
          console.log(`🔄 中间件处理器 [${handler.name}] 返回响应，停止执行链`)
          return result
        }
      } catch (error) {
        console.error(`❌ 中间件处理器 [${handler.name}] 执行失败:`, error)
        // 继续执行下一个处理器，除非是关键错误
        if (this.isCriticalError(error)) {
          throw error
        }
      }
    }
    
    // 所有处理器都通过，创建响应并传递用户信息
    const response = createNextResponse()
    
    // 如果有用户信息，将其添加到请求头中供 API 路由使用
    if (context.user) {
      // 将用户信息编码为 JSON 字符串并添加到请求头
      // 使用展开运算符避免重复字段
      const userInfo = JSON.stringify({
        ...context.user,
        // 确保关键字段存在
        sub: context.user.sub,
        email: context.user.email,
        name: context.user.name,
        nickname: context.user.nickname,
        exp: context.user.exp,
      })
      
      // 使用 Base64 编码避免特殊字符问题
      const encodedUserInfo = Buffer.from(userInfo).toString('base64')
      
      response.headers.set('x-middleware-user', encodedUserInfo)
      console.log(`🔄 中间件传递用户信息到请求头: ${context.user.sub}`)
    }
    
    return response
  }

  /**
   * 创建中间件上下文
   */
  private createContext(request: NextRequest): MiddlewareContext {
    const { pathname } = request.nextUrl
    const userAgent = request.headers.get('user-agent') || ''
    
    return {
      request,
      pathname,
      userAgent,
      isMobile: isMobileDevice(userAgent),
      isIOS: isIOSDevice(userAgent),
      isAndroid: isAndroidDevice(userAgent)
    }
  }

  /**
   * 判断是否为关键错误
   */
  private isCriticalError(_error: unknown): boolean {
    // 这里可以定义哪些错误是关键的，需要中断整个请求
    return false
  }
}

// 创建全局中间件管理器实例
const middlewareManager = new MiddlewareManager()

/**
 * 主中间件函数
 */
export async function executeMiddleware(request: NextRequest): Promise<NextResponse> {
  try {
    return await middlewareManager.execute(request)
  } catch (error) {
    console.error('❌ 中间件执行失败:', error)
    // 发生错误时，默认继续请求
    return createNextResponse()
  }
}

// 导出类型和工具函数
export type { MiddlewareHandler, MiddlewareContext } from './types'
export { getMiddlewareConfig } from './config'
export * from './utils/jwt'
export * from './utils/device'
export * from './utils/response'