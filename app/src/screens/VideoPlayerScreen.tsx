import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Share,
  ActivityIndicator
} from 'react-native'
import { WebView } from 'react-native-webview'
import { Video } from '../types'
import { likeVideo } from '../services/api'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface VideoPlayerScreenProps {
  video: Video
  onBack?: () => void
  navigation?: any
}

export function VideoPlayerScreen({ video, onBack, navigation }: VideoPlayerScreenProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(video.likeCount)
  const [loading, setLoading] = useState(true)

  const handleLike = async () => {
    if (liked) return
    setLiked(true)
    setLikeCount(prev => prev + 1)
    try {
      await likeVideo(video.id)
    } catch (err) {
      // 失败也不回滚，避免重复点击
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `来看看这个有趣的视频: ${video.title}`,
        url: video.sourceUrl
      })
    } catch (error) {
      console.error('分享失败:', error)
    }
  }

  const getEmbedHtml = () => {
    // 根据平台生成嵌入HTML
    if (video.platform === 'bilibili') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; background: #000; }
            iframe { width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <iframe 
            src="${video.videoUrl}&autoplay=1" 
            allow="autoplay; fullscreen"
            allowfullscreen
          ></iframe>
        </body>
        </html>
      `
    }
    
    // 抖音/视频号使用原链接 WebView
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
        <style>
          * { margin: 0; padding: 0; }
          body { display: flex; justify-content: center; align-items: center; height: 100vh; background: #000; }
          .container { width: 100%; text-align: center; }
          a { color: #fff; font-size: 18px; text-decoration: none; background: #25F4EE; padding: 12px 24px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <p style="color: #fff; margin-bottom: 20px;">请点击下方链接在浏览器中观看</p>
          <a href="${video.sourceUrl}" target="_blank">打开视频</a>
        </div>
      </body>
      </html>
    `
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <View style={styles.platformBadge}>
          <Text style={styles.platformText}>
            {video.platform === 'bilibili' ? '📺 B站' : 
             video.platform === 'douyin' ? '🎵 抖音' : '💬 视频号'}
          </Text>
        </View>
      </View>

      {/* Video Player */}
      <View style={styles.playerContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        )}
        {video.platform === 'bilibili' ? (
          <WebView
            source={{ html: getEmbedHtml() }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.externalPlayer}>
            <Text style={styles.externalIcon}>
              {video.platform === 'douyin' ? '🎵' : '💬'}
            </Text>
            <Text style={styles.externalTitle}>{video.title}</Text>
            <Text style={styles.externalHint}>
              {video.platform === 'douyin' 
                ? '该平台暂不支持直接播放\n请在浏览器中打开观看'
                : '请在浏览器中打开观看'}
            </Text>
            <TouchableOpacity 
              style={styles.openButton}
              onPress={() => {
                // TODO: 使用 Linking.openURL 打开外部浏览器
              }}
            >
              <Text style={styles.openButtonText}>在浏览器中打开</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Video Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{video.title}</Text>
        
        <View style={styles.metaRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{video.category}</Text>
          </View>
          <Text style={styles.date}>
            {new Date(video.createdAt).toLocaleDateString('zh-CN')}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, liked && styles.actionButtonLiked]} 
            onPress={handleLike}
            disabled={liked}
          >
            <Text style={styles.actionIcon}>{liked ? '❤️' : '🤍'}</Text>
            <Text style={styles.actionText}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>分享</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  platformBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  platformText: {
    color: '#fff',
    fontSize: 14,
  },
  playerContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 9 / 16,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1,
  },
  loadingText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
  externalPlayer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  externalIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  externalTitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  externalHint: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  openButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginTop: -24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 26,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryBadge: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  categoryText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '500',
  },
  date: {
    color: '#999',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonLiked: {
    opacity: 0.7,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
})
