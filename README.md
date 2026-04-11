# 🎬 儿童视频 App

小学生专属视频平台，TikTok 风格，管理简单。

## 功能特性

- ✅ **TikTok 风格列表**：竖屏卡片流，流畅体验
- ✅ **自动分类**：根据标题关键词自动归类
- ✅ **Telegram Bot 管理**：复制链接发给 Bot，自动解析入库
- ✅ **B站优先支持**：B站视频嵌入播放，效果最佳
- ✅ **无登录访问**：直接打开就能用，无需注册
- ✅ **点赞功能**：本地记录，喜欢视频一键点赞

## 系统架构

```
┌─────────────────┐
│  你的手机       │  ← 分享视频链接
│  Telegram Bot  │
└────────┬────────┘
         │ 解析链接 + 抓取元数据
         ▼
┌─────────────────┐
│  后端 API       │  Node.js + Fastify
│  Railway 部署   │
└────────┬────────┘
         │ 存储视频元数据
         ▼
┌─────────────────┐
│  PostgreSQL    │  视频标题/封面/分类
│  Railway       │
└─────────────────┘
```

## 快速开始

### 1. 创建 Telegram Bot

1. 打开 Telegram，搜索 **@BotFather**
2. 发送 `/newbot`
3. 按提示设置 Bot 名称和用户名
4. 获得 **Bot Token**，格式类似：`123456789:ABCdefGhIJKlmNoPQRsTUVwxYZ`
5. 给自己发条消息，然后访问：`https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
6. 从返回的 JSON 中找到你的 **chat id**（数字格式）

### 2. 部署后端

**方式 A: Railway（一键部署，推荐）**

1. 注册 [Railway](https://railway.app)（GitHub 登录）
2. 点击 **New Project** → **Deploy from GitHub**
3. 选择此项目，fork 一份到你的 GitHub
4. 添加环境变量：
   - `TELEGRAM_BOT_TOKEN` = 你的 Bot Token
   - `TELEGRAM_ADMIN_CHAT_ID` = 你的 Chat ID
   - `DATABASE_URL` = PostgreSQL 连接字符串（Railway 会自动提供）
5. 部署完成，记下 URL（如：`https://kids-video-app.up.railway.app`）

**方式 B: 本地开发**

```bash
cd backend
cp .env.example .env
# 编辑 .env 填入配置
npm install
npx prisma db push
npm run dev
```

### 3. 构建 App

```bash
cd app

# 编辑 src/services/api.ts
# 将 YOUR_BACKEND_API_URL 替换为你的后端地址

npm install
npx expo start
```

**生成 iOS App（需要 Mac）**
```bash
npx expo run:ios
```

**生成 Android App**
```bash
npx expo run:android
```

**生成 APK 测试**
```bash
eas build --platform android --profile preview
```

### 4. 使用流程

1. 在 **Railway** 部署完成后，你的 Bot 就上线了
2. 刷 B站/抖音/视频号，看到好的小学生内容
3. 复制链接，发给 Telegram Bot
4. Bot 自动解析标题、封面，分类入库
5. 小学生打开 App 就能看到

## 项目结构

```
kids-video-app/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── index.ts        # 入口
│   │   ├── routes/
│   │   │   └── videos.ts   # API 路由
│   │   └── services/
│   │       ├── db.ts       # Prisma 客户端
│   │       ├── telegramBot.ts    # Telegram Bot
│   │       ├── videoParser.ts    # 链接解析
│   │       ├── metadataFetcher.ts # B站元数据
│   │       ├── douyinFetcher.ts  # 抖音/视频号
│   │       └── categorizer.ts    # 自动分类
│   └── prisma/
│       └── schema.prisma   # 数据库模型
│
├── app/                     # React Native App
│   ├── src/
│   │   ├── App.tsx         # 主入口
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx      # 首页
│   │   │   └── VideoPlayerScreen.tsx # 播放页
│   │   ├── components/
│   │   │   ├── VideoCard.tsx      # 视频卡片
│   │   │   └── CategoryTabs.tsx   # 分类标签
│   │   ├── hooks/
│   │   │   └── useVideos.ts       # 数据 Hook
│   │   ├── services/
│   │   │   └── api.ts             # API 客户端
│   │   └── types/
│   │       └── index.ts           # 类型定义
│   └── app.json           # Expo 配置
│
└── README.md
```

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/api/videos` | 获取视频列表 |
| GET | `/api/videos/:id` | 获取单个视频 |
| GET | `/api/categories` | 获取分类列表 |
| POST | `/api/videos/:id/like` | 点赞 |
| POST | `/api/admin/videos` | 管理员添加视频 |
| DELETE | `/api/admin/videos/:id` | 删除视频 |

## 后续迭代

- [ ] 抖音/视频号嵌入播放支持
- [ ] 管理后台网页（查看/编辑/删除）
- [ ] 数据统计面板
- [ ] 视频推荐算法
- [ ] 用户收藏功能
- [ ] 内容审核功能

## License

MIT
