/**
 * 新聞過濾服務模組
 * 負責過濾和分類新聞內容
 */

const NewsFilterService = (function() {
    'use strict';

    // 台灣/中國相關關鍵字（用於過濾新聞）
    const TAIWAN_CHINA_KEYWORDS = [
        // 台灣相關
        'taiwan', 'taipei', 'formosa', 'taiwanese', '台灣', '臺北', '中華民國',
        // 中國相關
        'china', 'chinese', 'beijing', 'mainland', '中國', '北京', '大陸',
        // 兩岸關係
        'strait', 'taiwan strait', 'cross-strait', 'straits', 'cross-straits',
        '兩岸', '台海', '海峽', '兩岸關係', '台海關係',
        // 統一/統一相關
        'reunification', 'unification', 'one china', '統一', '一個中國',
        // 軍事/安全
        'military', 'defense', 'security', 'invasion', 'invade', 'attack',
        '軍事', '國防', '安全', '入侵', '攻擊',
        // 經濟/科技
        'tsmc', 'semiconductor', 'chip', 'economy', 'trade',
        '台積電', '半導體', '晶片', '經濟', '貿易',
        // 政治
        'politics', 'diplomacy', 'recognition', 'independence',
        '政治', '外交', '承認', '獨立'
    ];

    /**
     * 檢查新聞是否與台灣/中國相關
     * @param {Object} item - 新聞項目
     * @returns {boolean} 是否相關
     */
    function isRelatedToTaiwanChina(item) {
        const title = (item.title || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const content = `${title} ${description}`;
        
        return TAIWAN_CHINA_KEYWORDS.some(keyword => 
            content.includes(keyword.toLowerCase())
        );
    }

    /**
     * 過濾新聞列表，只保留與台灣/中國相關的新聞
     * @param {Array<Object>} newsItems - 新聞項目陣列
     * @returns {Array<Object>} 過濾後的新聞項目陣列
     */
    function filterByKeywords(newsItems) {
        return newsItems.filter(item => isRelatedToTaiwanChina(item));
    }

    /**
     * 去重新聞列表（基於標題）
     * @param {Array<Object>} newsItems - 新聞項目陣列
     * @returns {Array<Object>} 去重後的新聞項目陣列
     */
    function deduplicateNews(newsItems) {
        const uniqueNews = [];
        const seenTitles = new Set();
        
        newsItems.forEach(news => {
            const titleKey = news.title.toLowerCase().trim();
            if (!seenTitles.has(titleKey)) {
                seenTitles.add(titleKey);
                uniqueNews.push(news);
            }
        });
        
        return uniqueNews;
    }

    /**
     * 按日期排序新聞（最新的在前）
     * @param {Array<Object>} newsItems - 新聞項目陣列
     * @returns {Array<Object>} 排序後的新聞項目陣列
     */
    function sortByDate(newsItems) {
        return [...newsItems].sort((a, b) => {
            const dateA = new Date(a.pubDate || 0);
            const dateB = new Date(b.pubDate || 0);
            return dateB - dateA;
        });
    }

    return {
        isRelatedToTaiwanChina,
        filterByKeywords,
        deduplicateNews,
        sortByDate,
        TAIWAN_CHINA_KEYWORDS
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.NewsFilterService = NewsFilterService;
}

