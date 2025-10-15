/**
 * 景点数据仓储层
 * 使用 Prisma 数据库操作景点数据
 */

import { db } from '@/lib/db';
import { AttractionType as PrismaAttractionType, Attraction as PrismaAttraction } from '@/app/generated/prisma';

// 媒体资源接口
export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  title?: string;
}

// 景点数据接口
export interface Attraction {
  id: string;
  name: string;
  description: string | null;
  type: PrismaAttractionType;
  position: [number, number];
  unlockDistance: number;
  media?: MediaItem[];
  rewardCoins: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
}

// 将 Prisma Attraction 转换为应用层 Attraction 格式
function mapPrismaAttractionToAttraction(prismaAttraction: PrismaAttraction): Attraction {
  let media: MediaItem[] | undefined;
  if (prismaAttraction.media) {
    try {
      media = JSON.parse(prismaAttraction.media) as MediaItem[];
    } catch (error) {
      console.error('解析媒体数据失败:', error);
      media = undefined;
    }
  }

  return {
    id: prismaAttraction.id,
    name: prismaAttraction.name,
    description: prismaAttraction.description,
    type: prismaAttraction.type,
    position: [prismaAttraction.longitude, prismaAttraction.latitude],
    unlockDistance: prismaAttraction.unlockDistance,
    media,
    rewardCoins: prismaAttraction.rewardCoins,
    isActive: prismaAttraction.isActive,
    sortOrder: prismaAttraction.sortOrder,
    createdAt: prismaAttraction.createdAt,
    updatedAt: prismaAttraction.updatedAt,
    createdBy: prismaAttraction.createdBy,
    updatedBy: prismaAttraction.updatedBy,
  };
}

/**
 * 获取所有景点数据
 */
