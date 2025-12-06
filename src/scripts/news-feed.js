/**
 * 新聞動態牆模組
 * 抓取國際與台灣政治新聞
 */

const NewsModule = (function() {
    'use strict';

    // 使用配置服務（已拆分到 news-sources-config.js）
    // 使用 RSSParserService、NewsFilterService、NewsUtils（已拆分到對應服務模組）

    // 當前分類
    let currentCategory = 'taiwan';
    
    // 快取新聞資料（分為首頁和視圖兩個獨立的快取）
    let newsCache = {};  // 首頁新聞快取
    let viewNewsCache = {};  // 新聞視圖快取（獨立執行）
    
    // 正在進行的請求追蹤（避免重複請求）
    const activeRequests = {
        home: new Map(),  // 首頁請求
        view: new Map()   // 視圖請求
    };

    // DOM 元素
    const elements = {
        grid: null,
        loading: null,
        error: null,
        tabs: null,
        refreshBtn: null,
        ticker: null
    };
    
    // 跑馬燈新聞資料
    let tickerNews = [];

    /**
     * 初始化 DOM 元素參考
     */
    function initElements() {
        // 查找首頁的新聞元素（確保只查找首頁的，不是視圖的）
        const newsContainer = document.querySelector('.news-container');
        if (newsContainer) {
            elements.grid = newsContainer.querySelector('#news-grid') || document.getElementById('news-grid');
            elements.loading = newsContainer.querySelector('.news-loading');
            elements.error = newsContainer.querySelector('#news-error') || document.getElementById('news-error');
        } else {
            // 備用方案：直接查找（如果找不到容器）
            elements.grid = document.getElementById('news-grid');
            elements.loading = document.querySelector('.news-container .news-loading') || document.querySelector('.news-loading');
            elements.error = document.getElementById('news-error');
        }
        
        // 查找首頁的新聞標籤（只查找首頁的，不是視圖的）
        const homeNewsSection = document.querySelector('.news-section');
        if (homeNewsSection) {
            elements.tabs = homeNewsSection.querySelectorAll('.news-tab');
        } else {
            elements.tabs = document.querySelectorAll('.news-tab');
        }
        
        elements.refreshBtn = document.getElementById('refresh-news');
        elements.ticker = document.getElementById('news-ticker');
        
        // 調試資訊
        Logger.debug('[NewsModule] 元素初始化:', {
            grid: !!elements.grid,
            loading: !!elements.loading,
            error: !!elements.error,
            tabs: elements.tabs?.length || 0,
            refreshBtn: !!elements.refreshBtn,
            ticker: !!elements.ticker
        });
    }

    // 以下函數已拆分到服務模組：
    // - isRelatedToTaiwanChina, fetchRSS, stripHtml → RSSParserService, NewsFilterService
    // - formatDate, getCategoryLabel, createNewsCard → NewsUtils

    /**
     * 顯示載入狀態
     */
    function showLoading() {
        if (elements.loading) elements.loading.style.display = 'flex';
        if (elements.grid) elements.grid.style.display = 'none';
        if (elements.error) elements.error.style.display = 'none';
    }

    /**
     * 顯示錯誤狀態
     */
    function showError() {
        if (elements.loading) elements.loading.style.display = 'none';
        if (elements.grid) elements.grid.style.display = 'none';
        if (elements.error) elements.error.style.display = 'flex';
    }

    /**
     * 顯示新聞內容
     * @param {Array} newsItems - 新聞項目陣列
     */
    function showNews(newsItems) {
        Logger.debug('[NewsModule] showNews 被調用，新聞數量:', newsItems?.length || 0);
        Logger.debug('[NewsModule] 元素狀態:', {
            loading: !!elements.loading,
            error: !!elements.error,
            grid: !!elements.grid
        });

        if (!newsItems || newsItems.length === 0) {
            Logger.warn('[NewsModule] 沒有新聞可顯示');
            showError();
            return;
        }

        if (elements.loading) {
            elements.loading.style.display = 'none';
        }
        if (elements.error) {
            elements.error.style.display = 'none';
        }
        if (elements.grid) {
            elements.grid.style.display = 'grid';
            // 使用 NewsUtils 服務創建新聞卡片
            const createCard = typeof NewsUtils !== 'undefined' && NewsUtils.createNewsCard 
                ? NewsUtils.createNewsCard 
                : (news, category) => `<div>${news.title}</div>`; // 降級方案
            
            const newsHTML = newsItems
                .slice(0, 6) // 最多顯示 6 則
                .map(news => createCard(news, currentCategory))
                .join('');
            // 使用安全的 HTML 設置（新聞卡片是內部生成的，相對安全，使用寬鬆清理）
            if (typeof DOMUtils !== 'undefined') {
                // 對於內部生成的 HTML，使用較寬鬆的清理策略
                DOMUtils.safeSetHTML(elements.grid, newsHTML, { sanitize: false });
                // 調試：檢查設置後的 HTML
                if (elements.grid.innerHTML.length === 0 && newsHTML.length > 0) {
                    Logger.error('[NewsModule] 警告：設置 HTML 後內容為空！原始長度:', newsHTML.length);
                    Logger.error('[NewsModule] 前 500 字元:', newsHTML.substring(0, 500));
                }
            } else {
                // 真正的降級方案：使用 textContent 或 createElement 來避免 XSS
                // 清空現有內容
                while (elements.grid.firstChild) {
                    elements.grid.removeChild(elements.grid.firstChild);
                }
                // 使用 DOMParser 解析 HTML（相對安全）
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(newsHTML, 'text/html');
                    const fragment = document.createDocumentFragment();
                    Array.from(doc.body.childNodes).forEach(node => {
                        fragment.appendChild(node.cloneNode(true));
                    });
                    elements.grid.appendChild(fragment);
                } catch (e) {
                    Logger.error('[NewsModule] HTML 解析失敗，使用 textContent:', e);
                    elements.grid.textContent = '新聞載入中...';
                }
            }
            Logger.debug('[NewsModule] 新聞已顯示到 DOM，HTML 長度:', newsHTML.length, '設置後長度:', elements.grid.innerHTML.length);
        } else {
            Logger.error('[NewsModule] 找不到 news-grid 元素！');
            // 嘗試重新初始化元素
            initElements();
            if (elements.grid) {
                elements.grid.style.display = 'grid';
                // 使用 NewsUtils 服務創建新聞卡片
                const createCard = typeof NewsUtils !== 'undefined' && NewsUtils.createNewsCard 
                    ? NewsUtils.createNewsCard 
                    : (news, category) => `<div>${news.title}</div>`; // 降級方案
                
                const fallbackHTML = newsItems
                    .slice(0, 6)
                    .map(news => createCard(news, currentCategory))
                    .join('');
                // 使用安全的 HTML 設置（新聞卡片是內部生成的，相對安全）
                if (typeof DOMUtils !== 'undefined') {
                    DOMUtils.safeSetHTML(elements.grid, fallbackHTML, { sanitize: false });
                } else {
                    // 真正的降級方案：使用 DOMParser
                    try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(fallbackHTML, 'text/html');
                        const fragment = document.createDocumentFragment();
                        Array.from(doc.body.childNodes).forEach(node => {
                            fragment.appendChild(node.cloneNode(true));
                        });
                        elements.grid.appendChild(fragment);
                    } catch (e) {
                        Logger.error('[NewsModule] HTML 解析失敗:', e);
                        elements.grid.textContent = '新聞載入中...';
                    }
                }
                Logger.debug('[NewsModule] 重新初始化後成功顯示新聞');
            } else {
                Logger.error('[NewsModule] 重新初始化後仍找不到 news-grid 元素！');
            }
        }
    }

    /**
     * 載入指定分類的新聞（首頁專用）
     * 使用獨立的快取和執行上下文，與新聞視圖並行執行
     * @param {string} category - 分類代碼
     * @param {boolean} forceRefresh - 是否強制重新載入
     */
    async function loadNews(category, forceRefresh = false) {
        Logger.debug(`[NewsModule] loadNews 被調用: category=${category}, forceRefresh=${forceRefresh}, currentCategory=${currentCategory}`);
        
        currentCategory = category;
        
        // 檢查首頁專用快取
        if (!forceRefresh && newsCache[category] && newsCache[category].length > 0) {
            Logger.debug(`[NewsModule] 使用快取數據，分類: ${category}, 數量: ${newsCache[category].length}`);
            showNews(newsCache[category]);
            return;
        }
        
        Logger.debug(`[NewsModule] 需要載入新數據，分類: ${category}`);

        // 檢查是否有正在進行的請求（避免重複請求）
        const requestKey = `home-${category}`;
        if (activeRequests.home.has(requestKey)) {
            Logger.debug(`[NewsModule] 首頁請求 ${category} 正在進行中，等待完成...`);
            try {
                const result = await activeRequests.home.get(requestKey);
                if (result && result.length > 0) {
                    showNews(result);
                } else {
                    // 如果請求返回空結果，使用備用資料
                    const fallback = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getFallbackNews)
                        ? NewsSourcesConfig.getFallbackNews(category)
                        : [];
                    if (fallback.length > 0) {
                        newsCache[category] = fallback;
                        showNews(fallback);
                    } else {
                        showError();
                    }
                }
            } catch (error) {
                // 使用統一的錯誤處理
                if (typeof ErrorHandler !== 'undefined' && ErrorHandler.logError) {
                    ErrorHandler.logError(error, 'NewsModule.waitHomeRequest');
                } else {
                    Logger.error('[NewsModule] 等待首頁請求時發生錯誤:', error);
                }
                // 使用備用資料
                const fallback = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getFallbackNews)
                    ? NewsSourcesConfig.getFallbackNews(category)
                    : [];
                if (fallback.length > 0) {
                    newsCache[category] = fallback;
                    showNews(fallback);
                } else {
                    showError();
                }
            }
            return;
        }

        showLoading();

        // 創建新的請求 Promise（獨立執行，不阻塞視圖請求）
        const requestPromise = (async () => {
            try {
                // 使用配置服務獲取來源
                const sources = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getSources)
                    ? NewsSourcesConfig.getSources(category)
                    : [];
                let allNews = [];

                // 使用 RSSParserService 獲取新聞
                if (typeof RSSParserService !== 'undefined' && RSSParserService.fetchRSS) {
                    // 嘗試從所有來源取得新聞（1秒超時，快速載入）
                    // 使用 Promise.allSettled 確保並行執行，不阻塞視圖新聞載入
                    const promises = sources.map(source => 
                        RSSParserService.fetchRSS(source.url, 1000, source.filterKeywords !== false)
                    );
                    const results = await Promise.allSettled(promises);
                    
                    results.forEach((result, index) => {
                        if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
                            // 標記來源名稱
                            const newsWithSource = result.value.map(news => ({
                                ...news,
                                sourceName: sources[index].name
                            }));
                            allNews = allNews.concat(newsWithSource);
                        }
                        // 靜默跳過失敗或超時的來源，不輸出警告以提升載入速度
                    });
                }

                // 如果沒有取得任何新聞，使用備用資料
                if (allNews.length === 0) {
                    Logger.debug('[NewsModule] 首頁使用備用新聞資料');
                    allNews = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getFallbackNews)
                        ? NewsSourcesConfig.getFallbackNews(category)
                        : [];
                }

                // 使用 NewsFilterService 進行去重和排序
                if (typeof NewsFilterService !== 'undefined') {
                    allNews = NewsFilterService.deduplicateNews(allNews);
                    allNews = NewsFilterService.sortByDate(allNews);
                } else {
                    // 降級方案：手動去重和排序
                    const uniqueNews = [];
                    const seenTitles = new Set();
                    allNews.forEach(news => {
                        const titleKey = news.title.toLowerCase().trim();
                        if (!seenTitles.has(titleKey)) {
                            seenTitles.add(titleKey);
                            uniqueNews.push(news);
                        }
                    });
                    allNews = uniqueNews.sort((a, b) => {
                        const dateA = new Date(a.pubDate || 0);
                        const dateB = new Date(b.pubDate || 0);
                        return dateB - dateA;
                    });
                }

                // 快取結果到首頁專用快取（不影響視圖快取）
                newsCache[category] = allNews;

                return allNews;
            } catch (error) {
                // 使用統一的錯誤處理
                if (typeof ErrorHandler !== 'undefined' && ErrorHandler.logError) {
                    ErrorHandler.logError(error, 'NewsModule.loadHomeNews');
                } else {
                    Logger.error('[NewsModule] 首頁載入新聞失敗:', error);
                }
                // 使用備用資料
                const fallback = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getFallbackNews)
                    ? NewsSourcesConfig.getFallbackNews(category)
                    : [];
                newsCache[category] = fallback;
                return fallback;
            } finally {
                // 清除請求追蹤
                activeRequests.home.delete(requestKey);
            }
        })();

        // 記錄正在進行的請求
        activeRequests.home.set(requestKey, requestPromise);

        try {
            const uniqueNews = await requestPromise;

            // 確保至少有備用資料顯示
            if (uniqueNews && uniqueNews.length > 0) {
                showNews(uniqueNews);
                Logger.debug(`[NewsModule] 首頁成功載入 ${uniqueNews.length} 則新聞 (分類: ${category})`);
            } else {
                // 如果還是沒有資料，使用備用資料
                const fallback = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getFallbackNews)
                    ? NewsSourcesConfig.getFallbackNews(category)
                    : [];
                if (fallback.length > 0) {
                    newsCache[category] = fallback;
                    showNews(fallback);
                    Logger.debug(`[NewsModule] 首頁使用備用新聞資料 (分類: ${category})`);
                } else {
                    Logger.warn(`[NewsModule] 首頁分類 ${category} 沒有找到相關新聞`);
                    showError();
                }
            }
        } catch (error) {
            // 使用統一的錯誤處理
            if (typeof ErrorHandler !== 'undefined' && ErrorHandler.logError) {
                ErrorHandler.logError(error, 'NewsModule.loadNews');
            } else {
                Logger.error('[NewsModule] 首頁載入新聞異常:', error);
            }
            // 使用備用資料
            const fallback = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getFallbackNews)
                ? NewsSourcesConfig.getFallbackNews(category)
                : [];
            if (fallback.length > 0) {
                newsCache[category] = fallback;
                showNews(fallback);
            } else {
                showError();
            }
        }
    }

    /**
     * 處理分類標籤點擊
     * @param {Event} e - 點擊事件
     */
    function handleTabClick(e) {
        // 使用 currentTarget 獲取綁定事件的元素（標籤本身）
        const tab = e.currentTarget;
        
        if (!tab) {
            Logger.warn('[NewsModule] handleTabClick: 無法找到標籤元素');
            return;
        }

        const category = tab.dataset.category;
        if (!category) {
            Logger.warn('[NewsModule] handleTabClick: 標籤缺少 data-category 屬性', tab);
            return;
        }
        
        Logger.debug(`[NewsModule] handleTabClick: 點擊標籤，分類=${category}, 當前分類=${currentCategory}`);
        
        if (category === currentCategory) {
            Logger.debug(`[NewsModule] handleTabClick: 分類 ${category} 已經是當前分類，跳過`);
            return;
        }

        Logger.debug(`[NewsModule] handleTabClick: 開始切換到分類 ${category}`);

        // 更新標籤狀態（只更新首頁的標籤）
        const homeNewsSection = document.querySelector('.news-section');
        if (homeNewsSection) {
            const homeTabs = homeNewsSection.querySelectorAll('.news-tab');
            Logger.debug(`[NewsModule] handleTabClick: 找到 ${homeTabs.length} 個首頁標籤`);
            
            homeTabs.forEach(t => {
                t.classList.remove('active');
            });
            
            const targetTab = Array.from(homeTabs).find(t => t.dataset.category === category);
            if (targetTab) {
                targetTab.classList.add('active');
                Logger.debug(`[NewsModule] handleTabClick: 標籤 ${category} 已設為 active`);
            } else {
                Logger.warn(`[NewsModule] handleTabClick: 找不到分類為 ${category} 的標籤`);
            }
        } else {
            Logger.warn('[NewsModule] handleTabClick: 找不到 .news-section 容器');
        }

        // 載入新聞
        Logger.debug(`[NewsModule] handleTabClick: 調用 loadNews(${category})`);
        loadNews(category).catch(error => {
            Logger.error('[NewsModule] handleTabClick: loadNews 失敗:', error);
            // 使用統一的錯誤處理
            if (typeof ErrorHandler !== 'undefined' && ErrorHandler.logError) {
                ErrorHandler.logError(error, `NewsModule.handleTabClick.${category}`);
            }
        });
    }

    /**
     * 重新載入新聞
     */
    function retry() {
        loadNews(currentCategory, true);
    }

    /**
     * 載入跑馬燈新聞
     * 從所有分類中獲取新聞並合併
     */
    async function loadTickerNews() {
        const allNews = [];
        
        try {
            // 從各分類獲取新聞
            const getAllCategories = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getAllCategories)
                ? NewsSourcesConfig.getAllCategories()
                : ['taiwan', 'international', 'cross-strait'];
            
            for (const category of getAllCategories) {
                const sources = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getSources)
                    ? NewsSourcesConfig.getSources(category)
                    : [];
                
                // 使用 RSSParserService 並行載入所有來源（1秒超時）
                if (typeof RSSParserService !== 'undefined' && RSSParserService.fetchRSS) {
                    const promises = sources.map(source => 
                        RSSParserService.fetchRSS(source.url, 1000, source.filterKeywords !== false)
                    );
                    const results = await Promise.allSettled(promises);
                    
                    results.forEach((result, index) => {
                        if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
                            // 取前 2 則新聞（減少跑馬燈新聞數量）
                            const getCategoryLabelFn = (typeof NewsUtils !== 'undefined' && NewsUtils.getCategoryLabel)
                                ? NewsUtils.getCategoryLabel
                                : (cat) => cat; // 降級方案
                            
                            result.value.slice(0, 2).forEach(item => {
                                allNews.push({
                                    ...item,
                                    category: getCategoryLabelFn(category),
                                    sourceName: sources[index].name
                                });
                            });
                        }
                    });
                }
            }
            
            // 如果沒有取得任何新聞，使用備用資料
            if (allNews.length === 0) {
                const getCategoryLabelFn = (typeof NewsUtils !== 'undefined' && NewsUtils.getCategoryLabel)
                    ? NewsUtils.getCategoryLabel
                    : (cat) => cat; // 降級方案
                
                const getAllCategories = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getAllCategories)
                    ? NewsSourcesConfig.getAllCategories()
                    : ['taiwan', 'international', 'cross-strait'];
                
                getAllCategories.forEach(cat => {
                    const fallback = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getFallbackNews)
                        ? NewsSourcesConfig.getFallbackNews(cat)
                        : [];
                    fallback.slice(0, 2).forEach(item => {
                        allNews.push({
                            ...item,
                            category: getCategoryLabelFn(cat)
                        });
                    });
                });
            }
            
            // 使用 NewsFilterService 進行去重和排序
            let uniqueTickerNews = allNews;
            if (typeof NewsFilterService !== 'undefined') {
                uniqueTickerNews = NewsFilterService.deduplicateNews(allNews);
                uniqueTickerNews = NewsFilterService.sortByDate(uniqueTickerNews);
            } else {
                // 降級方案：手動去重和排序
                const unique = [];
                const seenTitles = new Set();
                allNews.forEach(news => {
                    const titleKey = news.title.toLowerCase().trim();
                    if (!seenTitles.has(titleKey)) {
                        seenTitles.add(titleKey);
                        unique.push(news);
                    }
                });
                uniqueTickerNews = unique.sort((a, b) => {
                    const dateA = new Date(a.pubDate || 0);
                    const dateB = new Date(b.pubDate || 0);
                    return dateB - dateA;
                });
            }
            
            tickerNews = uniqueTickerNews.slice(0, 20); // 最多 20 則（增加跑馬燈內容）
            
            Logger.debug(`[NewsModule] 跑馬燈載入 ${tickerNews.length} 則新聞`);
            updateTicker();
        } catch (error) {
            Logger.error('跑馬燈載入失敗:', error);
            // 使用備用資料
            const getCategoryLabelFn = (typeof NewsUtils !== 'undefined' && NewsUtils.getCategoryLabel)
                ? NewsUtils.getCategoryLabel
                : (cat) => cat; // 降級方案
            
            const getAllCategories = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getAllCategories)
                ? NewsSourcesConfig.getAllCategories()
                : ['taiwan', 'international', 'cross-strait'];
            
            getAllCategories.forEach(cat => {
                const fallback = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getFallbackNews)
                    ? NewsSourcesConfig.getFallbackNews(cat)
                    : [];
                fallback.forEach(item => {
                    tickerNews.push({
                        ...item,
                        category: getCategoryLabelFn(cat)
                    });
                });
            });
            updateTicker();
        }
    }

    /**
     * 更新跑馬燈顯示
     */
    function updateTicker() {
        if (!elements.ticker || tickerNews.length === 0) return;
        
        // 建立跑馬燈內容 (複製一份以實現無縫循環)
        const tickerContent = tickerNews.map(news => {
            const title = news.title.length > 50 
                ? news.title.substring(0, 50) + '...' 
                : news.title;
            return `<span class="ticker-item"><span class="ticker-source">[${news.category}]</span>${title}</span>`;
        }).join('<span class="ticker-separator">|</span>');
        
        // 複製內容以實現無縫滾動
        const fullTickerContent = tickerContent + 
            '<span class="ticker-separator">|</span>' + 
            tickerContent;
        // 使用安全的 HTML 設置（跑馬燈內容是內部生成的）
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.safeSetHTML(elements.ticker, fullTickerContent, { sanitize: false });
        } else {
            // 真正的降級方案：使用 DOMParser
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(fullTickerContent, 'text/html');
                elements.ticker.textContent = ''; // 清空
                Array.from(doc.body.childNodes).forEach(node => {
                    elements.ticker.appendChild(node.cloneNode(true));
                });
            } catch (e) {
                Logger.error('[NewsModule] 跑馬燈 HTML 解析失敗:', e);
                elements.ticker.textContent = '載入中...';
            }
        }
        
        // 根據內容長度調整動畫速度
        const contentLength = tickerNews.length;
        const duration = Math.max(30, contentLength * 8); // 最少 30 秒
        elements.ticker.style.animationDuration = `${duration}s`;
    }

    /**
     * 綁定事件
     */
    function bindEvents() {
        // 重新初始化標籤元素（確保獲取最新的元素）
        const homeNewsSection = document.querySelector('.news-section');
        if (!homeNewsSection) {
            Logger.warn('[NewsModule] 找不到 .news-section 容器');
            // 延遲重試
            setTimeout(() => {
                bindEvents();
            }, 500);
            return;
        }

        // 獲取標籤元素
        elements.tabs = homeNewsSection.querySelectorAll('.news-tab');

        if (!elements.tabs || elements.tabs.length === 0) {
            Logger.warn('[NewsModule] 找不到新聞標籤元素，無法綁定事件');
            // 延遲重試
            setTimeout(() => {
                bindEvents();
            }, 500);
            return;
        }

        Logger.debug(`[NewsModule] 找到 ${elements.tabs.length} 個標籤，開始綁定事件`);

        // 直接綁定到每個標籤（不使用事件委派，避免問題）
        // 先克隆所有標籤以移除舊的事件監聽器
        const tabsArray = Array.from(elements.tabs);
        tabsArray.forEach((tab, index) => {
            const category = tab.dataset.category;
            Logger.debug(`[NewsModule] 準備綁定標籤 ${index}: category=${category}`);
            
            // 克隆節點以移除舊的事件監聽器
            const newTab = tab.cloneNode(true);
            tab.parentNode?.replaceChild(newTab, tab);
        });
        
        // 重新獲取標籤並綁定事件
        const updatedTabs = homeNewsSection.querySelectorAll('.news-tab');
        Logger.debug(`[NewsModule] 重新獲取到 ${updatedTabs.length} 個標籤`);
        
        updatedTabs.forEach((tab, index) => {
            const category = tab.dataset.category;
            if (!category) {
                Logger.warn(`[NewsModule] 標籤 ${index} 缺少 data-category 屬性`);
                return;
            }
            
            // 綁定點擊事件
            tab.addEventListener('click', function(e) {
                Logger.debug(`[NewsModule] 標籤被點擊: ${category}`);
                e.preventDefault();
                e.stopPropagation();
                handleTabClick(e);
            }, { capture: false, once: false });
            
            Logger.debug(`[NewsModule] ✓ 已為標籤 "${category}" 綁定點擊事件`);
        });

        // 更新 elements.tabs 引用
        elements.tabs = updatedTabs;
        Logger.debug(`[NewsModule] 事件綁定完成，共 ${elements.tabs.length} 個標籤`);

        // 重新整理按鈕
        if (elements.refreshBtn) {
            // 移除舊的事件監聽器
            const newBtn = elements.refreshBtn.cloneNode(true);
            elements.refreshBtn.parentNode?.replaceChild(newBtn, elements.refreshBtn);
            elements.refreshBtn = document.getElementById('refresh-news');
            
            if (elements.refreshBtn) {
                elements.refreshBtn.addEventListener('click', () => retry());
            }
        }
    }

    /**
     * 初始化模組
     */
    function init() {
        initElements();
        bindEvents();
        
        // 載入預設分類新聞
        loadNews('taiwan');
        
        // 載入跑馬燈新聞
        loadTickerNews();

        // 每 5 分鐘自動刷新（使用 ResourceManager）
        if (typeof ResourceManager !== 'undefined') {
            ResourceManager.createInterval('news-auto-refresh', () => {
                loadNews(currentCategory, true);
                loadTickerNews();
            }, 5 * 60 * 1000);
        } else {
            // 降級：直接使用 setInterval（不推薦）
            setInterval(() => {
                loadNews(currentCategory, true);
                loadTickerNews();
            }, 5 * 60 * 1000);
        }

        // 監聽語言變更事件（使用 ResourceManager）
        const languageChangeHandler = () => {
            // 重新渲染當前分類的新聞以更新翻譯
            if (newsCache[currentCategory]) {
                showNews(newsCache[currentCategory]);
            }
            // 重新更新跑馬燈
            updateTicker();
        };
        
        if (typeof ResourceManager !== 'undefined') {
            ResourceManager.addEventListener('news-language-change', window, 'languageChanged', languageChangeHandler);
        } else {
            window.addEventListener('languageChanged', languageChangeHandler);
        }

        if (typeof Logger !== 'undefined') {
            Logger.info('新聞模組已啟動', 'NewsModule');
            Logger.info('跑馬燈已啟動', 'NewsModule');
        } else {
            Logger.debug('新聞模組已啟動');
            Logger.debug('跑馬燈已啟動');
        }
    }

    /**
     * 獲取指定分類的新聞數據（不顯示，僅返回數據）
     * 使用獨立的快取和執行上下文，與首頁新聞並行執行
     * @param {string} category - 分類代碼
     * @param {boolean} forceRefresh - 是否強制重新載入
     * @returns {Promise<Array>} 新聞項目陣列
     */
    async function getNewsData(category, forceRefresh = false) {
        // 檢查視圖專用快取（獨立於首頁快取）
        if (!forceRefresh && viewNewsCache[category] && viewNewsCache[category].length > 0) {
            return viewNewsCache[category];
        }

        // 檢查是否有正在進行的請求（避免重複請求）
        const requestKey = category;
        if (activeRequests.view.has(requestKey)) {
            Logger.debug(`[NewsModule] 視圖請求 ${category} 正在進行中，等待完成...`);
            return await activeRequests.view.get(requestKey);
        }

        // 創建新的請求 Promise
        const requestPromise = (async () => {
            try {
                // 使用配置服務獲取來源
                const sources = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getSources)
                    ? NewsSourcesConfig.getSources(category)
                    : [];
                let allNews = [];

                // 使用 RSSParserService 獲取新聞
                if (typeof RSSParserService !== 'undefined' && RSSParserService.fetchRSS) {
                    // 嘗試從所有來源取得新聞（1秒超時，快速載入）
                    // 使用 Promise.allSettled 確保並行執行，不阻塞首頁新聞載入
                    const promises = sources.map(source => 
                        RSSParserService.fetchRSS(source.url, 1000, source.filterKeywords !== false)
                    );
                    const results = await Promise.allSettled(promises);
                    
                    results.forEach((result, index) => {
                        if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
                            // 標記來源名稱
                            const newsWithSource = result.value.map(news => ({
                                ...news,
                                sourceName: sources[index].name
                            }));
                            allNews = allNews.concat(newsWithSource);
                        }
                    });
                }

                // 如果沒有取得任何新聞，使用備用資料
                if (allNews.length === 0) {
                    allNews = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getFallbackNews)
                        ? NewsSourcesConfig.getFallbackNews(category)
                        : [];
                }

                // 使用 NewsFilterService 進行去重和排序
                let uniqueNews = allNews;
                if (typeof NewsFilterService !== 'undefined') {
                    uniqueNews = NewsFilterService.deduplicateNews(allNews);
                    uniqueNews = NewsFilterService.sortByDate(uniqueNews);
                } else {
                    // 降級方案：手動去重和排序
                    const unique = [];
                    const seenTitles = new Set();
                    allNews.forEach(news => {
                        const titleKey = news.title.toLowerCase().trim();
                        if (!seenTitles.has(titleKey)) {
                            seenTitles.add(titleKey);
                            unique.push(news);
                        }
                    });
                    uniqueNews = unique.sort((a, b) => {
                        const dateA = new Date(a.pubDate || 0);
                        const dateB = new Date(b.pubDate || 0);
                        return dateB - dateA;
                    });
                }

                // 快取結果到視圖專用快取（不影響首頁快取）
                viewNewsCache[category] = uniqueNews;

                return uniqueNews;
                } catch (error) {
                // 使用統一的錯誤處理
                if (typeof ErrorHandler !== 'undefined' && ErrorHandler.logError) {
                    ErrorHandler.logError(error, 'NewsModule.getNewsData');
                } else {
                    Logger.error('[NewsModule] 視圖獲取新聞數據失敗:', error);
                }
                // 使用備用資料
                const fallback = (typeof NewsSourcesConfig !== 'undefined' && NewsSourcesConfig.getFallbackNews)
                    ? NewsSourcesConfig.getFallbackNews(category)
                    : [];
                viewNewsCache[category] = fallback;
                return fallback;
            } finally {
                // 清除請求追蹤
                activeRequests.view.delete(requestKey);
            }
        })();

        // 記錄正在進行的請求
        activeRequests.view.set(requestKey, requestPromise);

        return await requestPromise;
    }

    /**
     * 清理資源
     */
    function cleanup() {
        if (typeof ResourceManager !== 'undefined') {
            ResourceManager.clearInterval('news-auto-refresh');
            ResourceManager.removeEventListener('news-language-change');
        }
    }

    // 公開 API
    const publicAPI = {
        retry,
        loadNews,
        refresh: () => retry(),
        getNewsData,
        cleanup
    };

    // 當 DOM 載入完成後初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM 已經載入，立即初始化
        setTimeout(init, 0);
    }

    // 頁面卸載時清理資源
    window.addEventListener('beforeunload', cleanup);

    return publicAPI;
})();

