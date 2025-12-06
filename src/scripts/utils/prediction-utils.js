/**
 * 預測市場工具函數模組
 * 提供預測市場相關的工具函數
 */

const PredictionUtils = (function() {
    'use strict';

    /**
     * 獲取翻譯文字
     */
    function t(key, defaultValue = '') {
        if (typeof I18nModule !== 'undefined' && I18nModule.t) {
            return I18nModule.t(key) || defaultValue;
        }
        return defaultValue;
    }

    /**
     * 翻譯問題文字
     * @param {string} questionText - 問題文字
     * @returns {string} 翻譯後的問題文字
     */
    function translateQuestion(questionText) {
        if (!questionText) return questionText;
        
        // 使用配置模組獲取翻譯鍵
        if (typeof PredictionMarketsConfig !== 'undefined' && PredictionMarketsConfig.getTranslationKey) {
            const translationKey = PredictionMarketsConfig.getTranslationKey(questionText);
            if (translationKey) {
                const translated = t(translationKey);
                if (translated && translated !== translationKey) {
                    return translated;
                }
            }
        }
        
        // 如果沒有找到翻譯，返回原始文字
        return questionText;
    }

    /**
     * 格式化交易量
     * @param {string} volume - 交易量字串（如 '$612,000'）
     * @returns {number} 數值
     */
    function parseVolume(volume) {
        return parseFloat(volume.replace(/[^0-9.]/g, '')) || 0;
    }

    /**
     * 格式化交易量顯示
     * @param {number|string} volume - 交易量
     * @returns {string} 格式化後的交易量字串
     */
    function formatVolume(volume) {
        const num = typeof volume === 'string' ? parseVolume(volume) : volume;
        if (num >= 1000) {
            return `$${(num / 1000).toFixed(0)}K`;
        }
        return `$${num.toFixed(0)}`;
    }

    /**
     * 獲取趨勢圖示
     * @param {string} trend - 趨勢類型 ('up', 'down', 'stable')
     * @returns {string} 趨勢圖示
     */
    function getTrendIcon(trend) {
        switch (trend) {
            case 'up':
                return '📈';
            case 'down':
                return '📉';
            case 'stable':
            default:
                return '➡️';
        }
    }

    /**
     * 獲取趨勢 CSS 類名
     * @param {string} trend - 趨勢類型
     * @returns {string} CSS 類名
     */
    function getTrendClass(trend) {
        switch (trend) {
            case 'up':
                return 'trend-up';
            case 'down':
                return 'trend-down';
            case 'stable':
            default:
                return 'trend-stable';
        }
    }

    return {
        translateQuestion,
        parseVolume,
        formatVolume,
        getTrendIcon,
        getTrendClass
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.PredictionUtils = PredictionUtils;
}

