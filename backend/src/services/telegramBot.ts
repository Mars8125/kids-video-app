/**
 * Telegram Bot 服务 - Webhook 模式
 * 单实例，无 polling 冲突，支持 Railway 多副本
 */

import TelegramBot from 'node-telegram-bot-api'
import { parseVideoUrl } from './videoParser.js'
import { fetchBilibiliMetadata } from './metadataFetcher.js'
import { fetchDouyinMetadata } from './douyinFetcher.js'
import { categorizeByTitle } from './categorizer.js'
import { prisma } from './db.js'

let bot: TelegramBot | null = null

export async function initTelegramBot(token: string, webhookUrl: string) {
  // 停止旧的 polling（如果 Railway 重启有残留）
  try {
    await bot?.stopPolling()
  } catch {}

  bot = new TelegramBot(token)

  // 先清理旧 webhook（Railway 部署时会短暂新旧容器共存，避免 409）
  try {
    await bot.deleteWebHook()
    console.log('✅ 旧 webhook 已清理')
  } catch (e: any) {
    if (e.response?.body?.error_code !== 404) console.warn('清理 webhook 失败:', e.message)
  }

  // 设置新 webhook
  await bot.setWebHook(webhookUrl, {
    allowed_updates: ['message', 'callback_query'],
  } as any)
  console.log(`✅ Telegram Bot webhook 已设置: ${webhookUrl}`)

  bot.onText(/\/start/, async (msg) => {
    await bot!.sendMessage(msg.chat.id,
      `🎬 小学生视频App - 管理后台\n\n` +
      `发送视频链接，我会自动解析并添加到数据库。\n\n` +
      `支持的平台:\n` +
      `• B站: https://b23.tv/xxxxxx 或 BV号\n` +
      `• 抖音: https://v.douyin.com/xxxxxx\n\n` +
      `命令:\n` +
      `/videos - 查看已添加的视频\n` +
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

  bot.onText(/\/videos/, async (msg) => await handleListVideos(msg))
  bot.onText(/\/list/, async (msg) => await handleListVideos(msg))

  async function handleListVideos(msg: TelegramBot.Message) {
    const videos = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    if (videos.length === 0) {
      await bot!.sendMessage(msg.chat.id, '📭 还没有添加任何视频，发个链接试试吧！')
      return
    }
    const text = videos.map((v, i) =>
      `${i + 1}. [${v.platform.toUpperCase()}] ${v.title}\n   📁 ${v.category}`
    ).join('\n\n')
    await bot!.sendMessage(msg.chat.id, `📋 最近视频 (${videos.length}个):\n\n${text}`)
  }

  bot.onText(/\/stats/, async (msg) => {
    const [total, bilibili, douyin] = await Promise.all([
      prisma.video.count({ where: { status: 'active' } }),
      prisma.video.count({ where: { platform: 'bilibili', status: 'active' } }),
      prisma.video.count({ where: { platform: 'douyin', status: 'active' } }),
    ])
    await bot!.sendMessage(msg.chat.id,
      `📊 统计概览\n\n` +
      `总视频数: ${total}\n` +
      `B站: ${bilibili}\n` +
      `抖音: ${douyin}`
    )
  })

  // 处理视频链接
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return
    const text = msg.text.trim()
    if (!text.match(/https?:\/\//)) return

    const chatId = msg.chat.id
    let processingMsg: TelegramBot.Message | null = null

    try {
      processingMsg = await bot!.sendMessage(chatId, '⏳ 正在解析...')
      const urls = text.match(/https?:\/\/[^\s]+/g) || [text]
      let ok = 0, fail = 0

      for (const url of urls) {
        const parsed = parseVideoUrl(url)
        if (!parsed) {
          await bot!.sendMessage(chatId, `❌ 无法识别: ${url}`)
          fail++; continue
        }
        const existing = await prisma.video.findFirst({
          where: { platform: parsed.platform, videoId: parsed.videoId }
        })
        if (existing) {
          await bot!.sendMessage(chatId, `⚠️ 已存在: ${existing.title}`)
          continue
        }
        let metadata: any = null
        if (parsed.platform === 'bilibili') {
          metadata = await fetchBilibiliMetadata(parsed.videoId)
        } else if (parsed.platform === 'douyin') {
          metadata = await fetchDouyinMetadata(parsed.videoId)
        }
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
            description: metadata?.description || null,
          }
        })
        ok++
        await bot!.sendMessage(chatId,
          `✅ 添加成功!\n\n📺 ${video.title}\n🏷️ ${video.category}\n🔗 ${video.platform}`
        )
      }

      if (processingMsg) await bot!.deleteMessage(chatId, processingMsg.message_id)
      if (ok > 0) {
        await bot!.sendMessage(chatId, `🎉 共添加 ${ok} 个视频，App 已更新！`)
      }

    } catch (error) {
      console.error('Bot 错误:', error)
      if (processingMsg) {
        await bot!.editMessageText('❌ 处理失败，请重试', {
          chat_id: chatId, message_id: processingMsg.message_id,
        })
      }
    }
  })

  console.log('✅ Telegram Bot 已启动 (webhook 模式)')
  return bot
}

export function getBot() { return bot }
