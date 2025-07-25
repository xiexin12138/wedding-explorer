/**
 * 请求追踪工具
 * 为每个网络请求生成唯一的 UUID，便于前后端调试
 */

// 生成 UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 请求追踪信息接口
export interface RequestTracker {
  requestId: string;
  timestamp: number;
  url: string;
  method: string;
  startTime: number;
}

// 响应追踪信息接口
export interface ResponseTracker {
  requestId: string;
  timestamp: number;
  status: number;
  statusText: string;
  duration: number;
  url: string;
  method: string;
}

/**
 * 创建请求追踪器
 */
export function createRequestTracker(url: string, method: string): RequestTracker {
  const requestId = generateUUID();
  const timestamp = Date.now();
  const startTime = performance.now();

  const tracker: RequestTracker = {
    requestId,
    timestamp,
    url,
    method: method.toUpperCase(),
    startTime
  };

  // 记录请求开始
  console.log(`🚀 [${requestId}] 发起请求: ${method.toUpperCase()} ${url}`, {
    requestId,
    timestamp: new Date(timestamp).toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    url,
    method: method.toUpperCase()
  });

  return tracker;
}

/**
 * 完成请求追踪
 */
export function completeRequestTracker(
  tracker: RequestTracker,
  response: Response
): ResponseTracker {
  const endTime = performance.now();
  const duration = endTime - tracker.startTime;
  const timestamp = Date.now();

  const responseTracker: ResponseTracker = {
    requestId: tracker.requestId,
    timestamp,
    status: response.status,
    statusText: response.statusText,
    duration: Math.round(duration),
    url: tracker.url,
    method: tracker.method
  };

  // 记录请求完成
  const statusIcon = response.ok ? '✅' : '❌';
  console.log(`${statusIcon} [${tracker.requestId}] 请求完成: ${tracker.method} ${tracker.url}`, {
    requestId: tracker.requestId,
    status: response.status,
    statusText: response.statusText,
    duration: `${Math.round(duration)}ms`,
    timestamp: new Date(timestamp).toISOString(),
    url: tracker.url,
    method: tracker.method
  });

  return responseTracker;
}

/**
 * 记录请求错误
 */
export function logRequestError(
  tracker: RequestTracker,
  error: Error
): void {
  const timestamp = Date.now();
  
  console.error(`💥 [${tracker.requestId}] 请求失败: ${tracker.method} ${tracker.url}`, {
    requestId: tracker.requestId,
    error: error.message,
    stack: error.stack,
    timestamp: new Date(timestamp).toISOString(),
    url: tracker.url,
    method: tracker.method
  });
}

/**
 * 增强的 fetch 函数，自动添加请求追踪
 */
export async function trackedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString();
  const method = init?.method || 'GET';
  
  // 创建请求追踪器
  const tracker = createRequestTracker(url, method);
  
  try {
    // 添加请求追踪头
    const headers = new Headers(init?.headers);
    // headers.set('X-Request-ID', tracker.requestId);
    // headers.set('X-Request-Timestamp', tracker.timestamp.toString());
    
    // 发起请求
    const response = await fetch(input, {
      ...init,
      headers
    });
    
    // 完成追踪
    completeRequestTracker(tracker, response);
    
    return response;
  } catch (error) {
    // 记录错误
    logRequestError(tracker, error as Error);
    throw error;
  }
}

/**
 * 获取当前请求的追踪ID（用于服务端）
 */
export function getRequestIdFromHeaders(headers: Headers): string | null {
  return headers.get('X-Request-ID') || headers.get('x-request-id');
}

/**
 * 记录服务端请求信息
 */
export function logServerRequest(
  requestId: string,
  method: string,
  url: string,
  userAgent?: string
): void {
  console.log(`🌐 [${requestId}] 服务端收到请求: ${method} ${url}`, {
    requestId,
    method,
    url,
    userAgent,
    timestamp: new Date().toISOString()
  });
}

/**
 * 记录服务端响应信息
 */
export function logServerResponse(
  requestId: string,
  method: string,
  url: string,
  status: number,
  duration: number
): void {
  const statusIcon = status < 400 ? '✅' : '❌';
  console.log(`${statusIcon} [${requestId}] 服务端响应: ${method} ${url}`, {
    requestId,
    method,
    url,
    status,
    duration: `${Math.round(duration)}ms`,
    timestamp: new Date().toISOString()
  });
} 