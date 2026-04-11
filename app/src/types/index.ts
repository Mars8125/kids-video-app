// 视频数据类型
export interface Video {
  id: string
  platform: 'bilibili' | 'douyin' | 'videoweixin'
  videoId: string
  title: string
  coverUrl: string
  videoUrl: string
  sourceUrl: string
  category: string
  duration?: number
  author?: string
  likeCount: number
  createdAt: string
}

// 分类类型
export interface Category {
  name: string
  icon: string
}

// API 响应类型
export interface ApiResponse<T> {
  videos?: Video[]
  video?: Video
  categories?: Category[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  success?: boolean
  likeCount?: number
  error?: string
}
