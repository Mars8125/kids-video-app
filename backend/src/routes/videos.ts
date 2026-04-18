/**
 * 视频相关 API 路由
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../services/db.js'

interface VideoQuery {
  category?: string
  page?: string
  limit?: string
}

export async function videoRoutes(fastify: FastifyInstance) {
  // 获取视频列表
  fastify.get('/api/videos', async (request: FastifyRequest<{ Querystring: VideoQuery }>, reply: FastifyReply) => {
    const { category, page = '1', limit = '20' } = request.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {
      status: 'active',
      ...(category && category !== '全部' ? { category } : {})
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          platform: true,
          videoId: true,
          title: true,
          coverUrl: true,
          videoUrl: true,
          category: true,
          duration: true,
          likeCount: true,
          createdAt: true
        }
      }),
      prisma.video.count({ where })
    ])

    return {
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    }
  })

  // 获取单个视频
  fastify.get('/api/videos/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params
    
    const video = await prisma.video.findUnique({
      where: { id }
    })

    if (!video || video.status !== 'active') {
      return reply.status(404).send({ error: '视频不存在' })
    }

    // 增加浏览量
    await prisma.video.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    })

    return { video }
  })

  // 获取分类列表
  fastify.get('/api/categories', async () => {
    const categories = [
      { name: '全部', icon: '📺' },
      { name: '科学探索', icon: '🔬' },
      { name: '历史故事', icon: '📜' },
      { name: '数学趣味', icon: '🔢' },
      { name: '语文阅读', icon: '📚' },
      { name: '音乐艺术', icon: '🎨' },
      { name: '体育运动', icon: '⚽' },
      { name: '英语学习', icon: '🌍' },
      { name: '其他', icon: '🎬' }
    ]
    return { categories }
  })

  // 点赞视频
  fastify.post('/api/videos/:id/like', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params
    
    const video = await prisma.video.update({
      where: { id },
      data: { likeCount: { increment: 1 } }
    })

    return { success: true, likeCount: video.likeCount }
  })

  // 管理员: 添加视频 (API方式)
  fastify.post('/api/admin/videos', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { 
      platform: string
      videoId: string
      title: string
      coverUrl: string
      videoUrl: string
      sourceUrl: string
      category?: string
    }

    const existing = await prisma.video.findFirst({
      where: {
        platform: body.platform,
        videoId: body.videoId
      }
    })

    if (existing) {
      return reply.status(400).send({ error: '视频已存在' })
    }

    const video = await prisma.video.create({
      data: {
        platform: body.platform,
        videoId: body.videoId,
        title: body.title,
        coverUrl: body.coverUrl,
        videoUrl: body.videoUrl,
        sourceUrl: body.sourceUrl,
        category: body.category || '其他'
      }
    })

    return { success: true, video }
  })

  // 管理员: 删除视频
  fastify.delete('/api/admin/videos/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params

    await prisma.video.update({
      where: { id },
      data: { status: 'disabled' }
    })

    return { success: true }
  })

  // 数据迁移: 修复封面 URL (http -> https)
  fastify.post('/api/admin/fix-cover-urls', async (request, reply) => {
    // 找出所有 http 封面的视频
    const videos = await prisma.video.findMany({
      where: { coverUrl: { startsWith: 'http:' } },
      select: { id: true, coverUrl: true }
    })

    let updated = 0
    for (const v of videos) {
      const newUrl = v.coverUrl.replace(/^http:/, 'https:')
      await prisma.video.update({
        where: { id: v.id },
        data: { coverUrl: newUrl }
      })
      updated++
    }

    return { success: true, updated, total: videos.length }
  })

  // 管理员: 添加示例视频 (适合小学生的内容)
  fastify.post('/api/admin/add-sample-videos', async (request, reply) => {
    // 适合小学生的 B站视频精选
    const sampleVideos = [
      {
        platform: 'bilibili',
        videoId: 'BV1qW4y1a7Xf', // 科学实验：会走的水
        title: '神奇的科学实验：会走的水！小朋友必看',
        coverUrl: 'https://i0.hdslb.com/bfs/archive/album/cover/科学实验.jpg',
        videoUrl: 'https://player.bilibili.com/player.html?bvid=BV1qW4y1a7Xf&autoplay=0',
        sourceUrl: 'https://www.bilibili.com/video/BV1qW4y1a7Xf',
        category: '科普',
        duration: 180
      },
      {
        platform: 'bilibili',
        videoId: 'BV1z44y1J7dG', // 动画：小猪佩奇
        title: '小猪佩奇 中文版 第1集',
        coverUrl: 'https://i0.hdslb.com/bfs/archive/album/cover/小猪佩奇.jpg',
        videoUrl: 'https://player.bilibili.com/player.html?bvid=BV1z44y1J7dG&autoplay=0',
        sourceUrl: 'https://www.bilibili.com/video/BV1z44y1J7dG',
        category: '动画',
        duration: 300
      },
      {
        platform: 'bilibili',
        videoId: 'BV1GJ411x7z7', // 为中国点赞 (已存在，跳过)
        title: '为中国点赞',
        coverUrl: 'https://i1.hdslb.com/bfs/archive/3027d3a875db431f83749970ca31c81a1789bb2f.jpg',
        videoUrl: 'https://player.bilibili.com/player.html?bvid=BV1GJ411x7z7&autoplay=0',
        sourceUrl: 'https://www.bilibili.com/video/BV1GJ411x7z7',
        category: '其他',
        duration: 47
      },
      {
        platform: 'bilibili',
        videoId: 'BV1Ss421w7Eg', // 成语故事
        title: '成语故事：画蛇添足 - 小学生必学成语',
        coverUrl: 'https://i0.hdslb.com/bfs/archive/album/cover/成语故事.jpg',
        videoUrl: 'https://player.bilibili.com/player.html?bvid=BV1Ss421w7Eg&autoplay=0',
        sourceUrl: 'https://www.bilibili.com/video/BV1Ss421w7Eg',
        category: '故事',
        duration: 240
      },
      {
        platform: 'bilibili',
        videoId: 'BV1Xt411f7cc', // 数学趣味
        title: '趣味数学：神奇的数字世界',
        coverUrl: 'https://i0.hdslb.com/bfs/archive/album/cover/趣味数学.jpg',
        videoUrl: 'https://player.bilibili.com/player.html?bvid=BV1Xt411f7cc&autoplay=0',
        sourceUrl: 'https://www.bilibili.com/video/BV1Xt411f7cc',
        category: '数学趣味',
        duration: 360
      },
      {
        platform: 'bilibili',
        videoId: 'BV1Yx411L7cS', // 英语学习
        title: '小学英语：轻松学单词 ABC',
        coverUrl: 'https://i0.hdslb.com/bfs/archive/album/cover/英语学习.jpg',
        videoUrl: 'https://player.bilibili.com/player.html?bvid=BV1Yx411L7cS&autoplay=0',
        sourceUrl: 'https://www.bilibili.com/video/BV1Yx411L7cS',
        category: '英语学习',
        duration: 420
      },
      {
        platform: 'bilibili',
        videoId: 'BV1r44y1B7wX', // 儿童音乐
        title: '儿童歌曲：两只老虎 童谣合集',
        coverUrl: 'https://i0.hdslb.com/bfs/archive/album/cover/儿童歌曲.jpg',
        videoUrl: 'https://player.bilibili.com/player.html?bvid=BV1r44y1B7wX&autoplay=0',
        sourceUrl: 'https://www.bilibili.com/video/BV1r44y1B7wX',
        category: '音乐',
        duration: 280
      },
      {
        platform: 'bilibili',
        videoId: 'BV1cV4y1o7DQ', // 自然探索
        title: '探索大自然：神奇动物在哪里',
        coverUrl: 'https://i0.hdslb.com/bfs/archive/album/cover/自然探索.jpg',
        videoUrl: 'https://player.bilibili.com/player.html?bvid=BV1cV4y1o7DQ&autoplay=0',
        sourceUrl: 'https://www.bilibili.com/video/BV1cV4y1o7DQ',
        category: '科学探索',
        duration: 320
      }
    ]

    let added = 0
    let skipped = 0

    for (const v of sampleVideos) {
      // 检查是否已存在
      const existing = await prisma.video.findFirst({
        where: { platform: v.platform, videoId: v.videoId }
      })
      
      if (existing) {
        skipped++
        continue
      }

      await prisma.video.create({
        data: {
          platform: v.platform,
          videoId: v.videoId,
          title: v.title,
          coverUrl: v.coverUrl,
          videoUrl: v.videoUrl,
          sourceUrl: v.sourceUrl,
          category: v.category,
          duration: v.duration,
          status: 'active'
        }
      })
      added++
    }

    return { success: true, added, skipped, total: sampleVideos.length }
  })

  // 管理员: 获取所有视频 (包括禁用的)
  fastify.get('/api/admin/videos', async (request: FastifyRequest<{ Querystring: VideoQuery }>, reply: FastifyReply) => {
    const { category, page = '1', limit = '50' } = request.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {
      ...(category && category !== '全部' ? { category } : {})
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.video.count({ where })
    ])

    return {
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    }
  })
}
