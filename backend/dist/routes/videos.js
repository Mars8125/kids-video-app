/**
 * 视频相关 API 路由
 */
import { prisma } from '../services/db.js';
export async function videoRoutes(fastify) {
    // 获取视频列表
    fastify.get('/api/videos', async (request, reply) => {
        const { category, page = '1', limit = '20' } = request.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {
            status: 'active',
            ...(category && category !== '全部' ? { category } : {})
        };
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
        ]);
        return {
            videos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        };
    });
    // 获取单个视频
    fastify.get('/api/videos/:id', async (request, reply) => {
        const { id } = request.params;
        const video = await prisma.video.findUnique({
            where: { id }
        });
        if (!video || video.status !== 'active') {
            return reply.status(404).send({ error: '视频不存在' });
        }
        // 增加浏览量
        await prisma.video.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
        });
        return { video };
    });
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
        ];
        return { categories };
    });
    // 点赞视频
    fastify.post('/api/videos/:id/like', async (request, reply) => {
        const { id } = request.params;
        const video = await prisma.video.update({
            where: { id },
            data: { likeCount: { increment: 1 } }
        });
        return { success: true, likeCount: video.likeCount };
    });
    // 管理员: 添加视频 (API方式)
    fastify.post('/api/admin/videos', async (request, reply) => {
        const body = request.body;
        const existing = await prisma.video.findFirst({
            where: {
                platform: body.platform,
                videoId: body.videoId
            }
        });
        if (existing) {
            return reply.status(400).send({ error: '视频已存在' });
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
        });
        return { success: true, video };
    });
    // 管理员: 删除视频
    fastify.delete('/api/admin/videos/:id', async (request, reply) => {
        const { id } = request.params;
        await prisma.video.update({
            where: { id },
            data: { status: 'disabled' }
        });
        return { success: true };
    });
    // 管理员: 获取所有视频 (包括禁用的)
    fastify.get('/api/admin/videos', async (request, reply) => {
        const { category, page = '1', limit = '50' } = request.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {
            ...(category && category !== '全部' ? { category } : {})
        };
        const [videos, total] = await Promise.all([
            prisma.video.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.video.count({ where })
        ]);
        return {
            videos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        };
    });
}
