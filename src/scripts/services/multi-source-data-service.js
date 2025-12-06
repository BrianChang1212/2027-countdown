/**
 * 多數據源服務
 * 整合多個數據源獲取台灣與中國相關的預測市場和新聞數據
 */

const MultiSourceDataService = (function() {
    'use strict';

    // 數據源配置
    const DATA_SOURCES = {
        // 預測市場
        prediction: {
            polymarket: {
                name: 'Polymarket',
                enabled: true,
                priority: 1
            },
            metaculus: {
                name: 'Metaculus',
                enabled: true,
                priority: 2,
                api: 'https://www.metaculus.com/api2/questions/',
                corsProxy: 'https://api.allorigins.win/get?url='
            },
            // 可以添加更多預測市場
        },
        // 新聞數據
        news: {
            newsapi: {
                name: 'NewsAPI',
                enabled: false, // 需要 API Key
                priority: 1,
                api: 'https://newsapi.org/v2/everything',
                requiresKey: true
            },
            rss: {
                name: 'RSS Feeds',
                enabled: true,
                priority: 2,
                rss2json: 'https://api.rss2json.com/v1/api.json'
            }
        },
        // 經濟數據
        economy: {
            alphaVantage: {
                name: 'Alpha Vantage',
                enabled: false, // 需要 API Key
                priority: 1,
                requiresKey: true
            }
        }
    };

    // 台灣/中國相關關鍵字
    const TAIWAN_KEYWORDS = [
        'taiwan', 'taipei', 'formosa', 'taiwanese',
        'china', 'chinese', 'beijing', 'mainland',
        'china invade', 'china attack', 'china military',
        'strait', 'taiwan strait', 'cross-strait', 'straits',
        'reunification', 'unification', 'one china',
        'tsmc', 'semiconductor', 'chip war', 'chip',
        'taiwan independence', 'taiwanese independence'
    ];

    // 快取
    const cache = {
        prediction: { data: null, timestamp: 0 },
        news: { data: null, timestamp: 0 }
    };
    const CACHE_DURATION = 10 * 60 * 1000; // 10 分鐘

    /**
     * 透過 CORS 代理獲取數據
     */
    async function fetchWithProxy(url, proxy = 'https://api.allorigins.win/get?url=') {
        try {
            const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
            
            // 設置超時
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
                if (data.contents) {
                    try {
                        return JSON.parse(data.contents);
                    } catch (e) {
                        Logger.warn('[MultiSourceDataService] 解析代理響應失敗:', e);
                    }
                } else if (Array.isArray(data)) {
                    return data;
                } else if (data.data && Array.isArray(data.data)) {
                    return data.data;
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                Logger.warn('[MultiSourceDataService] CORS 代理請求超時');
            } else {
                Logger.error('[MultiSourceDataService] CORS 代理請求失敗:', error);
            }
        }
        return null;
    }

    /**
     * 從 Metaculus 獲取預測數據
     */
    async function fetchMetaculusData() {
        try {
            Logger.debug('[MultiSourceDataService] 嘗試從 Metaculus 獲取數據...');
            
            // Metaculus 搜索台灣相關問題
            const searchUrl = `${DATA_SOURCES.prediction.metaculus.api}?search=taiwan&limit=50`;
            
            let data = await fetchWithProxy(searchUrl);
            
            if (data && data.results && Array.isArray(data.results)) {
                const taiwanQuestions = data.results.filter(q => {
                    const title = (q.title || '').toLowerCase();
                    const description = (q.description || '').toLowerCase();
                    return TAIWAN_KEYWORDS.some(keyword => 
                        title.includes(keyword) || description.includes(keyword)
                    );
                });

                Logger.debug(`[MultiSourceDataService] Metaculus: 找到 ${taiwanQuestions.length} 個台灣相關問題`);
                
                return taiwanQuestions.map(q => ({
                    id: `metaculus-${q.id}`,
                    question: q.title,
                    category: categorizeQuestion(q.title),
                    yesPercentage: q.community_prediction ? Math.round(q.community_prediction * 100) : 50,
                    noPercentage: q.community_prediction ? Math.round((1 - q.community_prediction) * 100) : 50,
                    volume: 'N/A',
                    participants: q.number_of_predictions || 0,
                    endDate: q.resolve_time ? new Date(q.resolve_time).toISOString().split('T')[0] : 'N/A',
                    source: 'Metaculus',
                    trend: 'stable',
                    lastUpdate: new Date().toISOString().split('T')[0],
                    marketUrl: `https://www.metaculus.com/questions/${q.id}`,
                    rawData: q
                }));
            }
        } catch (error) {
            Logger.error('[MultiSourceDataService] Metaculus 數據獲取失敗:', error);
        }
        return [];
    }

    /**
     * 從 NewsAPI 獲取新聞（需要 API Key）
     */
    async function fetchNewsAPIData(apiKey) {
        if (!apiKey || !DATA_SOURCES.news.newsapi.enabled) {
            return [];
        }

        try {
            const url = `${DATA_SOURCES.news.newsapi.api}?q=taiwan+china&language=zh&sortBy=publishedAt&apiKey=${apiKey}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                if (data.articles && Array.isArray(data.articles)) {
                    return data.articles.map(article => ({
                        title: article.title,
                        description: article.description,
                        url: article.url,
                        publishedAt: article.publishedAt,
                        source: article.source.name,
                        category: 'news'
                    }));
                }
            }
        } catch (error) {
            Logger.error('[MultiSourceDataService] NewsAPI 數據獲取失敗:', error);
        }
        return [];
    }

    /**
     * 從 RSS 源獲取新聞
     */
    async function fetchRSSData() {
        try {
            const rssSources = [
                'https://www.cna.com.tw/rss/politics.xml',
                'https://www.cna.com.tw/rss/acn.xml',
                'https://feeds.bbci.co.uk/zhongwen/trad/rss.xml'
            ];

            const rss2json = DATA_SOURCES.news.rss.rss2json;
            const allNews = [];

            for (const rssUrl of rssSources) {
                try {
                    const apiUrl = `${rss2json}?rss_url=${encodeURIComponent(rssUrl)}`;
                    const response = await fetch(apiUrl);
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.items && Array.isArray(data.items)) {
                            // 過濾台灣/中國相關新聞
                            const filtered = data.items.filter(item => {
                                const title = (item.title || '').toLowerCase();
                                const description = (item.description || '').toLowerCase();
                                return TAIWAN_KEYWORDS.some(keyword => 
                                    title.includes(keyword) || description.includes(keyword)
                                );
                            });
                            allNews.push(...filtered);
                        }
                    }
                } catch (error) {
                    Logger.error(`[MultiSourceDataService] RSS 源 ${rssUrl} 獲取失敗:`, error);
                }
            }

            return allNews.map(item => ({
                title: item.title,
                description: item.description,
                url: item.link,
                publishedAt: item.pubDate,
                source: item.author || 'RSS',
                category: 'news'
            }));
        } catch (error) {
            Logger.error('[MultiSourceDataService] RSS 數據獲取失敗:', error);
        }
        return [];
    }

    /**
     * 分類問題
     */
    function categorizeQuestion(question) {
        const q = question.toLowerCase();
        if (q.includes('military') || q.includes('attack') || q.includes('invade') || q.includes('war')) {
            return 'military';
        } else if (q.includes('trade') || q.includes('economy') || q.includes('tsmc')) {
            return 'economy';
        } else if (q.includes('diplomacy') || q.includes('recognition')) {
            return 'diplomacy';
        } else if (q.includes('society') || q.includes('people')) {
            return 'society';
        }
        return 'politics';
    }

    /**
     * 合併多個數據源的預測市場數據
     */
    async function getAllPredictionMarkets() {
        // 檢查快取
        if (cache.prediction.data && (Date.now() - cache.prediction.timestamp) < CACHE_DURATION) {
            return cache.prediction.data;
        }

        const allMarkets = [];

        // 從 Polymarket 獲取（使用現有的 PredictionDataService）
        if (typeof PredictionDataService !== 'undefined') {
            try {
                const polymarketMarkets = await PredictionDataService.getAllMarkets();
                if (polymarketMarkets && polymarketMarkets.length > 0) {
                    allMarkets.push(...polymarketMarkets);
                    Logger.debug(`[MultiSourceDataService] Polymarket: ${polymarketMarkets.length} 個市場`);
                }
            } catch (error) {
                Logger.error('[MultiSourceDataService] Polymarket 獲取失敗:', error);
            }
        }

        // 從 Metaculus 獲取
        if (DATA_SOURCES.prediction.metaculus.enabled) {
            try {
                const metaculusMarkets = await fetchMetaculusData();
                if (metaculusMarkets && metaculusMarkets.length > 0) {
                    allMarkets.push(...metaculusMarkets);
                    Logger.debug(`[MultiSourceDataService] Metaculus: ${metaculusMarkets.length} 個市場`);
                }
            } catch (error) {
                Logger.error('[MultiSourceDataService] Metaculus 獲取失敗:', error);
            }
        }

        // 去重（基於問題）
        const uniqueMarkets = [];
        const seen = new Set();
        
        allMarkets.forEach(market => {
            const key = market.question.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                uniqueMarkets.push(market);
            }
        });

        Logger.debug(`[MultiSourceDataService] 合併後共 ${uniqueMarkets.length} 個唯一市場`);

        // 更新快取
        cache.prediction.data = uniqueMarkets;
        cache.prediction.timestamp = Date.now();

        return uniqueMarkets;
    }

    /**
     * 獲取所有新聞數據
     */
    async function getAllNews(apiKey = null) {
        // 檢查快取
        if (cache.news.data && (Date.now() - cache.news.timestamp) < CACHE_DURATION) {
            return cache.news.data;
        }

        const allNews = [];

        // 從 RSS 獲取
        if (DATA_SOURCES.news.rss.enabled) {
            try {
                const rssNews = await fetchRSSData();
                if (rssNews && rssNews.length > 0) {
                    allNews.push(...rssNews);
                    Logger.debug(`[MultiSourceDataService] RSS: ${rssNews.length} 條新聞`);
                }
            } catch (error) {
                Logger.error('[MultiSourceDataService] RSS 獲取失敗:', error);
            }
        }

        // 從 NewsAPI 獲取（如果有 API Key）
        if (apiKey && DATA_SOURCES.news.newsapi.enabled) {
            try {
                const newsapiNews = await fetchNewsAPIData(apiKey);
                if (newsapiNews && newsapiNews.length > 0) {
                    allNews.push(...newsapiNews);
                    Logger.debug(`[MultiSourceDataService] NewsAPI: ${newsapiNews.length} 條新聞`);
                }
            } catch (error) {
                Logger.error('[MultiSourceDataService] NewsAPI 獲取失敗:', error);
            }
        }

        // 去重（基於標題）
        const uniqueNews = [];
        const seen = new Set();
        
        allNews.forEach(news => {
            const key = news.title.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                uniqueNews.push(news);
            }
        });

        // 按時間排序
        uniqueNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        // 更新快取
        cache.news.data = uniqueNews;
        cache.news.timestamp = Date.now();

        return uniqueNews;
    }

    /**
     * 清除快取
     */
    function clearCache(type = null) {
        if (type === 'prediction' || type === null) {
            cache.prediction.data = null;
            cache.prediction.timestamp = 0;
        }
        if (type === 'news' || type === null) {
            cache.news.data = null;
            cache.news.timestamp = 0;
        }
    }

    /**
     * 刷新數據
     */
    async function refresh(type = 'all', apiKey = null) {
        clearCache(type);
        
        if (type === 'prediction' || type === 'all') {
            return await getAllPredictionMarkets();
        } else if (type === 'news' || type === 'all') {
            return await getAllNews(apiKey);
        }
        return [];
    }

    /**
     * 獲取數據源狀態
     */
    function getSourceStatus() {
        return {
            prediction: {
                polymarket: DATA_SOURCES.prediction.polymarket.enabled,
                metaculus: DATA_SOURCES.prediction.metaculus.enabled
            },
            news: {
                rss: DATA_SOURCES.news.rss.enabled,
                newsapi: DATA_SOURCES.news.newsapi.enabled && DATA_SOURCES.news.newsapi.requiresKey
            }
        };
    }

    return {
        getAllPredictionMarkets,
        getAllNews,
        refresh,
        clearCache,
        getSourceStatus
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.MultiSourceDataService = MultiSourceDataService;
}

