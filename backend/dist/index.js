/**
 * 主入口文件 - Railway deploy trigger v2
 */
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { videoRoutes } from './routes/videos.js';
import { prisma } from './services/db.js';
import { initTelegramBot } from './services/telegramBot.js';
const fastify = Fastify({
    logger: true
});
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// CORS - 允许所有来源访问
await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
});
// 注册 API 路由
await fastify.register(videoRoutes);
// 健康检查
// Telegram webhook 接收端
fastify.post('/telegram-webhook', async (request, reply) => {
    try {
        const { initTelegramBot } = await import('./services/telegramBot.js');
        const bot = await import('./services/telegramBot.js').then(m => m.getBot());
        if (bot && request.body) {
            bot.processUpdate(request.body);
        }
    }
    catch (e) {
        console.error('Webhook 处理错误:', e);
    }
    return 'ok';
});
fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});
// 根路由 → HTML5 视频 App 页面
fastify.get('/', async (request, reply) => {
    reply.type('text/html').send(`
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>小学生视频App</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: #000; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #fff;
      min-height: 100vh;
      overflow-x: hidden;
    }
    
    /* 顶部标题栏 */
    .header {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 56px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 0 16px;
    }
    .header h1 {
      font-size: 18px;
      font-weight: 600;
      background: linear-gradient(90deg, #ff6b6b, #ffd93d);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    /* 分类 Tab */
    .tabs {
      position: fixed;
      top: 56px; left: 0; right: 0;
      height: 44px;
      background: rgba(0,0,0,0.9);
      display: flex;
      overflow-x: auto;
      gap: 4px;
      padding: 6px 12px;
      z-index: 99;
      scrollbar-width: none;
    }
    .tabs::-webkit-scrollbar { display: none; }
    .tab {
      flex-shrink: 0;
      padding: 6px 14px;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 500;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.6);
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .tab.active {
      background: linear-gradient(90deg, #ff6b6b, #ffd93d);
      color: #fff;
    }
    
    /* 视频列表 */
    .video-list {
      padding-top: 108px;
      padding-bottom: 20px;
    }
    .video-card {
      width: 100%;
      aspect-ratio: 9/16;
      background: #111;
      position: relative;
      cursor: pointer;
      margin-bottom: 2px;
    }
    .video-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .video-card .overlay {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: 60px 16px 16px;
      background: linear-gradient(transparent, rgba(0,0,0,0.85));
    }
    .video-card .title {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .video-card .meta {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
    }
    .video-card .play-btn {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 64px; height: 64px;
      background: rgba(0,0,0,0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .video-card:hover .play-btn { opacity: 1; }
    
    /* 全屏播放器 */
    .player {
      position: fixed;
      inset: 0;
      background: #000;
      z-index: 200;
      display: none;
    }
    .player.active { display: block; }
    .player iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    .player .close {
      position: absolute;
      top: 16px; right: 16px;
      width: 40px; height: 40px;
      background: rgba(0,0,0,0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      z-index: 10;
    }
    .player .info {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: 80px 16px 24px;
      background: linear-gradient(transparent, rgba(0,0,0,0.9));
    }
    .player .info h2 {
      font-size: 16px;
      margin-bottom: 6px;
    }
    .player .info p {
      font-size: 13px;
      color: rgba(255,255,255,0.6);
    }
    .player .open-app {
      display: inline-block;
      margin-top: 12px;
      padding: 10px 20px;
      background: linear-gradient(90deg, #ff6b6b, #ffd93d);
      border-radius: 24px;
      font-size: 14px;
      font-weight: 600;
      color: #000;
      text-decoration: none;
    }
    
    /* 空状态 */
    .empty {
      padding: 120px 32px;
      text-align: center;
    }
    .empty .icon { font-size: 64px; margin-bottom: 16px; }
    .empty h2 { font-size: 20px; margin-bottom: 8px; }
    .empty p { font-size: 14px; color: rgba(255,255,255,0.5); }
    
    /* 加载动画 */
    .loading {
      padding: 120px 32px;
      text-align: center;
      font-size: 14px;
      color: rgba(255,255,255,0.5);
    }
    
    /* 刷新按钮 */
    .refresh-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 50px;
      height: 50px;
      background: linear-gradient(90deg, #ff6b6b, #ffd93d);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(255,107,107,0.4);
      z-index: 100;
      border: none;
      transition: transform 0.2s;
    }
    .refresh-btn:active { transform: scale(0.95); }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎬 小学生视频</h1>
  </div>
  
  <div class="tabs" id="tabs">
    <button class="tab active" data-category="all">全部</button>
    <button class="tab" data-category="动漫">动漫</button>
    <button class="tab" data-category="科普">科普</button>
    <button class="tab" data-category="音乐">音乐</button>
    <button class="tab" data-category="动画">动画</button>
    <button class="tab" data-category="故事">故事</button>
  </div>
  
  <div class="video-list" id="videoList">
    <div class="loading" id="loading">加载中...</div>
  </div>
  
  <!-- 全屏播放器 -->
  <div class="player" id="player">
    <div class="close" onclick="closePlayer()">✕</div>
    <iframe id="playerFrame" allow="autoplay; fullscreen" allowfullscreen></iframe>
    <div class="info" id="playerInfo"></div>
  </div>
  
  <button class="refresh-btn" onclick="loadVideos()" title="刷新">↻</button>
  
  <script>
    const API_BASE = '';
    let allVideos = [];
    
    // 加载视频
    async function loadVideos(category = 'all') {
      const list = document.getElementById('videoList');
      list.innerHTML = '<div class="loading">加载中...</div>';
      
      try {
        const res = await fetch(API_BASE + '/api/videos?page=1&limit=50');
        const data = await res.json();
        allVideos = data.videos || [];
        
        if (allVideos.length === 0) {
          list.innerHTML = \`
            <div class="empty">
              <div class="icon">🎬</div>
              <h2>还没有视频</h2>
              <p>去 Telegram Bot 发一个 B站链接试试<br>@Mars8125_bot</p>
            </div>
          \`;
          return;
        }
        
        // category 可能是字符串或对象，统一处理
        const getCategoryName = (v) => typeof v.category === 'string' ? v.category : v.category?.name;
        
        const filtered = category === 'all' 
          ? allVideos 
          : allVideos.filter(v => getCategoryName(v) === category);
        
        list.innerHTML = filtered.map(v => \`
          <div class="video-card" onclick="openPlayer('\${v.videoUrl}', '\${v.title}', '\${v.platform || ""}', '\${getCategoryName(v) || ""}')">
            <img src="\${v.coverUrl}" alt="\${v.title}" onerror="this.style.display='none'">
            <div class="play-btn">▶</div>
            <div class="overlay">
              <div class="title">\${v.title}</div>
              <div class="meta">\${v.platform || '未知'} · \${getCategoryName(v) || '未分类'} · \${formatDate(v.createdAt)}</div>
            </div>
          </div>
        \`).join('');
      } catch (err) {
        list.innerHTML = '<div class="empty"><div class="icon">😵</div><h2>加载失败</h2><p>请检查网络后点击右下角刷新</p></div>';
      }
    }
    
    function formatDate(d) {
      if (!d) return '';
      return new Date(d).toLocaleDateString('zh-CN');
    }
    
    // 播放视频
    function openPlayer(url, title, platform, category) {
      const player = document.getElementById('player');
      const frame = document.getElementById('playerFrame');
      const info = document.getElementById('playerInfo');
      
      let embedUrl = url;
      let openUrl = url;

      if (platform === 'bilibili') {
        // 从 URL 提取 BVID
        const bvMatch = url.match(/[?&]bvid=([^&]+)/i) || url.match(/\\/video\\/(BV[a-zA-Z0-9_]+)/i);
        const bvid = bvMatch ? bvMatch[1] : '';
        embedUrl = 'https://player.bilibili.com/player.html?bvid=' + bvid + '&autoplay=1&high_quality=1';
        openUrl = 'https://www.bilibili.com/video/' + bvid;
      } else if (platform === 'douyin') {
        embedUrl = 'about:blank'; // douyin 不支持 iframe，强开新窗口
        openUrl = url;
      }

      if (embedUrl === 'about:blank') {
        // 关闭全屏播放器，直接打开新标签
        player.classList.remove('active');
        window.open(openUrl, '_blank');
        return;
      }

      frame.src = embedUrl;
      info.innerHTML = \`
        <h2>\${title}</h2>
        <p>\${platform} · \${category}</p>
        <a href="\${openUrl}" target="_blank" class="open-link">↗ 在原站打开</a>
      \`;
      player.classList.add('active');
    }
    
    function closePlayer() {
      const frame = document.getElementById('playerFrame');
      frame.src = 'about:blank';
      document.getElementById('player').classList.remove('active');
    }
    
    // Tab 切换
    document.getElementById('tabs').addEventListener('click', e => {
      if (e.target.classList.contains('tab')) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        loadVideos(e.target.dataset.category);
      }
    });
    
    // ESC 关闭播放器
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closePlayer();
    });
    
    // 首次加载
    loadVideos();
  </script>
</body>
</html>
  `);
});
// 启动
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3000');
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Server running on port ${port}`);
        // 初始化 Telegram Bot (webhook 模式)
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.RAILWAY_PUBLIC_DOMAIN) {
            const webhookUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/telegram-webhook`;
            try {
                await initTelegramBot(process.env.TELEGRAM_BOT_TOKEN, webhookUrl);
            }
            catch (error) {
                console.error('Telegram Bot 初始化失败:', error);
            }
        }
        else {
            console.log('⚠️ 未配置 Telegram Bot');
        }
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n🛑 关闭中...');
    await prisma.$disconnect();
    await fastify.close();
    process.exit(0);
});
start();
