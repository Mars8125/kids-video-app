/**
 * 视频链接解析器
 * 支持: B站, 抖音, 微信视频号
 */
export function parseVideoUrl(url) {
    // B站: https://b23.tv/xxxxxx 或 https://www.bilibili.com/video/BVxxxxxx
    const bilibiliMatch = url.match(/(?:b23\.tv|bilibili\.com\/video\/)([A-Za-z0-9]+)/);
    if (bilibiliMatch) {
        return {
            platform: 'bilibili',
            videoId: bilibiliMatch[1],
            sourceUrl: url
        };
    }
    // 抖音: https://v.douyin.com/xxxxxx
    const douyinMatch = url.match(/douyin\.com\/([a-zA-Z0-9]+)/);
    if (douyinMatch) {
        return {
            platform: 'douyin',
            videoId: douyinMatch[1],
            sourceUrl: url
        };
    }
    // 微信视频号
    const weixinMatch = url.match(/video\.weixin\.qq\.com\/[^\/]+\/([^\/\?]+)/);
    if (weixinMatch) {
        return {
            platform: 'videoweixin',
            videoId: weixinMatch[1],
            sourceUrl: url
        };
    }
    return null;
}
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
