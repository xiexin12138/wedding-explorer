/**
 * CloudBase 健康检查 API
 * GET /api/health/cloudbase - 检查 CloudBase 连接状态
 */

import { NextResponse } from 'next/server';
import { checkCloudBaseConnection } from '@/lib/cloudbase';

export async function GET() {
  try {
    const startTime = Date.now();
    const isConnected = await Promise.race([
      checkCloudBaseConnection(),
      new Promise<boolean>((resolve) => 
        setTimeout(() => resolve(false), 5000) // 5秒超时
      ),
    ]);
    const responseTime = Date.now() - startTime;

    if (isConnected) {
      return NextResponse.json({
        status: 'healthy',
        service: 'cloudbase',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          status: 'unhealthy',
          service: 'cloudbase',
          error: 'Connection failed or timeout',
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('CloudBase 健康检查失败:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'cloudbase',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

