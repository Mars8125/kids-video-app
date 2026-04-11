import { useState, useEffect, useCallback } from 'react'
import { getVideos, getCategories } from '../services/api'
import { Video, Category } from '../types'

export function useVideos(category: string = '全部') {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const { videos: newVideos, pagination } = await getVideos(
        category === '全部' ? undefined : category,
        pageNum,
        20
      )

      if (isRefresh || pageNum === 1) {
        setVideos(newVideos)
      } else {
        setVideos(prev => [...prev, ...newVideos])
      }

      setHasMore(pageNum < (pagination?.totalPages || 1))
      setPage(pageNum)

    } catch (err: any) {
      setError(err.message || '获取视频失败')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [category])

  const refresh = useCallback(() => {
    fetchVideos(1, true)
  }, [fetchVideos])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchVideos(page + 1)
    }
  }, [loading, hasMore, page, fetchVideos])

  useEffect(() => {
    fetchVideos(1)
  }, [category])

  return {
    videos,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore
  }
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories()
        setCategories(data)
      } catch (err) {
        console.error('获取分类失败:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  return { categories, loading }
}
