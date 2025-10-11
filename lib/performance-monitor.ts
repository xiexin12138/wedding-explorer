/**
 * 性能监控工具
 * 用于追踪和记录各类性能指标，帮助排查慢接口问题
 */

// 性能日志级别
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// 性能指标接口
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  level: LogLevel;
  metadata?: Record<string, unknown>;
}

// 数据库查询监控
export interface DatabaseQueryMetric {
  query: string;
  duration: number;
  model?: string;
  operation?: string;
}

/**
 * 性能追踪器类
 * 用于追踪单个请求的性能指标
 */
export class PerformanceTracker {
  private startTime: number;
  private checkpoints: Map<string, number> = new Map();
  private metrics: PerformanceMetric[] = [];
  private requestId: string;
  private context: string;

  constructor(requestId: string, context: string) {
    this.startTime = performance.now();
    this.requestId = requestId;
    this.context = context;
  }

  /**
   * 标记检查点
   */
  checkpoint(name: string, metadata?: Record<string, unknown>): void {
    const now = performance.now();
    this.checkpoints.set(name, now);
    
    const duration = now - this.startTime;
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      level: duration > 1000 ? LogLevel.WARN : LogLevel.INFO,
      metadata,
    };
    
    this.metrics.push(metric);
    
    // 实时输出检查点
    const emoji = duration > 3000 ? '🔴' : duration > 1000 ? '🟡' : '🟢';
    console.log(
      `${emoji} [${this.requestId}] ${this.context} - ${name}: ${duration.toFixed(2)}ms`,
      metadata ? JSON.stringify(metadata) : ''
    );
  }

  /**
   * 计算两个检查点之间的耗时
   */
  getCheckpointDuration(start: string, end: string): number | null {
    const startTime = this.checkpoints.get(start);
    const endTime = this.checkpoints.get(end);
    
    if (!startTime || !endTime) {
      return null;
    }
    
    return endTime - startTime;
  }

  /**
   * 完成追踪并输出总结
   */
  finish(): PerformanceSummary {
    const totalDuration = performance.now() - this.startTime;
    
    const summary: PerformanceSummary = {
      requestId: this.requestId,
      context: this.context,
      totalDuration,
      metrics: this.metrics,
      timestamp: Date.now(),
    };
    
    // 输出性能总结
    this.printSummary(summary);
    
    return summary;
  }

  /**
   * 打印性能总结
   */
  private printSummary(summary: PerformanceSummary): void {
    const { totalDuration, metrics, requestId, context } = summary;
    
    // 判断整体性能级别
    const emoji = totalDuration > 5000 ? '🔴🔴🔴' : totalDuration > 2000 ? '🟡🟡' : '🟢';
    
    console.log('\n' + '='.repeat(80));
    console.log(`${emoji} 性能总结 [${requestId}] ${context}`);
    console.log('='.repeat(80));
    console.log(`⏱️  总耗时: ${totalDuration.toFixed(2)}ms`);
    console.log(`📊 检查点数量: ${metrics.length}`);
    
    if (metrics.length > 0) {
      console.log('\n📈 详细指标:');
      metrics.forEach((metric, index) => {
        const emoji = metric.duration > 3000 ? '🔴' : metric.duration > 1000 ? '🟡' : '🟢';
        console.log(
          `  ${index + 1}. ${emoji} ${metric.name}: ${metric.duration.toFixed(2)}ms`
        );
        if (metric.metadata) {
          console.log(`     元数据: ${JSON.stringify(metric.metadata)}`);
        }
      });
    }
    
    // 找出最慢的操作
    if (metrics.length > 0) {
      const slowest = metrics.reduce((prev, current) => 
        current.duration > prev.duration ? current : prev
      );
      console.log(`\n🐌 最慢操作: ${slowest.name} (${slowest.duration.toFixed(2)}ms)`);
    }
    
    console.log('='.repeat(80) + '\n');
  }
}

/**
 * 性能总结接口
 */
export interface PerformanceSummary {
  requestId: string;
  context: string;
  totalDuration: number;
  metrics: PerformanceMetric[];
  timestamp: number;
}

/**
 * 数据库查询监控器
 */
export class DatabaseMonitor {
  private queries: DatabaseQueryMetric[] = [];
  private requestId: string;

  constructor(requestId: string) {
    this.requestId = requestId;
  }

  /**
   * 记录查询
   */
  logQuery(query: string, duration: number, model?: string, operation?: string): void {
    const metric: DatabaseQueryMetric = {
      query: query.substring(0, 200), // 限制长度
      duration,
      model,
      operation,
    };
    
    this.queries.push(metric);
    
    // 如果查询很慢，立即输出警告
    if (duration > 500) {
      console.warn(
        `🐌 [${this.requestId}] 慢查询检测 (${duration.toFixed(2)}ms):`,
        model ? `${model}.${operation}` : query.substring(0, 100)
      );
    }
  }

  /**
   * 获取查询总结
   */
  getSummary(): {
    totalQueries: number;
    totalDuration: number;
    slowestQuery: DatabaseQueryMetric | null;
    queries: DatabaseQueryMetric[];
  } {
    const totalDuration = this.queries.reduce((sum, q) => sum + q.duration, 0);
    const slowestQuery = this.queries.length > 0
      ? this.queries.reduce((prev, current) => 
          current.duration > prev.duration ? current : prev
        )
      : null;
    
    return {
      totalQueries: this.queries.length,
      totalDuration,
      slowestQuery,
      queries: this.queries,
    };
  }

