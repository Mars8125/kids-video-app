/**
 * 自动分类服务
 * 基于标题关键词匹配
 */

interface CategoryRule {
  name: string
  keywords: string[]
  priority: number
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    name: '科学探索',
    keywords: ['实验', '科学', '宇宙', '星球', '动物', '自然', '物理', '化学', '生物', '天文', '地理', '恐龙', '机器人', '编程', 'scratch'],
    priority: 1
  },
  {
    name: '历史故事',
    keywords: ['历史', '古代', '朝代', '战争', '人物', '三国', '西游', '神话', '成语', '故事'],
    priority: 2
  },
  {
    name: '数学趣味',
    keywords: ['数学', '几何', '计算', '逻辑', '奥数', '趣味数学', '速算', '脑筋急转弯'],
    priority: 3
  },
  {
    name: '语文阅读',
    keywords: ['诗词', '作文', '成语', '故事', '阅读', '古诗', '背诵', '朗读', '认字', '拼音'],
    priority: 4
  },
  {
    name: '音乐艺术',
    keywords: ['音乐', '歌曲', '舞蹈', '绘画', '画画', '手工', '折纸', '美术', '乐器', '钢琴', '吉他'],
    priority: 5
  },
  {
    name: '体育运动',
    keywords: ['运动', '足球', '篮球', '游泳', '跑步', '体操', '武术', '跆拳道', '滑雪', '滑冰'],
    priority: 6
  },
  {
    name: '英语学习',
    keywords: ['英语', '英文', '口语', '字母', '单词', '音标', '对话', 'english', 'ABC'],
    priority: 7
  }
]

export function categorizeByTitle(title: string): string {
  const lowerTitle = title.toLowerCase()
  
  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (lowerTitle.includes(keyword.toLowerCase())) {
        return rule.name
      }
    }
  }
  
  return '其他'
}

export function getAllCategories(): string[] {
  return CATEGORY_RULES.map(r => r.name).concat(['其他'])
}
