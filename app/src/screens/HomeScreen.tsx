import React, { useState, useCallback } from 'react'
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TouchableOpacity
} from 'react-native'
import { useVideos, useCategories } from '../hooks/useVideos'
import { VideoCard } from '../components/VideoCard'
import { CategoryTabs } from '../components/CategoryTabs'
import { Video } from '../types'

interface HomeScreenProps {
  onVideoPress?: (video: Video) => void
  navigation?: any
}

export function HomeScreen({ onVideoPress, navigation }: HomeScreenProps) {
  const handleVideoPress = (video: Video) => {
    if (onVideoPress) {
      onVideoPress(video)
    } else if (navigation) {
      navigation.navigate('Player', { video })
    }
  }
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const { categories } = useCategories()
  const { videos, loading, refreshing, hasMore, error, refresh, loadMore } = useVideos(selectedCategory)

  const renderFooter = () => {
    if (!hasMore) return null
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#FF6B6B" />
        <Text style={styles.footerText}>加载更多...</Text>
      </View>
    )
  }

  const renderEmpty = () => {
    if (loading) return null
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📺</Text>
        <Text style={styles.emptyText}>这个分类还没有视频</Text>
        <Text style={styles.emptySubtext}>管理员正在添加中~</Text>
      </View>
    )
  }

  const renderError = () => {
    if (!error) return null
    return (
      <View style={styles.error}>
        <Text style={styles.errorIcon}>😢</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎬 儿童视频</Text>
        <Text style={styles.headerSubtitle}>精选好内容，学习娱乐两不误</Text>
      </View>

      {/* 分类标签 */}
      <CategoryTabs
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* 视频列表 */}
      {error ? renderError() : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VideoCard video={item} onPress={() => handleVideoPress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#FF6B6B"
              colors={['#FF6B6B']}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Loading */}
      {loading && videos.length === 0 && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    color: '#888',
    fontSize: 14,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
})
