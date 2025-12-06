/**
 * 預測市場統計顯示組件模組
 * 負責顯示預測市場的統計摘要信息
 */

const PredictionStats = (function() {
    'use strict';

    /**
     * 更新統計摘要
     * @param {Object} stats - 統計數據物件 { totalMarkets, totalVolume, totalParticipants }
     */
    function updateSummary(stats) {
        const totalMarkets = document.getElementById('total-markets');
        const totalVolume = document.getElementById('total-volume');
        const totalParticipants = document.getElementById('total-participants');

        if (totalMarkets) {
            totalMarkets.textContent = stats.totalMarkets || 0;
        }

        if (totalVolume) {
            const volume = stats.totalVolume || 0;
            totalVolume.textContent = `$${(volume / 1000).toFixed(0)}K`;
        }

        if (totalParticipants) {
            const participants = stats.totalParticipants || 0;
            totalParticipants.textContent = participants.toLocaleString();
        }
    }

    /**
     * 從市場數據計算統計
     * @param {Array} markets - 市場數據陣列
     * @returns {Object} 統計數據物件
     */
    function calculateStats(markets) {
        if (typeof PredictionFilterService !== 'undefined' && PredictionFilterService.calculateStats) {
            return PredictionFilterService.calculateStats(markets);
        }
        
        // 降級方案
        const totalMarkets = markets.length;
        const totalVolume = markets.reduce((sum, market) => {
            return sum + (parseFloat((market.volume || '').replace(/[^0-9.]/g, '')) || 0);
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
     * 更新統計顯示（自動計算）
     * @param {Array} markets - 市場數據陣列
     */
    function update(markets) {
        const stats = calculateStats(markets);
        updateSummary(stats);
    }

    return {
        updateSummary,
        calculateStats,
        update
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.PredictionStats = PredictionStats;
}

