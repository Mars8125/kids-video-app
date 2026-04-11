import axios from 'axios'
import { Video, Category, ApiResponse } from '../types'

// API 基础URL - 部署后替换
const API_BASE_URL = 'YOUR_BACKEND_API_URL'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 获取视频列表
export async function getVideos(
  category?: string,
  page: number = 1,
  limit: number = 20
): Promise<{ videos: Video[]; pagination: ApiResponse<Video>['pagination'] }> {
  const params: any = { page, limit }
  if (category && category !== '全部') {
    params.category = category
  }
  
  const response = await api.get<ApiResponse<Video>>('/api/videos', { params })
  return {
    videos: response.data.videos || [],
    pagination: response.data.pagination
  }
}

// 获取单个视频
export async function getVideo(id: string): Promise<Video | null> {
  const response = await api.get<ApiResponse<Video>>(`/api/videos/${id}`)
  return response.data.video || null
}

// 获取分类列表
export async function getCategories(): Promise<Category[]> {
  const response = await api.get<{ categories: Category[] }>('/api/categories')
  return response.data.categories || []
}

// 点赞视频
export async function likeVideo(id: string): Promise<number> {
  const response = await api.post<{ success: boolean; likeCount: number }>(
    `/api/videos/${id}/like`
  )
  return response.data.likeCount
}

export default api
