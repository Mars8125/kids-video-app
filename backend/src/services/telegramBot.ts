/**
 * Telegram Bot 服务
 * 处理来自管理员的消息，接收视频链接并解析入库
 */

import TelegramBot from 'node-telegram-bot-api'
import { parseVideoUrl } from './videoParser.js'
import { fetchBilibiliMetadata } from './metadataFetcher.js'
import { fetchDouyinMetadata } from './douyinFetcher.js'
import { categorizeByTitle } from './categorizer.js'
import { prisma } from './db.js'

let bot: TelegramBot | null = null

export async function initTelegramBot(token: string, adminChatId: string) {
  bot = new TelegramBot(token, { polling: true })

  bot.onText(/\/start/, async (msg) => {
    await bot!.sendMessage(msg.chat.id, 
      `🎬 小学生视频App - 管理后台\n\n` +
      `发送视频链接，我会自动解析并添加到数据库。\n\n` +
      `支持的平台:\n` +
      `• B站: https://b23.tv/xxxxxx 或 BV号\n` +
      `• 抖音: https://v.douyin.com/xxxxxx\n` +
      `• 微信视频号链接\n\n` +
      `命令:\n` +
      `/list - 查看最近添加的视频\n` +
      `/stats - 查看统计数据\n` +
      `/help - 显示帮助`
    )
  })

  bot.onText(/\/help/, async (msg) => {
    await bot!.sendMessage(msg.chat.id,
      `📖 使用说明\n\n` +
      `1. 复制视频链接\n` +
      `2. 直接粘贴发送给我\n` +
      `3. 我会自动解析并添加到App\n\n` +
      `💡 小技巧:\n` +
      `• 可以一次发送多个链接\n` +
      `• 链接会自动识别平台`
    )
  })

  bot.onText(/\/list/, async (msg) => {
    const videos = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    if (videos.length === 0) {
      await bot!.sendMessage(msg.chat.id, '📭 还没有添加任何视频')
      return
    }

    const text = videos.map((v, i) => 
      `${i + 1}. [${v.platform}] ${v.title}\n   📁 ${v.category}`
    ).join('\n\n')

    await bot!.sendMessage(msg.chat.id, `📋 最近添加的视频:\n\n${text}`, { parse_mode: 'HTML' })
  })

  bot.onText(/\/stats/, async (msg) => {
    const [total, bilibili, douyin, weixin] = await Promise.all([
      prisma.video.count({ where: { status: 'active' } }),
      prisma.video.count({ where: { platform: 'bilibili', status: 'active' } }),
      prisma.video.count({ where: { platform: 'douyin', status: 'active' } }),
      prisma.video.count({ where: { platform: 'videoweixin', status: 'active' } })
    ])

    await bot!.sendMessage(msg.chat.id,
      `📊 统计概览\n\n` +
      `总视频数: ${total}\n` +
      `B站: ${bilibili}\n` +
      `抖音: ${douyin}\n` +
      `视频号: ${weixin}`
    )
  })

  // 处理普通文本消息 (视频链接)
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return
    
    const text = msg.text.trim()
    
    // 检查是否是链接
    if (!text.includes('http') && !text.includes('bilibili') && !text.includes('douyin') && !text.includes('weixin')) {
      // 不是链接，可能是普通文本
      return
    }

    const chatId = msg.chat.id
    const processingMsg = await bot!.sendMessage(chatId, '⏳ 正在解析视频链接...')

    try {
      // 提取URL (可能文本中包含多个链接)
      const urls = text.match(/https?:\/\/[^\s]+/g) || [text]
      let successCount = 0
      let failCount = 0

      for (const url of urls) {
        const parsed = parseVideoUrl(url)
        if (!parsed) {
          await bot!.sendMessage(chatId, `❌ 无法识别的链接: ${url}`)
          failCount++
          continue
        }

        // 检查是否已存在
        const existing = await prisma.video.findFirst({
          where: {
            platform: parsed.platform,
            videoId: parsed.videoId
          }
        })

        if (existing) {
          await bot!.sendMessage(chatId, `⚠️ 视频已存在: ${existing.title}`)
          continue
        }

        // 根据平台获取元数据
        let metadata: any = null
        
        if (parsed.platform === 'bilibili') {
          metadata = await fetchBilibiliMetadata(parsed.videoId)
        } else if (parsed.platform === 'douyin') {
          metadata = await fetchDouyinMetadata(parsed.videoId)
        }

        // 入库
        const video = await prisma.video.create({
          data: {
            platform: parsed.platform,
            videoId: parsed.videoId,
            title: metadata?.title || `${parsed.platform}视频`,
            coverUrl: metadata?.coverUrl || '',
            videoUrl: metadata?.embedUrl || metadata?.videoUrl || url,
            sourceUrl: parsed.sourceUrl,
            category: metadata?.title ? categorizeByTitle(metadata.title) : '其他',
            duration: metadata?.duration || null,
            description: metadata?.description || null
          }
        })

        successCount++
        
        await bot!.sendMessage(chatId, 
          `✅ 添加成功!\n\n` +
          `📺 ${video.title}\n` +
          `🏷️ 分类: ${video.category}\n` +
          `🔗 平台: ${video.platform}`
        )
      }

      // 删除处理中消息
      await bot!.deleteMessage(chatId, processingMsg.message_id)

      if (successCount > 0) {
        await bot!.sendMessage(adminChatId, 
          `📱 App内容更新\n` +
          `✅ 新增 ${successCount} 个视频\n` +
          `❌ 失败 ${failCount} 个`
        )
      }

    } catch (error) {
      console.error('Telegram Bot 错误:', error)
      await bot!.editMessageText('❌ 处理失败，请重试', {
        chat_id: chatId,
        message_id: processingMsg.message_id
      })
    }
  })

  bot.on('polling_error', (error) => {
    console.error('Telegram Polling Error:', error)
  })

  console.log('✅ Telegram Bot 已启动')
  return bot
}

export function getBot() {
  return bot
}
