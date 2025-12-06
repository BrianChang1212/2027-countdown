/**
 * 預測市場卡片組件模組
 * 負責生成市場卡片的 HTML
 */

const PredictionMarketCard = (function() {
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
     * 生成單個市場卡片 HTML
     * @param {Object} market - 市場數據物件
     * @returns {string} HTML 字串
     */
    function createCard(market) {
        const trendIcon = (typeof PredictionUtils !== 'undefined' && PredictionUtils.getTrendIcon)
            ? PredictionUtils.getTrendIcon(market.trend)
            : (market.trend === 'up' ? '📈' : market.trend === 'down' ? '📉' : '➡️');
        
        const trendClass = (typeof PredictionUtils !== 'undefined' && PredictionUtils.getTrendClass)
            ? PredictionUtils.getTrendClass(market.trend)
            : (market.trend === 'up' ? 'trend-up' : market.trend === 'down' ? 'trend-down' : 'trend-stable');
        
        const translatedQuestion = (typeof PredictionUtils !== 'undefined' && PredictionUtils.translateQuestion)
            ? PredictionUtils.translateQuestion(market.question)
            : (market.question || '');

        return `
            <div class="prediction-market-card" data-category="${market.category || ''}" data-id="${market.id || ''}">
                <div class="market-header">
                    <div class="market-category-badge">
                        <span class="market-category" data-i18n="category.${market.category || 'other'}">${market.category || 'other'}</span>
                        <span class="trend-indicator ${trendClass}">${trendIcon}</span>
                    </div>
                    <div class="market-source">
                        <span class="source-label">${market.source || 'Unknown'}</span>
                    </div>
                </div>
                
                <h3 class="market-question">${translatedQuestion}</h3>
                
                <div class="market-stats">
                    <div class="stat-item stat-no">
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${market.noPercentage || 0}%"></div>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label" data-i18n="statNo">不會</span>
                            <span class="stat-value">${market.noPercentage || 0}%</span>
                        </div>
                    </div>
                    <div class="stat-item stat-yes">
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${market.yesPercentage || 0}%"></div>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label" data-i18n="statYes">會</span>
                            <span class="stat-value">${market.yesPercentage || 0}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="market-meta">
                    <div class="meta-row">
                        <span class="meta-item">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                            </svg>
                            <span data-i18n="market.endDate">截止：${market.endDate || ''}</span>
                        </span>
                        <span class="meta-item">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 7H16.5c-.8 0-1.54.5-1.85 1.26L12.2 14H10v6h10z"/>
                            </svg>
                            <span>${(market.participants || 0).toLocaleString()} <span data-i18n="market.participants">參與者</span></span>
                        </span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-item volume-item">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                            </svg>
                            <span class="volume-value">${market.volume || '$0'}</span>
                        </span>
                        <span class="meta-item update-item">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            <span data-i18n="market.lastUpdate">更新：${market.lastUpdate || ''}</span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 批量生成市場卡片 HTML
     * @param {Array} markets - 市場數據陣列
     * @returns {string} HTML 字串
     */
    function createCards(markets) {
        if (!markets || markets.length === 0) {
            return '';
        }
        return markets.map(market => createCard(market)).join('');
    }

    return {
        createCard,
        createCards
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.PredictionMarketCard = PredictionMarketCard;
}