  /**
   * 打印查询总结
   */
  printSummary(): void {
    const summary = this.getSummary();
    
    if (summary.totalQueries === 0) {
      return;
    }
    
    console.log('\n' + '-'.repeat(80));
    console.log(`📊 数据库查询总结 [${this.requestId}]`);
    console.log('-'.repeat(80));
    console.log(`🔢 查询总数: ${summary.totalQueries}`);
    console.log(`⏱️  总耗时: ${summary.totalDuration.toFixed(2)}ms`);
    console.log(`⏱️  平均耗时: ${(summary.totalDuration / summary.totalQueries).toFixed(2)}ms`);
    
    if (summary.slowestQuery) {
      console.log(`🐌 最慢查询: ${summary.slowestQuery.duration.toFixed(2)}ms`);
      console.log(`   ${summary.slowestQuery.query.substring(0, 100)}...`);
    }
    
    // 显示所有慢查询（> 100ms）
    const slowQueries = summary.queries.filter(q => q.duration > 100);
    if (slowQueries.length > 0) {
      console.log(`\n⚠️  慢查询列表 (> 100ms):`);
      slowQueries.forEach((q, i) => {
        console.log(`  ${i + 1}. ${q.duration.toFixed(2)}ms - ${q.model}.${q.operation}`);
      });
    }
    
    console.log('-'.repeat(80) + '\n');
  }
}

/**
 * 外部服务调用监控器
 */
export class ExternalServiceMonitor {
  private calls: Map<string, { count: number; totalDuration: number; errors: number }> = new Map();
  private requestId: string;

  constructor(requestId: string) {
    this.requestId = requestId;
  }

  /**
   * 记录外部服务调用
   */
  logCall(service: string, duration: number, isError: boolean = false): void {
    const current = this.calls.get(service) || { count: 0, totalDuration: 0, errors: 0 };
    
    this.calls.set(service, {
      count: current.count + 1,
      totalDuration: current.totalDuration + duration,
      errors: current.errors + (isError ? 1 : 0),
    });
    
    const emoji = isError ? '❌' : duration > 2000 ? '🐌' : '✅';
    console.log(
      `${emoji} [${this.requestId}] 外部服务: ${service} - ${duration.toFixed(2)}ms`,
      isError ? '(失败)' : ''
    );
  }

  /**
   * 打印总结
   */
  printSummary(): void {
    if (this.calls.size === 0) {
      return;
    }
    
    console.log('\n' + '-'.repeat(80));
    console.log(`🌐 外部服务调用总结 [${this.requestId}]`);
    console.log('-'.repeat(80));
    
    this.calls.forEach((stats, service) => {
      const avgDuration = stats.totalDuration / stats.count;
      const errorRate = (stats.errors / stats.count) * 100;
      
      console.log(`\n📡 ${service}:`);
      console.log(`   调用次数: ${stats.count}`);
      console.log(`   总耗时: ${stats.totalDuration.toFixed(2)}ms`);
      console.log(`   平均耗时: ${avgDuration.toFixed(2)}ms`);
      if (stats.errors > 0) {
        console.log(`   ❌ 错误次数: ${stats.errors} (${errorRate.toFixed(1)}%)`);
      }
    });
    
    console.log('-'.repeat(80) + '\n');
  }
}

/**
 * 便捷函数：创建性能追踪器
 */
export function createPerformanceTracker(requestId: string, context: string): PerformanceTracker {
  return new PerformanceTracker(requestId, context);
}

/**
 * 便捷函数：创建数据库监控器
 */
export function createDatabaseMonitor(requestId: string): DatabaseMonitor {
  return new DatabaseMonitor(requestId);
}

/**
 * 便捷函数：创建外部服务监控器
 */
export function createExternalServiceMonitor(requestId: string): ExternalServiceMonitor {
  return new ExternalServiceMonitor(requestId);
}

/**
 * 时间追踪装饰器
 */
export function trackTime(name: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const start = performance.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - start;
        console.log(`⏱️  ${name || propertyKey}: ${duration.toFixed(2)}ms`);
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        console.error(`❌ ${name || propertyKey} 失败 (${duration.toFixed(2)}ms):`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 简单的性能计时器
 */
export class SimpleTimer {
  private startTime: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = performance.now();
  }

  end(metadata?: Record<string, unknown>): number {
    const duration = performance.now() - this.startTime;
    const emoji = duration > 2000 ? '🔴' : duration > 500 ? '🟡' : '🟢';
    console.log(
      `${emoji} ${this.name}: ${duration.toFixed(2)}ms`,
      metadata ? JSON.stringify(metadata) : ''
    );
    return duration;
  }
}

/**
 * 便捷函数：测量异步函数执行时间
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  onComplete?: (duration: number) => void
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    const emoji = duration > 2000 ? '🔴' : duration > 500 ? '🟡' : '🟢';
    console.log(`${emoji} ${name}: ${duration.toFixed(2)}ms`);
    onComplete?.(duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ ${name} 失败 (${duration.toFixed(2)}ms):`, error);
    throw error;
  }
}

/**
 * 便捷函数：测量同步函数执行时间
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  onComplete?: (duration: number) => void
): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    const emoji = duration > 500 ? '🔴' : duration > 100 ? '🟡' : '🟢';
    console.log(`${emoji} ${name}: ${duration.toFixed(2)}ms`);
    onComplete?.(duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ ${name} 失败 (${duration.toFixed(2)}ms):`, error);
    throw error;
  }
}

