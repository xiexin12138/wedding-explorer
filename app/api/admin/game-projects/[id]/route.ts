import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSuperAdmin } from '@/lib/server-config';
import { requireAuth } from '@/lib/auth';

/**
 * 获取单个游戏项目
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const gameProject = await db.gameProject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            gameRecords: true
          }
        }
      }
    });

    if (!gameProject) {
      return NextResponse.json(
        { success: false, error: '游戏项目不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        gameProject: {
          ...gameProject,
          costButtons: JSON.parse(gameProject.costButtons),
          rewardButtons: JSON.parse(gameProject.rewardButtons),
          totalGames: gameProject._count.gameRecords
        }
      }
    });

  } catch (error) {
    console.error('获取游戏项目失败:', error);
    return NextResponse.json(
      { success: false, error: '获取游戏项目失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新游戏项目
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { name, description, costButtons, rewardButtons, sortOrder, isActive } = body;

    // 验证必填字段
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: '项目名称不能为空' },
        { status: 400 }
      );
    }

    // 验证按钮配置（如果提供）
    if (costButtons !== undefined) {
      if (!Array.isArray(costButtons)) {
        return NextResponse.json(
          { success: false, error: '消耗游戏币按钮配置必须为数组' },
          { status: 400 }
        );
      }

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
    }

    if (rewardButtons !== undefined) {
      if (!Array.isArray(rewardButtons)) {
        return NextResponse.json(
          { success: false, error: '奖励游戏币按钮配置必须为数组' },
          { status: 400 }
        );
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
    }

    // 检查游戏项目是否存在
    const existingProject = await db.gameProject.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: '游戏项目不存在' },
        { status: 404 }
      );
    }

    // 更新游戏项目
    const gameProject = await db.gameProject.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        costButtons: costButtons !== undefined ? JSON.stringify(costButtons) : existingProject.costButtons,
        rewardButtons: rewardButtons !== undefined ? JSON.stringify(rewardButtons) : existingProject.rewardButtons,
        sortOrder: sortOrder ?? existingProject.sortOrder,
        isActive: isActive ?? existingProject.isActive,
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
    console.error('更新游戏项目失败:', error);
    return NextResponse.json(
      { success: false, error: '更新游戏项目失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除游戏项目
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    
    // 检查游戏项目是否存在
    const existingProject = await db.gameProject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            gameRecords: true
          }
        }
      }
    });

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: '游戏项目不存在' },
        { status: 404 }
      );
    }

    // 检查是否有关联的游戏记录
    if (existingProject._count.gameRecords > 0) {
      return NextResponse.json(
        { success: false, error: '该游戏项目已有游戏记录，无法删除' },
        { status: 400 }
      );
    }

    // 删除游戏项目
    await db.gameProject.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      data: { message: '游戏项目删除成功' }
    });

  } catch (error) {
    console.error('删除游戏项目失败:', error);
    return NextResponse.json(
      { success: false, error: '删除游戏项目失败' },
      { status: 500 }
    );
  }
}
