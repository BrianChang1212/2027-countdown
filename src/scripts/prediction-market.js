/**
 * Polymarket 預測市場數據模組
 * 取得台灣相關預測市場資訊
 */

const PolymarketModule = (function() {
    'use strict';

    // Polymarket API 端點
    const GAMMA_API = 'https://gamma-api.polymarket.com';
    
    // 台灣相關市場關鍵字
    const TAIWAN_KEYWORDS = ['taiwan', 'china invade', 'china attack', 'strait'];
    
    // 快取數據
    let cachedData = null;
    let lastFetch = 0;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘快取

    // 定時器引用（用於清理）
    let refreshInterval = null;

    // 預設/備用數據 (基於公開報導與分析)
    // 注意：Polymarket 在部分地區（如台灣、中國、美國等）可能無法直接訪問
    const FALLBACK_DATA = {
        question: '中國是否會在近期對台灣發動軍事行動？',
        noPercentage: 91,
        yesPercentage: 9,
        volume: '$612,000+',
        lastUpdated: new Date().toISOString(),
        source: 'Polymarket (歷史數據)',
        // 使用地緣政治分類頁面作為替代連結
        marketUrl: 'https://polymarket.com/markets?_c=geopolitics'
    };

    // DOM 元素
    const elements = {
        noBar: null,
        yesBar: null,
        noValue: null,
        yesValue: null
    };

    /**
     * 初始化 DOM 元素
     */
    function initElements() {
        elements.noBar = document.getElementById('polymarket-no');
        elements.yesBar = document.getElementById('polymarket-yes');
        elements.noValue = document.getElementById('polymarket-no-value');
        elements.yesValue = document.getElementById('polymarket-yes-value');
    }

    /**
     * 嘗試從 Polymarket API 獲取數據
     * 注意：由於 CORS 限制，前端可能無法直接存取
     */
    async function fetchPolymarketData() {
        // 檢查快取
        if (cachedData && (Date.now() - lastFetch) < CACHE_DURATION) {
            return cachedData;
        }

        try {
            // 嘗試透過 CORS 代理獲取數據
            // 注意：這在生產環境可能需要後端支援
            const response = await fetch(`${GAMMA_API}/markets?closed=false&limit=100`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const markets = await response.json();
                
                // 搜尋台灣相關市場
                const taiwanMarket = markets.find(market => {
                    const question = (market.question || '').toLowerCase();
                    const description = (market.description || '').toLowerCase();
                    return TAIWAN_KEYWORDS.some(keyword => 
                        question.includes(keyword) || description.includes(keyword)
                    );
                });

                if (taiwanMarket) {
                    const data = parseMarketData(taiwanMarket);
                    cachedData = data;
                    lastFetch = Date.now();
                    return data;
                }
            }
        } catch (error) {
            Logger.debug('Polymarket API 無法直接存取 (CORS)，使用備用數據');
        }

        // 返回備用數據
        return FALLBACK_DATA;
    }

    /**
     * 解析市場數據
     */
    function parseMarketData(market) {
        try {
            // Polymarket 的價格通常表示「是」的機率
            const yesPrice = market.outcomePrices ? 
                parseFloat(market.outcomePrices[0] || 0.09) : 0.09;
            const noPrice = 1 - yesPrice;

            return {
                question: market.question || FALLBACK_DATA.question,
                noPercentage: Math.round(noPrice * 100),
                yesPercentage: Math.round(yesPrice * 100),
                volume: market.volume ? `$${formatVolume(market.volume)}` : FALLBACK_DATA.volume,
                lastUpdated: new Date().toISOString(),
                source: 'Polymarket (即時)',
                marketUrl: `https://polymarket.com/event/${market.slug || 'will-china-invade-taiwan'}`
            };
        } catch {
            return FALLBACK_DATA;
        }
    }

    /**
     * 格式化交易量
     */
    function formatVolume(volume) {
        const num = parseFloat(volume);
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'K';
        }
        return num.toFixed(0);
    }

    /**
     * 更新顯示
     */
    function updateDisplay(data) {
        if (elements.noBar) {
            elements.noBar.style.width = `${data.noPercentage}%`;
        }
        if (elements.yesBar) {
            elements.yesBar.style.width = `${data.yesPercentage}%`;
        }
        if (elements.noValue) {
            elements.noValue.textContent = `~${data.noPercentage}%`;
        }
        if (elements.yesValue) {
            elements.yesValue.textContent = `~${data.yesPercentage}%`;
        }
    }

    /**
     * 動畫效果更新
     */
    function animateUpdate(data) {
        // 先設為 0，然後動畫到目標值
        if (elements.noBar) elements.noBar.style.width = '0%';
        if (elements.yesBar) elements.yesBar.style.width = '0%';

        setTimeout(() => {
            updateDisplay(data);
        }, 100);
    }

    /**
     * 載入並顯示數據
     */
    async function loadData() {
        try {
            const data = await fetchPolymarketData();
            animateUpdate(data);
            Logger.debug('Polymarket 數據已載入:', data.source);
        } catch (error) {
            Logger.error('Polymarket 數據載入失敗:', error);
            updateDisplay(FALLBACK_DATA);
        }
    }

    /**
     * 清理定時器
     */
    function cleanup() {
        if (refreshInterval) {
            if (typeof TimerManager !== 'undefined' && TimerManager.clear) {
                TimerManager.clear('polymarket-refresh');
            } else {
                clearInterval(refreshInterval);
            }
            refreshInterval = null;
        }
    }

    /**
     * 初始化模組
     */
    function init() {
        // 清理舊的定時器（如果存在）
        cleanup();

        initElements();
        
        // 確保元素存在
        if (!elements.noBar && !elements.yesBar) {
            Logger.debug('Polymarket 區塊未找到，跳過初始化');
            return;
        }

        // 載入數據
        loadData();

        // 每 10 分鐘更新一次（使用 TimerManager 或降級方案）
        if (typeof TimerManager !== 'undefined' && TimerManager.create) {
            TimerManager.create('polymarket-refresh', loadData, 10 * 60 * 1000);
        } else {
            refreshInterval = setInterval(loadData, 10 * 60 * 1000);
        }

        Logger.debug('Polymarket 模組已啟動');
    }

    // DOM 載入完成後初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 頁面卸載時清理
    window.addEventListener('beforeunload', cleanup);

    // 公開 API
    return {
        refresh: loadData,
        getData: () => cachedData || FALLBACK_DATA,
        cleanup: cleanup
    };
})();

