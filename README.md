# 🎬 小学生视频App - kids-video-app

小学生竖屏刷视频应用，后端 + Telegram Bot管理 + React Native App。

## 📦 部署到 Railway（小白专用）

### 第一步：在 Railway 创建项目

1. 打开 👉 **https://railway.app** ，用 GitHub 登录
2. 点击 **New Project** → 选择 **Deploy from GitHub repo**
3. 找到并选择 `kids-video-app` 仓库
4. Railway 会自动识别 backend 目录

### 第二步：添加数据库

1. 在 Railway 项目页面，点 **Add a Service** → **Database** → **Add PostgreSQL**
2. 等 PostgreSQL 创建完成，Railway 会自动生成 `DATABASE_URL` 环境变量

### 第三步：添加环境变量

在 Railway 项目页面，点 **Variables**，添加以下环境变量：

```
TELEGRAM_BOT_TOKEN=你的Telegram Bot Token
TELEGRAM_ADMIN_CHAT_ID=你的Telegram用户ID
```

> 💡 Bot Token 获取： Telegram 找 **@BotFather** → `/newbot`
> 💡 Chat ID 获取： Telegram 找 **@userinfobot** → 发任意消息，它会告诉你你的ID

### 第四步：部署

1. Railway 会自动检测到 backend 并开始部署
2. 等待 **Build** → **Deploy** 完成（大概 2-3 分钟）
3. 点开 **Deployments** 查看状态，绿色 ✅ = 成功
4. 点 **Settings** → **Networking** → **Public Networking** → **Generate Domain**
5. 复制生成的域名，例如：`https://kids-video-app.up.railway.app`

### 第五步：Telegram Bot 配置

把上面的域名填到 Telegram Bot 的 webhook 或者直接发视频链接给 Bot 测试。

---

## 📱 App 配置

打开 `app/src/services/api.ts`，把 `YOUR_BACKEND_API_URL` 换成你的 Railway 域名：

```typescript
const API_BASE = 'https://kids-video-app.up.railway.app/api'
```

然后运行：

```bash
cd app
npm install
npx expo start
```

---

## 🧪 本地开发

### 后端
```bash
cd backend
cp .env.example .env
# 填写 .env 里的值
npm install
npx prisma db push
npm run dev
```

### App
```bash
cd app
npm install
npx expo start
```

---

## 🗂️ 项目结构

```
kids-video-app/
├── backend/               # Node.js + Fastify 后端
│   └── src/
│       ├── index.ts       # 入口，Fastify 服务
│       ├── routes/videos.ts    # REST API
│       └── services/
│           ├── telegramBot.ts      # Telegram Bot
│           ├── videoParser.ts      # 链接解析
│           ├── metadataFetcher.ts  # B站元数据
│           └── categorizer.ts     # 自动分类
├── app/                  # React Native + Expo App
│   └── src/
│       ├── screens/      # HomeScreen + VideoPlayerScreen
│       ├── components/   # VideoCard + CategoryTabs
│       ├── hooks/        # useVideos
│       └── services/     # API 调用
└── railway.json         # Railway 部署配置
```

## 🤖 Telegram Bot 命令

- 发送视频链接（B站/抖音/视频号）→ 自动解析并入库
- `/start` → 欢迎消息
- `/list` → 查看已添加视频列表
- `/stats` → 统计信息

## 📂 分类规则（自动）

| 分类 | 关键词 |
|------|--------|
| 科普 | 科学、实验、知识、为什么 |
| 动画 | 动画、卡通、动漫 |
| 音乐 | 歌曲、唱歌、音乐 |
| 手工 | 手工、折纸、DIY |
| 游戏 | 游戏、我的世界、Minecraft |
| 其他 | 默认分类 |
