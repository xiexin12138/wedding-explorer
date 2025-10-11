import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSuperAdmin } from '@/lib/server-config';
import { requireAuth } from '@/lib/auth';

/**
 * 获取游戏项目列表
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const userInfo = await requireAuth(request);

    // 检查超级管理员权限
    if (!isSuperAdmin(userInfo.sub)) {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 }
      );
    }

    // 获取游戏项目列表
    const gameProjects = await db.gameProject.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        _count: {
          select: {
            gameRecords: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        gameProjects: gameProjects.map(project => ({
          ...project,
          costButtons: JSON.parse(project.costButtons),
          rewardButtons: JSON.parse(project.rewardButtons),
          totalGames: project._count.gameRecords
        }))
      }
    });

  } catch (error) {
    console.error('获取游戏项目列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取游戏项目列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 创建游戏项目
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const userInfo = await requireAuth(request);

    // 检查超级管理员权限
    if (!isSuperAdmin(userInfo.sub)) {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, costButtons, rewardButtons, sortOrder } = body;

    // 验证必填字段
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: '项目名称不能为空' },
        { status: 400 }
      );
    }

    // 验证按钮配置
    if (!Array.isArray(costButtons)) {
      return NextResponse.json(
        { success: false, error: '消耗游戏币按钮配置必须为数组' },
        { status: 400 }
      );
    }

    if (!Array.isArray(rewardButtons)) {
      return NextResponse.json(
        { success: false, error: '奖励游戏币按钮配置必须为数组' },
        { status: 400 }
      );
    }

    // 验证按钮配置内容
    for (const button of costButtons) {
      if (typeof button !== 'number' && button !== 'DECLINE_ANY') {
        return NextResponse.json(
          { success: false, error: '消耗按钮配置只能包含数字或"DECLINE_ANY"' },
          { status: 400 }
        );
      }
      if (typeof button === 'number' && button < 0) {
        return NextResponse.json(
          { success: false, error: '消耗按钮数值必须为非负整数' },
          { status: 400 }
        );
      }
    }

    for (const button of rewardButtons) {
      if (typeof button !== 'number' && button !== 'ADD_ANY') {
        return NextResponse.json(
          { success: false, error: '奖励按钮配置只能包含数字或"ADD_ANY"' },
          { status: 400 }
        );
      }
      if (typeof button === 'number' && button < 0) {
        return NextResponse.json(
          { success: false, error: '奖励按钮数值必须为非负整数' },
          { status: 400 }
        );
      }
    }

    // 创建游戏项目
    const gameProject = await db.gameProject.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        costButtons: JSON.stringify(costButtons),
        rewardButtons: JSON.stringify(rewardButtons),
        sortOrder: sortOrder || 0,
        createdBy: userInfo.sub,
        updatedBy: userInfo.sub,
      }
    });

    return NextResponse.json({
      success: true,
      data: { 
        gameProject: {
          ...gameProject,
          costButtons: JSON.parse(gameProject.costButtons),
          rewardButtons: JSON.parse(gameProject.rewardButtons),
        }
      }
    });

  } catch (error) {
    console.error('创建游戏项目失败:', error);
    return NextResponse.json(
      { success: false, error: '创建游戏项目失败' },
      { status: 500 }
    );
  }
}
