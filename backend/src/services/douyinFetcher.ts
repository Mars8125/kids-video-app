/**
 * 抖音/视频号元数据获取
 * 注意: 这些平台反爬严格，此为备用方案，主要依赖B站
 */

import axios from 'axios'

export interface DouyinMetadata {
  title: string
  coverUrl: string
  videoUrl: string
}

/**
 * 抖音元数据获取
 * 使用第三方解析API (依赖外部服务)
 */
export async function fetchDouyinMetadata(shortCode: string): Promise<DouyinMetadata | null> {
  try {
    // 方式1: 使用 TikWM/TikHub 等第三方API
    // 注意: 这些服务可能不稳定，生产环境建议自建
    const response = await axios.get(`https://www.tikhub.io/api/v1/tiktok/fetch_one_video/?video_url=https://v.douyin.com/${shortCode}`, {
      timeout: 15000
    })

    if (response.data?.data) {
      const data = response.data.data
      return {
        title: data.title || '抖音视频',
        coverUrl: data.cover || data.thumbnail || '',
        videoUrl: data.play || data.video_url || ''
      }
    }
  } catch (error) {
    console.error('抖音解析失败:', error)
  }

  // 方式2: 备用 - 返回基本信息让用户手动填写
  return {
    title: '抖音视频',
    coverUrl: '',
    videoUrl: `https://v.douyin.com/${shortCode}`
  }
}

/**
 * 微信视频号元数据获取
 * 微信生态封闭，仅支持WebView嵌入
 */
export async function fetchVideoWeixinMetadata(videoId: string): Promise<{
  title: string
  coverUrl: string
  videoUrl: string
} | null> {
  // 视频号无法通过API获取元数据
  // 返回空信息，让用户手动补充
  return {
    title: '视频号内容',
    coverUrl: '',
    videoUrl: `https://video.weixin.qq.com/video/${videoId}`
  }
}
