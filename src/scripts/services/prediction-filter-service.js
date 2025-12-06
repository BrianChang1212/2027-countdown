/**
 * 預測市場過濾服務模組
 * 負責市場數據的過濾、排序和搜尋功能
 */

const PredictionFilterService = (function() {
    'use strict';

    /**
     * 過濾市場數據
     * @param {Array} markets - 市場數據陣列
     * @param {string} category - 分類篩選（'all' 表示全部）
     * @param {string} searchTerm - 搜尋關鍵字
     * @returns {Array} 過濾後的市場陣列
     */
    function filterMarkets(markets, category = 'all', searchTerm = '') {
        let filtered = markets;

        // 分類篩選
        if (category && category !== 'all') {
            filtered = filtered.filter(market => market.category === category);
        }

        // 搜尋篩選
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(market => 
                market.question.toLowerCase().includes(term)
            );
        }

        return filtered;
    }

    /**
     * 排序市場數據
     * @param {Array} markets - 市場數據陣列
     * @param {string} sortBy - 排序方式 ('volume', 'participants', 'date', 'probability')
     * @returns {Array} 排序後的市場陣列
     */
    function sortMarkets(markets, sortBy = 'volume') {
        return [...markets].sort((a, b) => {
            switch (sortBy) {
                case 'volume':
                    const volA = parseFloat(a.volume.replace(/[^0-9.]/g, '')) || 0;
                    const volB = parseFloat(b.volume.replace(/[^0-9.]/g, '')) || 0;
                    return volB - volA;
                case 'participants':
                    return (b.participants || 0) - (a.participants || 0);
                case 'date':
                    return new Date(a.endDate || 0) - new Date(b.endDate || 0);
                case 'probability':
                    return (b.yesPercentage || 0) - (a.yesPercentage || 0);
                default:
                    return 0;
            }
        });
    }

    /**
     * 計算統計資訊
     * @param {Array} markets - 市場數據陣列
     * @returns {Object} 統計資訊物件
     */
    function calculateStats(markets) {
        const totalMarkets = markets.length;
        
        const totalVolume = markets.reduce((sum, market) => {
            return sum + (parseFloat(market.volume.replace(/[^0-9.]/g, '')) || 0);
        }, 0);
        
        const totalParticipants = markets.reduce((sum, market) => {
            return sum + (market.participants || 0);
        }, 0);

        return {
            totalMarkets,
            totalVolume,
            totalParticipants
        };
    }

    /**
     * 去重市場數據（基於問題）
     * @param {Array} markets - 市場數據陣列
     * @returns {Array} 去重後的市場陣列
     */
    function deduplicateMarkets(markets) {
        const seen = new Set();
        return markets.filter(market => {
            const key = (market.question || '').toLowerCase();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    return {
        filterMarkets,
        sortMarkets,
        calculateStats,
        deduplicateMarkets
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.PredictionFilterService = PredictionFilterService;
}

