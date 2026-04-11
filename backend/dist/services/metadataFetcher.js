/**
 * B站元数据获取
 * 使用 B站官方 API，无需登录即可获取视频信息
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
const BILIBILI_API = 'https://api.bilibili.com/x/web-interface/view';
const BILIBILI_SHORT_API = 'https://api.bilibili.com/x/web-interface/view?bvid=';
export async function fetchBilibiliMetadata(bvid) {
    try {
        // 先尝试短链解析
        let finalBvid = bvid;
        if (bvid.length < 12) {
            const res = await axios.get(`https://b23.tv/${bvid}`, {
                maxRedirects: 5,
                timeout: 10000
            });
            const match = res.request.res.responseUrl.match(/bilibili\.com\/video\/(BV\w+)/);
            if (match) {
                finalBvid = match[1];
            }
        }
        const response = await axios.get(BILIBILI_API, {
            params: { bvid: finalBvid },
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Referer': 'https://www.bilibili.com'
            }
        });
        const data = response.data;
        if (data.code !== 0 || !data.data) {
            console.error('B站API返回错误:', data.message);
            return null;
        }
        const videoData = data.data;
        return {
            title: videoData.title,
            coverUrl: videoData.pic,
            description: videoData.desc,
            duration: videoData.duration,
            author: videoData.owner.name,
            embedUrl: `https://player.bilibili.com/player.html?bvid=${finalBvid}&autoplay=0`
        };
    }
    catch (error) {
        console.error('获取B站元数据失败:', error);
        return null;
    }
}
/**
 * 备用方案: 通过网页爬取 (如果API失败)
 */
export async function fetchBilibiliMetadataFromPage(bvid) {
    try {
        const response = await axios.get(`https://www.bilibili.com/video/${bvid}`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        const script = $('script').get();
        let title = '未知标题';
        let coverUrl = '';
        let description = '';
        for (const s of script) {
            const text = $(s).html() || '';
            if (text.includes('window.__playinfo__') || text.includes('window.__INITIAL_STATE__')) {
                const match = text.match(/"title":"([^"]+)"/);
                if (match)
                    title = match[1];
                const coverMatch = text.match(/"pic":"([^"]+)"/);
                if (coverMatch)
                    coverUrl = coverMatch[1];
                const descMatch = text.match(/"desc":"([^"]+)"/);
                if (descMatch)
                    description = descMatch[1];
                break;
            }
        }
        return {
            title,
            coverUrl,
            description,
            duration: 0,
            author: '',
            embedUrl: `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0`
        };
    }
    catch (error) {
        console.error('B站网页爬取失败:', error);
        return null;
    }
}
