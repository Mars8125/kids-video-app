/**
 * 主入口文件
 */

import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { videoRoutes } from './routes/videos.js'
import { prisma } from './services/db.js'
import { initTelegramBot } from './services/telegramBot.js'

const fastify = Fastify({
  logger: true
})

// CORS
await fastify.register(cors, {
  origin: true,
  credentials: true
})

// 注册路由
await fastify.register(videoRoutes)

// 健康检查
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// 启动
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000')
    
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 Server running on port ${port}`)

    // 初始化 Telegram Bot
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID) {
      try {
        await initTelegramBot(
          process.env.TELEGRAM_BOT_TOKEN,
          process.env.TELEGRAM_ADMIN_CHAT_ID
        )
      } catch (error) {
        console.error('Telegram Bot 初始化失败:', error)
      }
    } else {
      console.log('⚠️ 未配置 Telegram Bot (TELEGRAM_BOT_TOKEN 或 TELEGRAM_ADMIN_CHAT_ID 未设置)')
    }

  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 关闭中...')
  await prisma.$disconnect()
  await fastify.close()
  process.exit(0)
})

start()
