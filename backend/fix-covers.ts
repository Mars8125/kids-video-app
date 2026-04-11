// 修复已有视频的封面 URL (http -> https)
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const videos = await prisma.video.findMany()
  let fixed = 0
  
  for (const v of videos) {
    if (v.coverUrl.startsWith('http://')) {
      await prisma.video.update({
        where: { id: v.id },
        data: { coverUrl: v.coverUrl.replace(/^http:/, 'https:') }
      })
      fixed++
      console.log(`Fixed: ${v.title.slice(0,30)}...`)
    }
  }
  
  console.log(`\n✅ 修复了 ${fixed} 个视频的封面 URL`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
