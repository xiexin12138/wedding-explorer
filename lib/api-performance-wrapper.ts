/**
 * API 路由性能监控包装器
 * 自动为 API 路由添加性能监控和日志
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  PerformanceTracker, 
  DatabaseMonitor, 
  ExternalServiceMonitor 
} from './performance-monitor';

/**
 * API 路由处理函数类型
 */
export type ApiRouteHandler = (
  request: NextRequest,
  context: {
    params: Promise<Record<string, string>>;
    tracker: PerformanceTracker;
    dbMonitor: DatabaseMonitor;
    externalMonitor: ExternalServiceMonitor;
  }
) => Promise<NextResponse>;

/**
 * API 上下文
 */
export interface ApiContext {
  tracker: PerformanceTracker;
  dbMonitor: DatabaseMonitor;
  externalMonitor: ExternalServiceMonitor;
  requestId: string;
}

/**
 * 生成请求 ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * 获取请求信息
 */
function getRequestInfo(request: NextRequest) {
  const url = request.nextUrl;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';
  const region = request.headers.get('x-vercel-ip-country') || 'unknown';
  
  return {
    method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    userAgent,
    ip,
    region,
  };
}

/**
 * 包装 API 路由处理函数，添加性能监控
 */
export function withPerformanceMonitoring(
  handler: ApiRouteHandler,
  options: {
    name?: string;
    logRequestBody?: boolean;
    logResponseBody?: boolean;
  } = {}
) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const requestInfo = getRequestInfo(request);
    const routeName = options.name || `${requestInfo.method} ${requestInfo.path}`;
    
    // 创建监控器
    const tracker = new PerformanceTracker(requestId, routeName);
    const dbMonitor = new DatabaseMonitor(requestId);
    const externalMonitor = new ExternalServiceMonitor(requestId);
    
    // 记录请求开始
    console.log('\n' + '🚀'.repeat(40));
    console.log(`🚀 API 请求开始 [${requestId}]`);
    console.log('🚀'.repeat(40));
    console.log(`📍 路由: ${routeName}`);
    console.log(`🌍 地区: ${requestInfo.region}`);
    console.log(`📱 User-Agent: ${requestInfo.userAgent.substring(0, 80)}...`);
    console.log(`🔗 IP: ${requestInfo.ip}`);
    if (Object.keys(requestInfo.query).length > 0) {
      console.log(`🔍 查询参数: ${JSON.stringify(requestInfo.query)}`);
    }
    
    tracker.checkpoint('请求开始');
    
    try {
      // 记录请求体（如果需要）
      if (options.logRequestBody && request.method !== 'GET') {
        try {
          const bodyClone = request.clone();
          const body = await bodyClone.json();
          console.log(`📦 请求体: ${JSON.stringify(body).substring(0, 200)}...`);
          tracker.checkpoint('读取请求体');
        } catch {
          // 忽略无法解析的请求体
        }
      }
      
      // 执行实际的处理函数
      tracker.checkpoint('开始处理业务逻辑');
      const response = await handler(request, {
        params: context.params,
        tracker,
        dbMonitor,
        externalMonitor,
      });
      tracker.checkpoint('业务逻辑处理完成');
      
      // 记录响应（如果需要）
      if (options.logResponseBody) {
        try {
          const responseClone = response.clone();
          const responseBody = await responseClone.json();
          console.log(`📤 响应体: ${JSON.stringify(responseBody).substring(0, 200)}...`);
        } catch {
          // 忽略无法解析的响应体
        }
      }
      
      // 添加性能监控响应头
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Response-Time', `${(performance.now()).toFixed(2)}ms`);
      
      // 完成追踪
      const summary = tracker.finish();
      
      // 打印数据库和外部服务总结
      dbMonitor.printSummary();
      externalMonitor.printSummary();
      
      // 记录请求完成
      console.log(`✅ API 请求完成 [${requestId}] - ${summary.totalDuration.toFixed(2)}ms`);
      console.log('='.repeat(80) + '\n');
      
      return response;
      
    } catch (error) {
      tracker.checkpoint('发生错误');
      
      // 记录错误
      console.error('❌'.repeat(40));
      console.error(`❌ API 请求失败 [${requestId}]`);
      console.error('❌'.repeat(40));
      console.error('错误信息:', error);
      if (error instanceof Error) {
        console.error('错误堆栈:', error.stack);
      }
      console.error('='.repeat(80) + '\n');
      
      // 完成追踪
      tracker.finish();
      dbMonitor.printSummary();
      externalMonitor.printSummary();
      
      // 返回错误响应
      const errorResponse = NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : '服务器内部错误',
          requestId,
        },
        { status: 500 }
      );
      
      errorResponse.headers.set('X-Request-ID', requestId);
      
      return errorResponse;
    }
  };
}

/**
 * 包装数据库操作，添加性能监控
 */
export async function monitorDatabaseOperation<T>(
  dbMonitor: DatabaseMonitor,
  operation: string,
  model: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    dbMonitor.logQuery(`${model}.${operation}`, duration, model, operation);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    dbMonitor.logQuery(`${model}.${operation} (失败)`, duration, model, operation);
    throw error;
  }
}

/**
 * 包装外部服务调用，添加性能监控
 */
export async function monitorExternalService<T>(
  externalMonitor: ExternalServiceMonitor,
  serviceName: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    externalMonitor.logCall(serviceName, duration, false);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    externalMonitor.logCall(serviceName, duration, true);
    throw error;
  }
}

/**
 * 简化版的性能监控包装器（用于快速集成）
 */
export function withSimplePerformanceMonitoring(
  handler: (request: NextRequest, context: { params?: Promise<Record<string, string>> }) => Promise<NextResponse>,
  routeName: string
) {
  return async (
    request: NextRequest,
    context: { params?: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const start = performance.now();
    const requestId = generateRequestId();
    const requestInfo = getRequestInfo(request);
    
    console.log(`\n🚀 [${requestId}] ${routeName} - 开始处理`);
    console.log(`   地区: ${requestInfo.region} | IP: ${requestInfo.ip}`);
    
    try {
      const response = await handler(request, context);
      const duration = performance.now() - start;
      
      const emoji = duration > 5000 ? '🔴' : duration > 2000 ? '🟡' : '🟢';
      console.log(`${emoji} [${requestId}] ${routeName} - 完成 (${duration.toFixed(2)}ms)\n`);
      
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
      
      return response;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ [${requestId}] ${routeName} - 失败 (${duration.toFixed(2)}ms)`, error);
      throw error;
    }
  };
}

