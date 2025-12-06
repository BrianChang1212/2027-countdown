/**
 * RSS 解析服務模組
 * 負責從 RSS 來源獲取和解析新聞數據
 */

const RSSParserService = (function() {
    'use strict';

    // RSS2JSON API 端點
    const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';

    /**
     * 移除 HTML 標籤
     * @param {string} html - 含 HTML 的字串
     * @returns {string} 純文字
     */
    function stripHtml(html) {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    }

    /**
     * 透過 rss2json 取得 RSS 資料
     * @param {string} rssUrl - RSS 網址
     * @param {number} timeout - 超時時間（毫秒），預設 1000ms（1秒）
     * @param {boolean} filterKeywords - 是否需要關鍵字過濾（可選，預設 false）
     * @returns {Promise<Array>} 新聞項目陣列
     */
    async function fetchRSS(rssUrl, timeout = 1000, filterKeywords = false) {
        const apiUrl = `${RSS2JSON_API}?rss_url=${encodeURIComponent(rssUrl)}`;
        
        try {
            // 設定超時
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                // 422 和 500 錯誤通常表示 RSS 來源無法處理，靜默跳過
                if (response.status === 422 || response.status === 500) {
                    return [];
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'ok' && data.items) {
                let items = data.items.map(item => ({
                    title: item.title,
                    description: item.description ? stripHtml(item.description) : '',
                    link: item.link,
                    pubDate: item.pubDate,
                    source: data.feed ? data.feed.title : '新聞來源'
                }));
                
                // 如果需要過濾關鍵字，使用 NewsFilterService
                if (filterKeywords && typeof NewsFilterService !== 'undefined') {
                    items = NewsFilterService.filterByKeywords(items);
                }
                
                return items;
            }
            return [];
        } catch (error) {
            // 超時或其他錯誤，靜默跳過
            if (error.name !== 'AbortError') {
                // 只有非超時錯誤才記錄（可選）
                // Logger.warn(`RSS 載入失敗: ${rssUrl.substring(0, 50)}...`, error.message);
            }
            return [];
        }
    }

    /**
     * 批量獲取多個 RSS 來源的新聞
     * @param {Array<Object>} sources - 來源配置陣列
     * @param {number} timeout - 超時時間（毫秒）
     * @returns {Promise<Array>} 所有來源的新聞項目陣列
     */
    async function fetchMultipleRSS(sources, timeout = 1000) {
        const promises = sources.map(source => 
            fetchRSS(source.url, timeout)
        );
        const results = await Promise.allSettled(promises);
        
        const allNews = [];
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
                // 標記來源名稱
                const newsWithSource = result.value.map(news => ({
                    ...news,
                    sourceName: sources[index].name
                }));
                allNews.push(...newsWithSource);
            }
        });
        
        return allNews;
    }

    return {
        fetchRSS,
        fetchMultipleRSS,
        stripHtml
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.RSSParserService = RSSParserService;
}

