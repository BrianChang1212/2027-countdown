/**
 * 預測市場數據服務
 * 從 Polymarket 和其他數據源獲取台灣與中國相關的預測市場數據
 */

const PredictionDataService = (function() {
    'use strict';

    // API 端點
    const POLYMARKET_API = 'https://gamma-api.polymarket.com';
    // 多個 CORS 代理選項（按優先順序）
    const CORS_PROXIES = [
        'https://api.allorigins.win/get?url=',
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?quest='
    ];
    
    // 台灣/中國相關關鍵字
    const TAIWAN_KEYWORDS = [
        'taiwan', 'taipei', 'formosa',
        'china invade', 'china attack', 'china military',
        'strait', 'taiwan strait', 'cross-strait',
        'reunification', 'unification', 'one china',
        'tsmc', 'semiconductor', 'chip war'
    ];

    // 快取
    let marketsCache = null;
    let lastFetch = 0;
    const CACHE_DURATION = 10 * 60 * 1000; // 10 分鐘快取

    /**
     * 透過 CORS 代理獲取數據
     */
    async function fetchWithProxy(url, proxyIndex = 0) {
        if (proxyIndex >= CORS_PROXIES.length) {
            Logger.warn('[PredictionDataService] 所有 CORS 代理都失敗了');
            return null;
        }

        const proxy = CORS_PROXIES[proxyIndex];
        
        try {
            let proxyUrl;
            // 不同代理的 URL 格式可能不同
            if (proxy.includes('allorigins.win')) {
                proxyUrl = `${proxy}${encodeURIComponent(url)}`;
            } else if (proxy.includes('codetabs.com')) {
                proxyUrl = `${proxy}${encodeURIComponent(url)}`;
            } else {
                proxyUrl = `${proxy}${encodeURIComponent(url)}`;
            }
            
            // 設置超時（通過 AbortController）
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 秒超時
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                
                // 處理不同代理的響應格式
                if (data.contents) {
                    // allorigins.win 格式
                    try {
                    return JSON.parse(data.contents);
                    } catch (e) {
                        Logger.warn('[PredictionDataService] 解析代理響應失敗:', e);
                    }
                } else if (Array.isArray(data)) {
                    // 直接返回陣列
                    return data;
                } else if (data.data && Array.isArray(data.data)) {
                    // 某些代理可能包裝在 data 欄位中
                    return data.data;
                } else if (data) {
                    // 嘗試直接使用
                    return data;
                }
            }
        } catch (error) {
            // 如果是超時或網絡錯誤，嘗試下一個代理
            if (error.name === 'AbortError' || error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
                Logger.warn(`[PredictionDataService] 代理 ${proxyIndex + 1} 失敗，嘗試下一個...`);
                return await fetchWithProxy(url, proxyIndex + 1);
            }
            // 使用統一的錯誤處理
            if (typeof ErrorHandler !== 'undefined' && ErrorHandler.logError) {
                ErrorHandler.logError(error, `PredictionDataService.fetchWithProxy.${proxyIndex}`);
            } else {
                Logger.error(`[PredictionDataService] CORS 代理 ${proxyIndex + 1} 請求失敗:`, error);
            }
        }
        
        // 嘗試下一個代理
        if (proxyIndex + 1 < CORS_PROXIES.length) {
            return await fetchWithProxy(url, proxyIndex + 1);
        }
        
        return null;
    }

    /**
     * 直接獲取數據（如果沒有 CORS 限制）
     */
    async function fetchDirect(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            // CORS 錯誤，嘗試使用代理
            if (error.name === 'TypeError' || error.message.includes('CORS')) {
                return null;
            }
            Logger.error('[PredictionDataService] 直接請求失敗:', error);
        }
        return null;
    }

    /**
     * 從 Polymarket 獲取市場列表
     */
    async function fetchPolymarketMarkets() {
        // 檢查快取
        if (marketsCache && (Date.now() - lastFetch) < CACHE_DURATION) {
            Logger.debug('[PredictionDataService] 使用快取數據');
            return marketsCache;
        }

        const markets = [];
        
        try {
            Logger.debug('[PredictionDataService] 開始獲取 Polymarket 數據...');
            
            // 嘗試多個 API 端點
            const endpoints = [
                `${POLYMARKET_API}/markets?closed=false&limit=200`,
                `${POLYMARKET_API}/markets?category=geopolitics&closed=false&limit=200`,
                `${POLYMARKET_API}/events?closed=false&limit=200`
            ];

            for (const endpoint of endpoints) {
                Logger.debug(`[PredictionDataService] 嘗試端點: ${endpoint}`);
                
                // 先嘗試直接請求
                let data = await fetchDirect(endpoint);
                
                // 如果失敗，嘗試使用 CORS 代理
                if (!data) {
                    Logger.debug(`[PredictionDataService] 直接請求失敗，嘗試使用 CORS 代理...`);
                    data = await fetchWithProxy(endpoint);
                }

                if (data) {
                    Logger.debug(`[PredictionDataService] 獲取到數據，類型: ${typeof data}, 是否為陣列: ${Array.isArray(data)}`);
                    
                    // 處理不同的數據格式
                    let marketArray = [];
                    if (Array.isArray(data)) {
                        marketArray = data;
                    } else if (data.data && Array.isArray(data.data)) {
                        marketArray = data.data;
                    } else if (data.markets && Array.isArray(data.markets)) {
                        marketArray = data.markets;
                    } else if (data.events && Array.isArray(data.events)) {
                        marketArray = data.events;
                    }

                    if (marketArray.length > 0) {
                        Logger.debug(`[PredictionDataService] 找到 ${marketArray.length} 個市場`);
                        
                        // 過濾台灣/中國相關市場
                        const taiwanMarkets = marketArray.filter(market => {
                            const question = (market.question || market.title || market.name || '').toLowerCase();
                            const description = (market.description || '').toLowerCase();
                            const tags = (market.tags || market.categories || []).map(t => 
                                (typeof t === 'string' ? t : t.name || t.title || '')
                            ).map(t => t.toLowerCase()).join(' ');
                            
                            const matches = TAIWAN_KEYWORDS.some(keyword => 
                                question.includes(keyword) || 
                                description.includes(keyword) ||
                                tags.includes(keyword)
                            );
                            
                            if (matches) {
                                Logger.debug(`[PredictionDataService] 找到台灣相關市場: ${question.substring(0, 50)}...`);
                            }
                            
                            return matches;
                        });

                        Logger.debug(`[PredictionDataService] 過濾後得到 ${taiwanMarkets.length} 個台灣相關市場`);
                        markets.push(...taiwanMarkets);
                    } else {
                        Logger.debug(`[PredictionDataService] 端點返回的數據格式不正確`);
                    }
                } else {
                    Logger.debug(`[PredictionDataService] 端點 ${endpoint} 返回無效數據`);
                }
            }

            // 去重（基於 slug）
            const uniqueMarkets = [];
            const seenSlugs = new Set();
            
            markets.forEach(market => {
                const slug = market.slug || market.id;
                if (slug && !seenSlugs.has(slug)) {
                    seenSlugs.add(slug);
                    uniqueMarkets.push(market);
                }
            });

            Logger.debug(`[PredictionDataService] 去重後得到 ${uniqueMarkets.length} 個唯一市場`);

            if (uniqueMarkets.length > 0) {
                marketsCache = uniqueMarkets;
                lastFetch = Date.now();
                return uniqueMarkets;
            } else {
                Logger.warn('[PredictionDataService] 沒有找到台灣相關的市場');
            }
        } catch (error) {
            Logger.error('[PredictionDataService] 獲取 Polymarket 數據失敗:', error);
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.error(`獲取數據失敗: ${error.message}`, 'PredictionDataService');
            }
        }

        return marketsCache || [];
    }

    /**
     * 解析 Polymarket 市場數據
     */
    function parsePolymarketMarket(market) {
        try {
            // 獲取價格（通常第一個 outcome 是 "Yes"）
            const outcomes = market.outcomes || [];
            const outcomePrices = market.outcomePrices || [];
            
            let yesPrice = 0.5;
            let noPrice = 0.5;
            
            if (outcomePrices.length >= 2) {
                yesPrice = parseFloat(outcomePrices[0]) || 0;
                noPrice = parseFloat(outcomePrices[1]) || 0;
            } else if (outcomePrices.length === 1) {
                yesPrice = parseFloat(outcomePrices[0]) || 0;
                noPrice = 1 - yesPrice;
            }

            // 確保價格總和為 1
            const total = yesPrice + noPrice;
            if (total > 0) {
                yesPrice = yesPrice / total;
                noPrice = noPrice / total;
            }

            // 分類判斷
            const question = (market.question || '').toLowerCase();
            let category = 'politics';
            
            if (question.includes('military') || question.includes('attack') || 
                question.includes('invade') || question.includes('war') ||
                question.includes('conflict') || question.includes('blockade')) {
                category = 'military';
            } else if (question.includes('trade') || question.includes('economy') ||
                       question.includes('economic') || question.includes('tsmc') ||
                       question.includes('semiconductor')) {
                category = 'economy';
            } else if (question.includes('diplomacy') || question.includes('diplomatic') ||
                       question.includes('recognition') || question.includes('alliance')) {
                category = 'diplomacy';
            } else if (question.includes('society') || question.includes('people') ||
                       question.includes('public') || question.includes('support')) {
                category = 'society';
            }

            // 趨勢判斷（基於價格變化，這裡簡化處理）
            let trend = 'stable';
            if (market.priceHistory && market.priceHistory.length >= 2) {
                const recent = market.priceHistory[market.priceHistory.length - 1];
                const previous = market.priceHistory[market.priceHistory.length - 2];
                if (recent > previous * 1.05) trend = 'up';
                else if (recent < previous * 0.95) trend = 'down';
            }

            // 格式化交易量
            const volume = market.volume || market.volume24h || 0;
            const volumeFormatted = formatVolume(volume);

            // 參與者數量
            const participants = market.uniqueTraders || market.participants || 0;

            // 截止日期
            const endDate = market.endDate || market.endDateISO || market.endDate_iso;
            const endDateFormatted = endDate ? formatDate(endDate) : 'N/A';

            return {
                id: market.slug || market.id || `polymarket-${Date.now()}-${Math.random()}`,
                question: market.question || '未知問題',
                category: category,
                yesPercentage: Math.round(yesPrice * 100),
                noPercentage: Math.round(noPrice * 100),
                volume: volumeFormatted,
                participants: participants,
                endDate: endDateFormatted,
                source: 'Polymarket',
                trend: trend,
                lastUpdate: new Date().toISOString().split('T')[0],
                marketUrl: `https://polymarket.com/event/${market.slug || market.id}`,
                rawData: market // 保留原始數據以供參考
            };
        } catch (error) {
            Logger.error('[PredictionDataService] 解析市場數據失敗:', error, market);
            return null;
        }
    }

    /**
     * 格式化交易量
     */
    function formatVolume(volume) {
        const num = parseFloat(volume) || 0;
        if (num >= 1000000) {
            return `$${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `$${(num / 1000).toFixed(0)}K`;
        }
        return `$${num.toFixed(0)}`;
    }

    /**
     * 格式化日期
     */
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch {
            return dateString;
        }
    }

    /**
     * 獲取所有台灣/中國相關的預測市場
     */
    async function getAllMarkets() {
        const markets = [];
        
        Logger.debug('[PredictionDataService] 開始獲取所有市場...');
        
        // 從 Polymarket 獲取
        const polymarketMarkets = await fetchPolymarketMarkets();
        
        Logger.debug(`[PredictionDataService] 從 Polymarket 獲取到 ${polymarketMarkets.length} 個原始市場`);
        
        for (const market of polymarketMarkets) {
            const parsed = parsePolymarketMarket(market);
            if (parsed) {
                markets.push(parsed);
            } else {
                Logger.warn('[PredictionDataService] 解析市場失敗:', market);
            }
        }

        Logger.debug(`[PredictionDataService] 解析後得到 ${markets.length} 個有效市場`);

        // 如果沒有獲取到數據，返回空陣列（讓前端使用備用數據）
        if (markets.length === 0) {
            Logger.warn('[PredictionDataService] 沒有獲取到任何市場數據，將使用備用數據');
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.warning('沒有獲取到實際數據，使用備用數據', 'PredictionDataService');
            }
        } else {
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.success(`成功獲取 ${markets.length} 個實際市場`, 'PredictionDataService');
            }
        }

        return markets;
    }

    /**
     * 清除快取
     */
    function clearCache() {
        marketsCache = null;
        lastFetch = 0;
    }

    /**
     * 強制刷新數據
     */
    async function refresh() {
        clearCache();
        return await getAllMarkets();
    }

    return {
        getAllMarkets,
        refresh,
        clearCache
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.PredictionDataService = PredictionDataService;
}

