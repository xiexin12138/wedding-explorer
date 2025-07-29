import { PrismaClient, Prisma } from '@/app/generated/prisma'

const prisma = new PrismaClient()

const setting: Prisma.SystemSettingCreateInput[] = [
  {
    key: 'beginDate',
    displayName: '开始日期',
    valueType: 'NUMBER',
    category: 'WEDDING',
    value: (new Date('2025-10-25 00:00')).valueOf() + '',
    isSystem: true,
    isEnabled: true,
  },
]

export default async function main() {
  for (const item of setting) {
    await prisma.systemSetting.create({
      data: item,
    })
  }
}

main()