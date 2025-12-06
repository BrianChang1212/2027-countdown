/**
 * 新聞相關工具函數模組
 * 提供新聞格式化、日期處理等通用功能
 */

const NewsUtils = (function() {
    'use strict';

    /**
     * 格式化日期 (支援多語言)
     * @param {string} dateStr - 日期字串
     * @returns {string} 格式化後的日期
     */
    function formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            // 取得當前語言的時間單位
            const lang = typeof I18nModule !== 'undefined' ? I18nModule.getLanguage() : 'zh-TW';
            
            // 備用翻譯
            const timeLabels = {
                'zh-TW': { minutes: '分鐘前', hours: '小時前', days: '天前' },
                'zh-CN': { minutes: '分钟前', hours: '小时前', days: '天前' },
                'en': { minutes: 'min ago', hours: 'hours ago', days: 'days ago' },
                'ja': { minutes: '分前', hours: '時間前', days: '日前' },
                'ko': { minutes: '분 전', hours: '시간 전', days: '일 전' }
            };
            const labels = timeLabels[lang] || timeLabels['zh-TW'];

            if (diffMins < 60) {
                return `${diffMins} ${labels.minutes}`;
            } else if (diffHours < 24) {
                return `${diffHours} ${labels.hours}`;
            } else if (diffDays < 7) {
                return `${diffDays} ${labels.days}`;
            } else {
                const locale = lang === 'en' ? 'en-US' : (lang === 'zh-CN' ? 'zh-CN' : (lang === 'ja' ? 'ja-JP' : (lang === 'ko' ? 'ko-KR' : 'zh-TW')));
                return date.toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric'
                });
            }
        } catch {
            return '';
        }
    }

    /**
     * 取得分類標籤文字 (支援多語言)
     * @param {string} category - 分類代碼
     * @returns {string} 分類標籤
     */
    function getCategoryLabel(category) {
        const lang = typeof I18nModule !== 'undefined' ? I18nModule.getLanguage() : 'zh-TW';
        
        // 多語言標籤
        const allLabels = {
            'zh-TW': { 'taiwan': '台灣', 'international': '國際', 'cross-strait': '兩岸' },
            'zh-CN': { 'taiwan': '台湾', 'international': '国际', 'cross-strait': '两岸' },
            'en': { 'taiwan': 'Taiwan', 'international': 'Intl', 'cross-strait': 'Cross-Strait' },
            'ja': { 'taiwan': '台湾', 'international': '国際', 'cross-strait': '両岸' },
            'ko': { 'taiwan': '대만', 'international': '국제', 'cross-strait': '양안' }
        };
        
        const labels = allLabels[lang] || allLabels['zh-TW'];
        return labels[category] || category;
    }

    /**
     * 建立新聞卡片 HTML (支援多語言)
     * @param {Object} news - 新聞資料
     * @param {string} category - 分類
     * @returns {string} HTML 字串
     */
    function createNewsCard(news, category) {
        const truncatedTitle = news.title.length > 60 
            ? news.title.substring(0, 60) + '...' 
            : news.title;
        const truncatedDesc = news.description.length > 80 
            ? news.description.substring(0, 80) + '...' 
            : news.description;
        
        // 取得「閱讀全文」翻譯
        let readMoreText = '閱讀全文';
        if (typeof I18nModule !== 'undefined') {
            const translated = I18nModule.t('readMore');
            if (translated) readMoreText = translated;
        }

        // 使用 sourceName（如果有的話），否則使用 source
        const sourceDisplay = news.sourceName || news.source || '新聞來源';
        
        return `
            <article class="news-card">
                <span class="news-category-tag">${getCategoryLabel(category)}</span>
                <div class="news-card-header">
                    <span class="news-source">${sourceDisplay}</span>
                    <span class="news-date">${formatDate(news.pubDate)}</span>
                </div>
                <h3 class="news-card-title">${truncatedTitle}</h3>
                <p class="news-card-description">${truncatedDesc}</p>
                <a href="${news.link}" target="_blank" rel="noopener noreferrer" class="news-card-link">
                    ${readMoreText}
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </a>
            </article>
        `;
    }

    /**
     * 截斷文字
     * @param {string} text - 原始文字
     * @param {number} maxLength - 最大長度
     * @returns {string} 截斷後的文字
     */
    function truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    return {
        formatDate,
        getCategoryLabel,
        createNewsCard,
        truncateText
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.NewsUtils = NewsUtils;
}

