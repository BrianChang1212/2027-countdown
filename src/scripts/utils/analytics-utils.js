/**
 * 分析工具函數模組
 * 提供訪客分析相關的工具函數
 */

const AnalyticsUtils = (function() {
    'use strict';

    /**
     * 獲取國家旗幟 emoji
     * @param {string} countryCode - 國家代碼（ISO 3166-1 alpha-2）
     * @returns {string} 國家旗幟 emoji
     */
    function getCountryFlag(countryCode) {
        if (!countryCode || countryCode.length !== 2) {
            return '🌍';
        }
        
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        
        return String.fromCodePoint(...codePoints);
    }

    /**
     * 格式化數字（添加千分位逗號）
     * @param {number} num - 數字
     * @returns {string} 格式化後的數字字串
     */
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    return {
        getCountryFlag,
        formatNumber
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.AnalyticsUtils = AnalyticsUtils;
}

