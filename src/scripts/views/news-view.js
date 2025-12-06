/**
 * 新聞視圖模組
 * 顯示新聞列表和詳細內容
 */

const NewsView = (function() {
    'use strict';

    let container = null;
    let currentCategory = 'taiwan';
    let allNews = [];

    /**
     * 渲染新聞視圖內容
     */
    async function render() {
        if (!container) {
            container = document.getElementById('view-news');
            if (!container) return;
        }

        // 檢查是否已經渲染過
        if (container.querySelector('.news-detail-content')) {
            Logger.debug('[NewsView] 內容已經存在，只初始化標籤和搜尋');
            // 如果已存在，只需要重新初始化標籤和搜尋功能，不需要重新渲染整個內容
            initTabs();
            initSearch();
            return;
        }

        // 建立視圖內容
        const content = document.createElement('div');
        content.className = 'news-detail-content';
        const contentHTML = `
            <div class="view-header">
                <h1 class="view-title" data-i18n="news.detailTitle">政治新聞動態</h1>
                <p class="view-subtitle" data-i18n="news.detailSubtitle">即時追蹤兩岸政治新聞與國際動態</p>
            </div>

            <div class="news-tabs">
                <button class="news-tab active" data-category="taiwan">
                    <span class="tab-icon">TW</span>
                    <span data-i18n="taiwanNews">台灣新聞</span>
                </button>
                <button class="news-tab" data-category="international">
                    <span class="tab-icon">INT</span>
                    <span data-i18n="intlNews">國際新聞</span>
                </button>
                <button class="news-tab" data-category="cross-strait">
                    <span class="tab-icon">CN</span>
                    <span data-i18n="crossStraitNews">兩岸關係</span>
                </button>
            </div>

            <div class="news-search">
                <input type="text" id="news-search-input" placeholder="搜尋新聞..." data-i18n-placeholder="news.searchPlaceholder">
                <button class="search-btn" id="news-search-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                </button>
            </div>

            <div class="news-list-container">
                <div class="news-loading">
                    <div class="loading-spinner"></div>
                    <p data-i18n="loadingNews">正在載入最新新聞...</p>
                </div>
                <div class="news-list" id="news-detail-list">
                    <!-- 新聞列表將由 JavaScript 動態生成 -->
                </div>
                <div class="news-error" id="news-detail-error" style="display: none;">
                    <span class="error-icon">!</span>
                    <p data-i18n="newsError">無法載入新聞，請稍後再試</p>
                    <button class="retry-btn" data-i18n="retryBtn">重新載入</button>
                </div>
            </div>
        `;
        
        // 使用安全的 HTML 設置
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.safeSetHTML(content, contentHTML);
        } else {
            content.innerHTML = contentHTML; // 降級方案
        }

        container.appendChild(content);

        // 初始化功能
        initTabs();
        initSearch();
        loadNews('taiwan');

        // 更新翻譯（特別是 placeholder）
        if (typeof I18nModule !== 'undefined' && I18nModule.updateTranslations) {
            I18nModule.updateTranslations();
        }
    }

    /**
     * 初始化標籤切換功能
     */
    function initTabs() {
        // 確保容器存在，如果不存在則嘗試獲取
        if (!container) {
            container = document.getElementById('view-news');
        }
        if (!container) {
            Logger.warn('[NewsView] 找不到新聞視圖容器，無法初始化標籤');
            return;
        }

        const tabsContainer = container.querySelector('.news-tabs');
        if (!tabsContainer) {
            Logger.warn('[NewsView] 找不到標籤容器');
            return;
        }

        const tabs = tabsContainer.querySelectorAll('.news-tab');
        if (tabs.length === 0) {
            Logger.warn('[NewsView] 找不到標籤按鈕');
            return;
        }

        // 移除舊的事件監聽器，避免重複綁定
        tabs.forEach(tab => {
            // 克隆節點以移除所有事件監聽器
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
        });

        // 重新獲取新的標籤節點並綁定事件
        const newTabs = tabsContainer.querySelectorAll('.news-tab');
        Logger.debug(`[NewsView] 找到 ${newTabs.length} 個標籤按鈕，準備綁定事件`);
        
        newTabs.forEach((tab, index) => {
            const category = tab.dataset.category;
            Logger.debug(`[NewsView] 標籤 ${index}: category=${category}`);
            
            if (!category) {
                Logger.warn(`[NewsView] 標籤 ${index} 缺少 data-category 屬性`);
                return;
            }
            
            // 綁定點擊事件
            tab.addEventListener('click', function(e) {
                Logger.debug(`[NewsView] 標籤被點擊，類別: ${category}`);
                e.preventDefault();
                e.stopPropagation();
                
                // 更新活動標籤
                newTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                Logger.debug(`[NewsView] 標籤 ${category} 已設為 active`);
                
                // 更新當前類別
                const previousCategory = currentCategory;
                currentCategory = category;
                Logger.debug(`[NewsView] 類別從 ${previousCategory} 切換到 ${currentCategory}`);
                
                // 切換類別時清空搜尋輸入框，顯示所有新聞
                const searchInput = container.querySelector('#news-search-input');
                if (searchInput) {
                    searchInput.value = '';
                }
                
                Logger.debug(`[NewsView] 準備 loadNews(${currentCategory}, true)`);
                loadNews(currentCategory, true).catch(error => {
                    Logger.error('[NewsView] loadNews 發生錯誤:', error);
                    // 使用統一的錯誤處理
                    if (typeof ErrorHandler !== 'undefined' && ErrorHandler.logError) {
                        ErrorHandler.logError(error, `NewsView.initTabs.${category}`);
                    }
                });
            }, { capture: false, once: false });
            
            Logger.debug(`[NewsView] 已為標籤 "${category}" 綁定點擊事件`);
        });

        Logger.debug(`[NewsView] 完成綁定 ${newTabs.length} 個標籤`);
    }

    /**
     * 初始化搜尋功能
     */
    function initSearch() {
        // 確保容器存在，如果不存在則嘗試獲取
        if (!container) {
            container = document.getElementById('view-news');
        }
        if (!container) {
            Logger.warn('[NewsView] 找不到新聞視圖容器，無法初始化搜尋');
            return;
        }

        const searchInput = container.querySelector('#news-search-input');
        const searchBtn = container.querySelector('#news-search-btn');

        if (!searchInput) {
            Logger.warn('[NewsView] 找不到搜尋輸入框');
            return;
        }

        if (!searchBtn) {
            Logger.warn('[NewsView] 找不到搜尋按鈕');
            return;
        }

        // 移除舊的事件監聽器，避免重複綁定
        const newSearchBtn = searchBtn.cloneNode(true);
        searchBtn.parentNode?.replaceChild(newSearchBtn, searchBtn);
        
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode?.replaceChild(newSearchInput, searchInput);

        // 重新獲取新的元素
        const finalSearchInput = container.querySelector('#news-search-input');
        const finalSearchBtn = container.querySelector('#news-search-btn');

        if (finalSearchBtn) {
            finalSearchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                Logger.debug('[NewsView] 搜尋按鈕被點擊');
                performSearch();
            });
            Logger.debug('[NewsView] 已為搜尋按鈕綁定事件');
        }

        if (finalSearchInput) {
            finalSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    Logger.debug('[NewsView] 搜尋輸入框按下 Enter 鍵');
                    performSearch();
                }
            });
            
            // 實時搜尋 input 事件（當清空搜尋時顯示所有新聞）
            finalSearchInput.addEventListener('input', (e) => {
                // 如果輸入框為空，顯示所有新聞
                if (!e.target.value.trim()) {
                    displayNews(allNews);
                }
            });
            
            Logger.debug('[NewsView] 已為搜尋輸入框綁定事件');
        }
    }

    /**
     * 執行搜尋
     */
    function performSearch() {
        if (!container) {
            container = document.getElementById('view-news');
        }
        
        const searchInput = container ? container.querySelector('#news-search-input') : document.getElementById('news-search-input');
        const query = searchInput?.value.toLowerCase().trim() || '';

        Logger.debug(`[NewsView] 執行搜尋，查詢字串: "${query}"`);
        Logger.debug(`[NewsView] 當前共有 ${allNews.length} 篇新聞`);

        if (!query) {
            Logger.debug('[NewsView] 搜尋字串為空，顯示所有新聞');
            displayNews(allNews);
            return;
        }

        const filtered = allNews.filter(news => {
            const title = (news.title || '').toLowerCase();
            const desc = (news.description || '').toLowerCase();
            const source = (news.source || '').toLowerCase();
            const match = title.includes(query) || desc.includes(query) || source.includes(query);
            return match;
        });

        Logger.debug(`[NewsView] 搜尋結果: 找到 ${filtered.length} 篇新聞`);
        displayNews(filtered);
    }

    /**
     * 載入新聞，根據類別和是否需要強制刷新來決定
     */
    async function loadNews(category, forceRefresh = false) {
        Logger.debug(`[NewsView] loadNews 被調用， category=${category}, forceRefresh=${forceRefresh}`);
        
        if (!container) {
            container = document.getElementById('view-news');
        }
        if (!container) {
            Logger.error('[NewsView] loadNews: 找不到新聞視圖容器');
            return;
        }
        
        const list = document.getElementById('news-detail-list');
        const loading = container.querySelector('.news-loading');
        const error = document.getElementById('news-detail-error');

        Logger.debug(`[NewsView] loadNews: 找到元素- list: ${!!list}, loading: ${!!loading}, error: ${!!error}`);

        // 顯示載入狀態
        if (loading) {
            loading.style.display = 'flex';
            Logger.debug('[NewsView] loadNews: 顯示載入狀態');
        }
        if (error) {
            error.style.display = 'none';
        }
        if (list) {
            // 清空列表內容，避免重複顯示 DOM 元素
            while (list.firstChild) {
                list.removeChild(list.firstChild);
            }
            Logger.debug('[NewsView] loadNews: 清空列表內容');
        }

        try {
            Logger.debug(`[NewsView] loadNews: 準備載入類別 ${category}, 強制刷新: ${forceRefresh}`);
            
            // 從 NewsModule 獲取新聞數據，如果有緩存則使用緩存，否則重新獲取
            // 這裡應該調用 NewsModule 的獲取新聞方法，使用緩存或重新獲取
            allNews = await fetchNewsData(category, forceRefresh);
            
            Logger.debug(`[NewsView] loadNews: 獲取到 ${allNews.length} 篇新聞`);
            
            if (allNews.length === 0) {
                Logger.warn(`[NewsView] loadNews: 類別 ${category} 沒有新聞數據`);
            }
            
            // 顯示新聞
            Logger.debug(`[NewsView] loadNews: 準備 displayNews，共有 ${allNews.length} 篇`);
            displayNews(allNews);
            Logger.debug('[NewsView] loadNews: displayNews 完成');
        } catch (err) {
            Logger.error('[NewsView] loadNews: 載入新聞發生錯誤:', err);
            // 使用統一的錯誤處理
            if (typeof ErrorHandler !== 'undefined' && ErrorHandler.logError) {
                ErrorHandler.logError(err, `NewsView.loadNews.${category}`);
            }
            if (error) {
                error.style.display = 'block';
                Logger.debug('[NewsView] loadNews: 顯示錯誤狀態');
            }
        } finally {
            if (loading) {
                loading.style.display = 'none';
                Logger.debug('[NewsView] loadNews: 隱藏載入狀態');
            }
        }
    }

    /**
     * 等待 NewsModule 準備就緒
     */
    async function waitForNewsModule(maxWait = 5000) {
        const startTime = Date.now();
        while (typeof NewsModule === 'undefined' || !NewsModule.getNewsData) {
            if (Date.now() - startTime > maxWait) {
                Logger.warn('NewsModule 等待超時');
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return true;
    }

    /**
     * 獲取新聞數據
     * 使用緩存或重新獲取，根據傳入的參數決定是否強制刷新
     */
    async function fetchNewsData(category, forceRefresh = false) {
        // 等待 NewsModule 準備就緒
        const isReady = await waitForNewsModule();
        if (!isReady) {
            Logger.warn('[NewsView] NewsModule 未就緒，返回空陣列');
            return [];
        }

        // 使用 NewsModule 獲取新聞數據，根據傳入的參數決定是否使用緩存或重新獲取
        // 這裡應該調用 NewsModule 的獲取新聞方法，使用緩存或重新獲取
        try {
            Logger.debug(`[NewsView] 準備載入新聞視圖數據 (類別: ${category}, 強制刷新: ${forceRefresh})`);
            const newsData = await NewsModule.getNewsData(category, forceRefresh);
            Logger.debug(`[NewsView] 獲取到 ${newsData?.length || 0} 篇新聞`);
            return newsData || [];
        } catch (error) {
            Logger.error('[NewsView] 從 NewsModule 獲取新聞發生錯誤:', error);
            return [];
        }
    }

    /**
     * 顯示新聞列表
     */
    function displayNews(newsItems) {
        Logger.debug(`[NewsView] displayNews 被調用，新聞數量: ${newsItems?.length || 0}`);
        
        const list = document.getElementById('news-detail-list');
        if (!list) {
            Logger.error('[NewsView] displayNews: 找不到 news-detail-list 元素');
            return;
        }

        if (!newsItems || newsItems.length === 0) {
            Logger.warn('[NewsView] displayNews: 沒有新聞可顯示');
            const noNewsHTML = '<p class="no-news" data-i18n="news.noNews">暫無新聞</p>';
            // 使用安全的 HTML 設置
            if (typeof DOMUtils !== 'undefined') {
                DOMUtils.safeSetHTML(list, noNewsHTML);
            } else {
                // 降級方案，使用 DOMParser
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(noNewsHTML, 'text/html');
                    list.textContent = '';
                    Array.from(doc.body.childNodes).forEach(node => {
                        list.appendChild(node.cloneNode(true));
                    });
                } catch (e) {
                    Logger.error('[NewsView] HTML 解析失敗:', e);
                    list.textContent = '暫無新聞';
                }
            }
            return;
        }
        
        Logger.debug(`[NewsView] displayNews: 準備顯示 ${newsItems.length} 篇新聞`);

        const newsListHTML = newsItems.map(news => `
            <article class="news-detail-item">
                <div class="news-item-header">
                    <span class="news-source">${news.source || '未知來源'}</span>
                    <span class="news-date">${formatDate(news.pubDate)}</span>
                </div>
                <h3 class="news-item-title">
                    <a href="${news.link || '#'}" target="_blank" rel="noopener noreferrer">
                        ${news.title || '無標題'}
                    </a>
                </h3>
                <p class="news-item-desc">${news.description || ''}</p>
                <div class="news-item-footer">
                    <a href="${news.link || '#'}" target="_blank" rel="noopener noreferrer" class="read-more-btn" data-i18n="readMore">閱讀全文</a>
                </div>
            </article>
        `).join('');
        
        Logger.debug(`[NewsView] displayNews: 生成 HTML 長度: ${newsListHTML.length}`);
        
        // 使用安全的 HTML 設置，特別注意避免 XSS 攻擊，這裡新聞內容可能包含 HTML 標籤，所以使用 safeSetHTML
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.safeSetHTML(list, newsListHTML, { sanitize: false });
            Logger.debug(`[NewsView] displayNews: 使用 DOMUtils.safeSetHTML 設置，實際長度: ${list.innerHTML.length}`);
        } else {
            // 降級方案，使用 DOMParser
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(newsListHTML, 'text/html');
                list.textContent = '';
                Array.from(doc.body.childNodes).forEach(node => {
                    list.appendChild(node.cloneNode(true));
                });
                Logger.debug(`[NewsView] displayNews: 使用 DOMParser 設置，子元素數: ${list.children.length}`);
            } catch (e) {
                Logger.error('[NewsView] displayNews: HTML 解析失敗:', e);
                list.textContent = '載入中...';
            }
        }

        // 更新翻譯
        if (typeof I18nModule !== 'undefined' && I18nModule.updateTranslations) {
            I18nModule.updateTranslations();
        }
    }

    /**
     * 格式化日期
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * 載入視圖
     */
    async function load() {
        await render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 卸載視圖
     */
    function unload() {
        // 移除事件監聽器，避免記憶體洩漏
        if (container) {
            const tabsContainer = container.querySelector('.news-tabs');
            if (tabsContainer) {
                const tabs = tabsContainer.querySelectorAll('.news-tab');
                tabs.forEach(tab => {
                    // 克隆節點以移除所有事件監聽器
                    const newTab = tab.cloneNode(true);
                    tab.parentNode?.replaceChild(newTab, tab);
                });
            }

            const searchBtn = container.querySelector('#news-search-btn');
            const searchInput = container.querySelector('#news-search-input');
            if (searchBtn) {
                const newBtn = searchBtn.cloneNode(true);
                searchBtn.parentNode?.replaceChild(newBtn, searchBtn);
            }
            if (searchInput) {
                const newInput = searchInput.cloneNode(true);
                searchInput.parentNode?.replaceChild(newInput, searchInput);
            }
        }

        // 清空數據
        allNews = [];
        currentCategory = 'taiwan';

        Logger.debug('[NewsView] 新聞視圖已卸載');
    }

    return {
        load,
        unload
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.NewsView = NewsView;
}
