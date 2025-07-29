import { PrismaClient } from "@/app/generated/prisma";

// PrismaClient 是线程安全的单例，可以在整个应用程序中共享
declare global {
  var prisma: PrismaClient | undefined;
}

// 在开发环境中避免热重载时创建多个实例
export const db = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = db;