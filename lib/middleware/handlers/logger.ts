import { NextResponse } from 'next/server'
import { logDeviceInfo } from '../utils/device'
import type { MiddlewareHandler, MiddlewareContext, LoggerConfig } from '../types'

/**
 * 日志处理器
 */
export class LoggerHandler implements MiddlewareHandler {
  name = 'logger'
  
  constructor(private config: LoggerConfig) {}

  async handle(context: MiddlewareContext): Promise<NextResponse | null> {
    if (!this.config.enabled) {
      return null
    }

    // 记录请求基本信息
    this.logRequestInfo(context)

    // 记录设备信息
    if (this.config.logMobile && context.isMobile) {
      logDeviceInfo(context.userAgent)
    }

    return null // 继续下一个处理器
  }

  /**
   * 记录请求信息
   */
  private logRequestInfo(context: MiddlewareContext): void {
    const { pathname, request } = context
    
    if (this.shouldLog('info')) {
      console.log(`🌐 中间件处理请求: ${request.method} ${pathname}`)
    }
  }

  /**
   * 检查是否应该记录指定级别的日志
   */
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.config.logLevel)
    const targetLevelIndex = levels.indexOf(level)
    
    return targetLevelIndex >= currentLevelIndex
  }
}

/**
 * 创建日志处理器
 */
export function createLoggerHandler(config: LoggerConfig): LoggerHandler {
  return new LoggerHandler(config)
}