export async function getAllAttractions(includeDisabled: boolean = false): Promise<Attraction[]> {
  try {
    const where = includeDisabled ? {} : { isActive: true };
    
    const prismaAttractions = await db.attraction.findMany({
      where,
      orderBy: [
        { sortOrder: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return prismaAttractions.map(mapPrismaAttractionToAttraction);
  } catch (error) {
    console.error('获取景点数据失败:', error);
    throw new Error('获取景点数据失败');
  }
}

/**
 * 根据 ID 获取单个景点
 */
export async function getAttractionById(id: string): Promise<Attraction | null> {
  try {
    const prismaAttraction = await db.attraction.findUnique({
      where: { id }
    });

    if (!prismaAttraction) {
      return null;
    }

    return mapPrismaAttractionToAttraction(prismaAttraction);
  } catch (error) {
    console.error('根据 ID 获取景点失败:', error);
    throw new Error('获取景点失败');
  }
}

/**
 * 创建新景点
 */
export async function createAttraction(
  data: {
    name: string;
    description?: string;
    type: PrismaAttractionType;
    longitude: number;
    latitude: number;
    unlockDistance?: number;
    media?: MediaItem[];
    rewardCoins?: number;
    isActive?: boolean;
    sortOrder?: number;
  },
  createdBy?: string
): Promise<Attraction> {
  try {
    const mediaJson = data.media ? JSON.stringify(data.media) : null;

    const prismaAttraction = await db.attraction.create({
      data: {
        name: data.name,
        description: data.description || null,
        type: data.type,
        longitude: data.longitude,
        latitude: data.latitude,
        unlockDistance: data.unlockDistance || 100,
        media: mediaJson,
        rewardCoins: data.rewardCoins || 10,
        isActive: data.isActive !== false,
        sortOrder: data.sortOrder || 0,
        createdBy: createdBy || null,
      }
    });

    return mapPrismaAttractionToAttraction(prismaAttraction);
  } catch (error) {
    console.error('创建景点失败:', error);
    throw new Error('创建景点失败');
  }
}

/**
 * 更新景点
 */
export async function updateAttraction(
  id: string,
  data: {
    name?: string;
    description?: string;
    type?: PrismaAttractionType;
    longitude?: number;
    latitude?: number;
    unlockDistance?: number;
    media?: MediaItem[];
    rewardCoins?: number;
    isActive?: boolean;
    sortOrder?: number;
  },
  updatedBy?: string
): Promise<Attraction> {
  try {
    const updateData: {
      name?: string;
      description?: string;
      type?: PrismaAttractionType;
      longitude?: number;
      latitude?: number;
      unlockDistance?: number;
      media?: string | null;
      rewardCoins?: number;
      isActive?: boolean;
      sortOrder?: number;
      updatedBy?: string | null;
    } = {};
    
    // 处理普通字段
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.unlockDistance !== undefined) updateData.unlockDistance = data.unlockDistance;
    if (data.rewardCoins !== undefined) updateData.rewardCoins = data.rewardCoins;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    
    // 处理媒体数据
    if (data.media !== undefined) {
      updateData.media = data.media ? JSON.stringify(data.media) : null;
    }
    
    // 添加更新者信息
    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }

    const prismaAttraction = await db.attraction.update({
      where: { id },
      data: updateData
    });

    return mapPrismaAttractionToAttraction(prismaAttraction);
  } catch (error) {
    console.error('更新景点失败:', error);
    throw new Error('更新景点失败');
  }
}

/**
 * 删除景点
 */
export async function deleteAttraction(id: string): Promise<void> {
  try {
    await db.attraction.delete({
      where: { id }
    });
  } catch (error) {
    console.error('删除景点失败:', error);
    throw new Error('删除景点失败');
  }
}

/**
 * 批量更新景点（用于排序等操作）
 */
export async function batchUpdateAttractions(
  updates: Array<{ id: string; data: { sortOrder?: number; isActive?: boolean } }>,
  updatedBy?: string
): Promise<void> {
  try {
    await db.$transaction(
      updates.map(update =>
        db.attraction.update({
          where: { id: update.id },
          data: {
            ...update.data,
            updatedBy: updatedBy || null,
          }
        })
      )
    );
  } catch (error) {
    console.error('批量更新景点失败:', error);
    throw new Error('批量更新景点失败');
  }
}

/**
 * 检查用户是否已打卡某景点
 */
export async function checkUserAttractionCheckIn(
  userId: string,
  attractionId: string
): Promise<boolean> {
  try {
    const checkIn = await db.userAttractionCheckIn.findUnique({
      where: {
        userId_attractionId: {
          userId,
          attractionId
        }
      }
    });

    return !!checkIn;
  } catch (error) {
    console.error('检查打卡状态失败:', error);
    throw new Error('检查打卡状态失败');
  }
}

/**
 * 获取用户的打卡记录
 */
export async function getUserCheckInRecord(
  userId: string,
  attractionId: string
) {
  try {
    return await db.userAttractionCheckIn.findUnique({
      where: {
        userId_attractionId: {
          userId,
          attractionId
        }
      }
    });
  } catch (error) {
    console.error('获取打卡记录失败:', error);
    throw new Error('获取打卡记录失败');
  }
}

/**
 * 创建打卡记录
 */
export async function createCheckInRecord(data: {
  userId: string;
  attractionId: string;
  distance?: number;
  coinsEarned: number;
  longitude?: number;
  latitude?: number;
}) {
  try {
    return await db.userAttractionCheckIn.create({
      data: {
        userId: data.userId,
        attractionId: data.attractionId,
        distance: data.distance || null,
        coinsEarned: data.coinsEarned,
        longitude: data.longitude || null,
        latitude: data.latitude || null,
      }
    });
  } catch (error) {
    console.error('创建打卡记录失败:', error);
    throw new Error('创建打卡记录失败');
  }
}

/**
 * 获取用户的所有打卡记录
 */
export async function getUserAllCheckIns(userId: string) {
  try {
    return await db.userAttractionCheckIn.findMany({
      where: { userId },
      include: {
        attraction: true
      },
      orderBy: {
        checkedInAt: 'desc'
      }
    });
  } catch (error) {
    console.error('获取用户打卡记录失败:', error);
    throw new Error('获取用户打卡记录失败');
  }
}

/**
 * 获取某个景点的所有打卡记录（包含用户信息）
 */
export async function getAttractionCheckIns(
  attractionId: string,
  params?: {
    page?: number;
    pageSize?: number;
    orderBy?: 'checkedInAt' | 'distance';
    order?: 'asc' | 'desc';
  }
): Promise<{
  checkIns: Array<{
    id: string;
    userId: string;
    attractionId: string;
    checkedInAt: Date;
    distance: number | null;
    coinsEarned: number;
    longitude: number | null;
    latitude: number | null;
    user: {
      id: string;
      name: string | null;
      nickname: string | null;
      avatar: string | null;
    };
  }>;
  total: number;
}> {
  try {
    const { page = 1, pageSize = 20, orderBy = 'checkedInAt', order = 'desc' } = params || {};

    const where = { attractionId };

    const [checkIns, total] = await Promise.all([
      db.userAttractionCheckIn.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              nickname: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          [orderBy]: order,
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      db.userAttractionCheckIn.count({ where }),
    ]);

    return { checkIns, total };
  } catch (error) {
    console.error('获取景点打卡记录失败:', error);
    throw new Error('获取景点打卡记录失败');
  }
}

/**
 * 获取某个景点的打卡统计信息
 */
export async function getAttractionCheckInStats(attractionId: string): Promise<{
  totalCheckIns: number;
  avgDistance: number | null;
  firstCheckInAt: Date | null;
  lastCheckInAt: Date | null;
}> {
  try {
    const checkIns = await db.userAttractionCheckIn.findMany({
      where: { attractionId },
      select: {
        distance: true,
        checkedInAt: true,
      },
      orderBy: {
        checkedInAt: 'asc',
      },
    });

    if (checkIns.length === 0) {
      return {
        totalCheckIns: 0,
        avgDistance: null,
        firstCheckInAt: null,
        lastCheckInAt: null,
      };
    }

    const distances = checkIns.filter(c => c.distance !== null).map(c => c.distance!);
    const avgDistance = distances.length > 0 
      ? distances.reduce((sum, d) => sum + d, 0) / distances.length 
      : null;

    return {
      totalCheckIns: checkIns.length,
      avgDistance,
      firstCheckInAt: checkIns[0].checkedInAt,
      lastCheckInAt: checkIns[checkIns.length - 1].checkedInAt,
    };
  } catch (error) {
    console.error('获取景点打卡统计失败:', error);
    throw new Error('获取景点打卡统计失败');
  }
}
