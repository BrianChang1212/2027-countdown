/**
 * 預測市場詳細視圖模組
 * 顯示更詳細的預測市場數據
 */

const PredictionView = (function() {
    'use strict';

    let container = null;
    let allMarkets = [];
    let filteredMarkets = [];
    let currentFilter = 'all';
    let sortBy = 'volume'; // volume, participants, date, probability
    let languageChangeHandler = null; // 保存語言變化處理器引用

    // 以下功能和數據已拆分到服務模組：
    // - marketsData, questionTranslationMap → PredictionMarketsConfig
    // - translateQuestion → PredictionUtils
    // - 圖表渲染 → PredictionCharts
    // - 統計更新 → PredictionStats
    // - 過濾、排序 → PredictionFilterService
    // - 市場卡片生成 → PredictionMarketCard

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
     * 獲取備用市場數據（使用配置模組）
     */
    function getFallbackMarkets() {
        if (typeof PredictionMarketsConfig !== 'undefined' && PredictionMarketsConfig.getFallbackMarkets) {
            return PredictionMarketsConfig.getFallbackMarkets();
        }
        return [];
    }

    /**
     * 渲染預測市場詳細內容
     */
    async function render() {
        if (!container) {
            container = document.getElementById('view-prediction');
            if (!container) return;
        }

        // 檢查是否已經渲染過
        if (container.querySelector('.prediction-detail-content')) {
            return;
        }

        // 建立詳細內容
        const content = document.createElement('div');
        content.className = 'prediction-detail-content';
        const contentHTML = `
            <div class="view-header">
                <h1 class="view-title" data-i18n="prediction.detailTitle">預測市場詳細數據</h1>
                <p class="view-subtitle" data-i18n="prediction.detailSubtitle">即時追蹤台灣相關預測市場動態</p>
                <div class="data-source-indicator" id="data-source-indicator">
                    <span class="indicator-dot"></span>
                    <span class="indicator-text" data-i18n="dataSource.loading">載入中...</span>
                    <button class="refresh-btn" id="refresh-data-btn" title="刷新數據">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="prediction-controls">
                <div class="prediction-filters">
                    <button class="filter-btn active" data-filter="all" data-i18n="filter.all">全部</button>
                    <button class="filter-btn" data-filter="military" data-i18n="filter.military">軍事</button>
                    <button class="filter-btn" data-filter="politics" data-i18n="filter.politics">政治</button>
                    <button class="filter-btn" data-filter="economy" data-i18n="filter.economy">經濟</button>
                    <button class="filter-btn" data-filter="diplomacy" data-i18n="filter.diplomacy">外交</button>
                    <button class="filter-btn" data-filter="society" data-i18n="filter.society">社會</button>
                </div>

                <div class="prediction-sort">
                    <label for="sort-select" data-i18n="sort.by">排序：</label>
                    <select id="sort-select" class="sort-select">
                        <option value="volume" data-i18n="sort.volume">交易量</option>
                        <option value="participants" data-i18n="sort.participants">參與者</option>
                        <option value="date" data-i18n="sort.date">截止日期</option>
                        <option value="probability" data-i18n="sort.probability">機率</option>
                    </select>
                </div>

                <div class="prediction-search">
                    <input type="text" id="prediction-search-input" class="search-input" placeholder="搜尋市場..." data-i18n-placeholder="search.market">
                    <button class="search-btn" id="prediction-search-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="prediction-stats-summary">
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <div class="stat-value" id="total-markets">0</div>
                        <div class="stat-label" data-i18n="stats.totalMarkets">總市場數</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <div class="stat-value" id="total-volume">$0</div>
                        <div class="stat-label" data-i18n="stats.totalVolume">總交易量</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <div class="stat-value" id="total-participants">0</div>
                        <div class="stat-label" data-i18n="stats.totalParticipants">總參與者</div>
                    </div>
                </div>
            </div>

            <div class="prediction-charts-section" id="prediction-charts-section">
                <h2 class="charts-title" data-i18n="charts.title">數據視覺化</h2>
                <div class="charts-grid">
                    <div class="chart-container">
                        <h3 class="chart-title" data-i18n="charts.category">市場類別分佈</h3>
                        <canvas id="category-chart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h3 class="chart-title" data-i18n="charts.volume">交易量分佈</h3>
                        <canvas id="volume-chart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h3 class="chart-title" data-i18n="charts.probability">機率分佈</h3>
                        <canvas id="probability-chart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h3 class="chart-title" data-i18n="charts.trend">趨勢分析</h3>
                        <canvas id="trend-chart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h3 class="chart-title" data-i18n="charts.timeline">時間序列</h3>
                        <canvas id="timeline-chart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h3 class="chart-title" data-i18n="charts.comparison">類別對比</h3>
                        <canvas id="comparison-chart"></canvas>
                    </div>
                </div>
            </div>

            <div class="prediction-markets-grid" id="prediction-markets-grid">
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p data-i18n="loading">載入中...</p>
                </div>
            </div>
        `;
        
        // 使用安全的 HTML 設置
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.safeSetHTML(content, contentHTML);
        } else {
            // 降級方案：使用 DOMParser（相對安全）
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(contentHTML, 'text/html');
                content.textContent = ''; // 清空
                Array.from(doc.body.childNodes).forEach(node => {
                    content.appendChild(node.cloneNode(true));
                });
            } catch (e) {
                Logger.error('[PredictionView] HTML 解析失敗:', e);
                content.textContent = '載入中...';
            }
        }

        container.appendChild(content);

        // 等待 DOM 更新完成
        await new Promise(resolve => setTimeout(resolve, 50));

        // 初始化數據（先使用備用數據，然後嘗試獲取實際數據）
        allMarkets = [...getFallbackMarkets()];
        filteredMarkets = [...allMarkets];
        
        Logger.debug(`[PredictionView] 初始化完成，備用數據: ${allMarkets.length} 個市場`);

        // 載入預測市場數據（會自動嘗試獲取實際數據）
        await loadPredictionMarkets();
        
        // 在背景中嘗試刷新實際數據（優先使用多數據源服務）
        const dataService = typeof MultiSourceDataService !== 'undefined' 
            ? MultiSourceDataService 
            : (typeof PredictionDataService !== 'undefined' ? PredictionDataService : null);
        
        if (dataService) {
            Logger.debug('[PredictionView] 開始背景刷新實際數據...');
            const refreshMethod = dataService.getAllPredictionMarkets || dataService.refresh || dataService.getAllMarkets;
            refreshMethod.call(dataService).then(realMarkets => {
                Logger.debug(`[PredictionView] 背景刷新完成，獲取到 ${realMarkets ? realMarkets.length : 0} 個市場`);
                if (realMarkets && realMarkets.length > 0) {
                    // 更新數據
                    const seen = new Set(allMarkets.map(m => m.question.toLowerCase()));
                    const newMarkets = realMarkets.filter(m => !seen.has(m.question.toLowerCase()));
                    if (newMarkets.length > 0) {
                        Logger.debug(`[PredictionView] 添加 ${newMarkets.length} 個新市場`);
                        allMarkets = [...allMarkets, ...newMarkets];
                        applyFilters(); // 重新應用篩選
                        updateStats(); // 更新統計
                        updateDataSourceIndicator(); // 更新指示器
                        if (typeof DebugUtils !== 'undefined') {
                            DebugUtils.success(`已更新 ${newMarkets.length} 個實際市場數據`, 'PredictionView');
                        }
                    } else {
                        Logger.debug('[PredictionView] 沒有新市場需要添加');
                    }
                } else {
                    Logger.warn('[PredictionView] 背景刷新沒有獲取到任何市場數據');
                    if (typeof DebugUtils !== 'undefined') {
                            DebugUtils.warning('背景刷新未獲取到實際數據，可能 API 無法訪問', 'PredictionView');
                    }
                }
            }).catch(error => {
                // 使用統一的錯誤處理
                if (typeof ErrorHandler !== 'undefined' && ErrorHandler.logError) {
                    ErrorHandler.logError(error, 'PredictionView.backgroundRefresh');
                } else {
                    Logger.error('[PredictionView] 背景刷新失敗:', error);
                }
            });
        } else {
            Logger.warn('[PredictionView] PredictionDataService 未定義，無法獲取實際數據');
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.warning('PredictionDataService 未載入', 'PredictionView');
            }
        }

        // 初始化功能
        initFilters();
        initSort();
        initSearch();
        initRefresh();
        updateStats();
        updateDataSourceIndicator();

        // 更新翻譯
        if (typeof I18nModule !== 'undefined' && I18nModule.updateTranslations) {
            I18nModule.updateTranslations();
        }
    }

    /**
     * 從 API 獲取實際數據
     */
    async function fetchRealData() {
        try {
            // 優先使用多數據源服務
            const dataService = typeof MultiSourceDataService !== 'undefined' 
                ? MultiSourceDataService 
                : (typeof PredictionDataService !== 'undefined' ? PredictionDataService : null);
            
            if (dataService) {
                const getAllMethod = dataService.getAllPredictionMarkets || dataService.getAllMarkets;
                const realMarkets = await getAllMethod.call(dataService);
                if (realMarkets && realMarkets.length > 0) {
                    // 合併實際數據和備用數據
                    allMarkets = [...realMarkets, ...getFallbackMarkets()];
                    // 去重（使用過濾服務）
                    if (typeof PredictionFilterService !== 'undefined' && PredictionFilterService.deduplicateMarkets) {
                        allMarkets = PredictionFilterService.deduplicateMarkets(allMarkets);
                    } else {
                        // 降級方案：手動去重
                    const seen = new Set();
                    allMarkets = allMarkets.filter(market => {
                            const key = (market.question || '').toLowerCase();
                        if (seen.has(key)) {
                            return false;
                        }
                        seen.add(key);
                        return true;
                    });
                    }
                    filteredMarkets = [...allMarkets];
                    return true;
                }
            }
        } catch (error) {
            // 使用統一的錯誤處理
            if (typeof ErrorHandler !== 'undefined' && ErrorHandler.logError) {
                ErrorHandler.logError(error, 'PredictionView.fetchRealData');
            } else {
                Logger.error('[PredictionView] 獲取實際數據失敗:', error);
            }
        }
        return false;
    }

    /**
     * 載入預測市場數據
     */
    async function loadPredictionMarkets() {
        const grid = document.getElementById('prediction-markets-grid');
        if (!grid) {
            Logger.warn('[PredictionView] prediction-markets-grid 元素不存在');
            return;
        }

        // 確保有數據（如果沒有，使用備用數據）
        if (allMarkets.length === 0) {
            Logger.debug('[PredictionView] 沒有數據，嘗試獲取實際數據...');
            const hasRealData = await fetchRealData();
            if (!hasRealData) {
                // 使用備用數據
                Logger.debug('[PredictionView] 使用備用數據');
                allMarkets = [...getFallbackMarkets()];
                filteredMarkets = [...allMarkets];
            }
        }

        // 確保 filteredMarkets 有數據
        if (filteredMarkets.length === 0 && allMarkets.length > 0) {
            filteredMarkets = [...allMarkets];
        }

        Logger.debug(`[PredictionView] 準備渲染 ${filteredMarkets.length} 個市場`);

        // 排序市場（使用過濾服務）
        if (typeof PredictionFilterService !== 'undefined' && PredictionFilterService.sortMarkets) {
            filteredMarkets = PredictionFilterService.sortMarkets(filteredMarkets, sortBy);
        } else {
            // 降級方案：手動排序
            filteredMarkets.sort((a, b) => {
                switch (sortBy) {
                    case 'volume':
                        return parseFloat((b.volume || '').replace(/[^0-9.]/g, '')) - parseFloat((a.volume || '').replace(/[^0-9.]/g, ''));
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

        // 渲染市場卡片（使用卡片組件）
        if (filteredMarkets.length === 0) {
            const noResultsHTML = `
                <div class="no-results">
                    <p data-i18n="noResults">沒有找到符合條件的市場</p>
                </div>
            `;
            // 使用安全的 HTML 設置
            if (typeof DOMUtils !== 'undefined') {
                DOMUtils.safeSetHTML(grid, noResultsHTML);
            } else {
                // 降級方案：使用 DOMParser
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(noResultsHTML, 'text/html');
                    grid.textContent = '';
                    Array.from(doc.body.childNodes).forEach(node => {
                        grid.appendChild(node.cloneNode(true));
                    });
                } catch (e) {
                    Logger.error('[PredictionView] HTML 解析失敗:', e);
                    grid.textContent = '沒有結果';
                }
            }
            Logger.warn('[PredictionView] 沒有市場數據可顯示');
            return;
        }

        Logger.debug(`[PredictionView] 開始渲染 ${filteredMarkets.length} 個市場卡片`);
        
        // 使用市場卡片組件生成 HTML
        let marketsHTML = '';
        if (typeof PredictionMarketCard !== 'undefined' && PredictionMarketCard.createCards) {
            marketsHTML = PredictionMarketCard.createCards(filteredMarkets);
        } else {
            // 降級方案：生成簡單的 HTML
            marketsHTML = filteredMarkets.map(market => {
                const question = (typeof PredictionUtils !== 'undefined' && PredictionUtils.translateQuestion)
                    ? PredictionUtils.translateQuestion(market.question || '')
                    : (market.question || '');
                return `<div class="prediction-market-card" data-id="${market.id || ''}"><h3>${question}</h3></div>`;
        }).join('');
        }
        
        // 使用安全的 HTML 設置
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.safeSetHTML(grid, marketsHTML);
        } else {
            // 降級方案：使用 DOMParser
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(marketsHTML, 'text/html');
                grid.textContent = '';
                Array.from(doc.body.childNodes).forEach(node => {
                    grid.appendChild(node.cloneNode(true));
                });
            } catch (e) {
                Logger.error('[PredictionView] HTML 解析失敗:', e);
                grid.textContent = '載入中...';
            }
        }

        // 移除載入狀態
        const loadingState = grid.querySelector('.loading-state');
        if (loadingState) {
            loadingState.remove();
        }

        Logger.debug(`[PredictionView] 成功渲染 ${filteredMarkets.length} 個市場卡片`);
        
        // 更新圖表（使用圖表組件）
        if (typeof PredictionCharts !== 'undefined' && PredictionCharts.updateAllCharts) {
            PredictionCharts.updateAllCharts(filteredMarkets);
        }
        
        // 更新翻譯（如果有新渲染的內容）
        if (typeof I18nModule !== 'undefined' && I18nModule.updateTranslations) {
            I18nModule.updateTranslations();
        }
    }

    /**
     * 更新統計資訊（使用統計組件）
     */
    function updateStats() {
        if (typeof PredictionStats !== 'undefined' && PredictionStats.update) {
            PredictionStats.update(filteredMarkets);
        } else {
            // 降級方案：手動更新
        const totalMarkets = document.getElementById('total-markets');
        const totalVolume = document.getElementById('total-volume');
        const totalParticipants = document.getElementById('total-participants');

        if (totalMarkets) {
            totalMarkets.textContent = filteredMarkets.length;
        }

        if (totalVolume) {
            const volume = filteredMarkets.reduce((sum, market) => {
                    return sum + (parseFloat((market.volume || '').replace(/[^0-9.]/g, '')) || 0);
            }, 0);
            totalVolume.textContent = `$${(volume / 1000).toFixed(0)}K`;
        }

        if (totalParticipants) {
                const participants = filteredMarkets.reduce((sum, market) => sum + (market.participants || 0), 0);
            totalParticipants.textContent = participants.toLocaleString();
        }
        }
        
        // 更新圖表（使用圖表組件）
        if (typeof PredictionCharts !== 'undefined' && PredictionCharts.updateAllCharts) {
            PredictionCharts.updateAllCharts(filteredMarkets);
        }
    }

    // 以下圖表渲染函數已拆分到 PredictionCharts 組件：
    // - renderCategoryChart
    // - renderVolumeChart
    // - renderProbabilityChart
    // - renderTrendChart

    /**
     * 初始化篩選器
     */
    function initFilters() {
        const filterBtns = document.querySelectorAll('.prediction-filters .filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 更新按鈕狀態
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 更新篩選
                currentFilter = btn.dataset.filter;
                applyFilters();
            });
        });
    }


    /**
     * 應用篩選（使用過濾服務）
     */
    function applyFilters() {
        const searchInput = document.getElementById('prediction-search-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        // 使用過濾服務
        if (typeof PredictionFilterService !== 'undefined' && PredictionFilterService.filterMarkets) {
            filteredMarkets = PredictionFilterService.filterMarkets(allMarkets, currentFilter, searchTerm);
        } else {
            // 降級方案：手動過濾
        if (currentFilter === 'all') {
            filteredMarkets = allMarkets.filter(market => 
                    (market.question || '').toLowerCase().includes(searchTerm)
            );
        } else {
            filteredMarkets = allMarkets.filter(market => 
                market.category === currentFilter && 
                    (market.question || '').toLowerCase().includes(searchTerm)
            );
            }
        }

        loadPredictionMarkets();
        updateStats();
    }

    /**
     * 初始化排序
     */
    function initSort() {
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                sortBy = e.target.value;
                loadPredictionMarkets();
            });
        }
    }

    /**
     * 初始化搜尋
     */
    function initSearch() {
        const searchInput = document.getElementById('prediction-search-input');
        const searchBtn = document.getElementById('prediction-search-btn');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                applyFilters();
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    applyFilters();
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                applyFilters();
            });
        }
    }

    /**
     * 初始化刷新功能
     */
    function initRefresh() {
        const refreshBtn = document.getElementById('refresh-data-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.disabled = true;
                refreshBtn.classList.add('spinning');
                
                if (typeof DebugUtils !== 'undefined') {
                    DebugUtils.log('手動刷新數據', 'PredictionView');
                }

                try {
                    // 優先使用多數據源服務
                    const dataService = typeof MultiSourceDataService !== 'undefined' 
                        ? MultiSourceDataService 
                        : (typeof PredictionDataService !== 'undefined' ? PredictionDataService : null);
                    
                    if (dataService) {
                        const refreshMethod = dataService.refresh || dataService.getAllPredictionMarkets || dataService.getAllMarkets;
                        const realMarkets = await refreshMethod.call(dataService);
                        if (realMarkets && realMarkets.length > 0) {
                            // 合併新數據
                            const seen = new Set(allMarkets.map(m => m.question.toLowerCase()));
                            const newMarkets = realMarkets.filter(m => !seen.has(m.question.toLowerCase()));
                            
                            if (newMarkets.length > 0) {
                                allMarkets = [...allMarkets, ...newMarkets];
                                applyFilters();
                                updateStats();
                                updateDataSourceIndicator();
                                
                                if (typeof DebugUtils !== 'undefined') {
                                    DebugUtils.success(`已更新 ${newMarkets.length} 個市場`, 'PredictionView');
                                }
                            } else {
                                if (typeof DebugUtils !== 'undefined') {
                                    DebugUtils.log('沒有新市場數據', 'PredictionView');
                                }
                            }
                        }
                    }
                } catch (error) {
                    Logger.error('[PredictionView] 刷新失敗:', error);
                    if (typeof DebugUtils !== 'undefined') {
                        DebugUtils.error(`刷新失敗: ${error.message}`, 'PredictionView');
                    }
                } finally {
                    refreshBtn.disabled = false;
                    refreshBtn.classList.remove('spinning');
                }
            });
        }
    }

    /**
     * 更新數據來源指示器
     */
    function updateDataSourceIndicator() {
        const indicator = document.getElementById('data-source-indicator');
        if (!indicator) return;

        const dot = indicator.querySelector('.indicator-dot');
        const text = indicator.querySelector('.indicator-text');
        
        if (!dot || !text) return;

        // 檢查是否有實際數據（有 rawData 的市場）
        const realMarkets = allMarkets.filter(m => m.rawData);
        
        // 統計數據源
        const sources = {};
        realMarkets.forEach(m => {
            sources[m.source] = (sources[m.source] || 0) + 1;
        });
        const sourceList = Object.keys(sources).join('、');

        Logger.debug(`[PredictionView] 檢查數據來源: 總共 ${allMarkets.length} 個市場，其中 ${realMarkets.length} 個是實際數據`);

        if (realMarkets.length > 0) {
            dot.style.backgroundColor = '#10b981'; // 綠色表示實際數據
            if (sourceList) {
                text.textContent = `即時數據 (${realMarkets.length}個市場，來源: ${sourceList})`;
            } else {
                text.textContent = `即時數據 (${realMarkets.length}個市場)`;
            }
            text.setAttribute('data-i18n', 'dataSource.live');
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.success(`顯示 ${realMarkets.length} 個實際市場，來源: ${sourceList}`, 'PredictionView');
            }
        } else {
            dot.style.backgroundColor = '#f59e0b'; // 橙色表示備用數據
            text.textContent = `備用數據 (${allMarkets.length}個市場)`;
            text.setAttribute('data-i18n', 'dataSource.fallback');
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.log(`使用備用數據，共 ${allMarkets.length} 個市場`, 'PredictionView');
            }
        }

        // 更新翻譯
        if (typeof I18nModule !== 'undefined' && I18nModule.updateTranslations) {
            I18nModule.updateTranslations();
        }
    }

    /**
     * 處理語言變化
     */
    async function handleLanguageChange() {
        // 檢查視圖是否當前顯示
        if (!container || container.style.display === 'none') {
            return;
        }
        
        Logger.debug('[PredictionView] 語言切換，重新渲染圖表');
        
        // 等待 I18nModule 更新
        if (typeof I18nModule !== 'undefined' && I18nModule.updateTranslations) {
            // 等待 I18nModule 準備好
            if (typeof I18nModule.isReady === 'function') {
                let retries = 10;
                while (retries > 0 && !I18nModule.isReady()) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    retries--;
                }
            }
            
            // 更新翻譯
            I18nModule.updateTranslations();
            
            // 等待翻譯更新完成
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // 重新渲染所有圖表（使用新的翻譯標籤）
        updateCharts();
        
        // 重新渲染市場卡片（更新問題文字的翻譯）
        await loadPredictionMarkets();
    }

    /**
     * 卸載視圖
     */
    function unload() {
        // 移除語言變化監聽器
        if (languageChangeHandler) {
            window.removeEventListener('languageChanged', languageChangeHandler);
            languageChangeHandler = null;
        }
        
        // 銷毀所有圖表（使用圖表組件）
        if (typeof PredictionCharts !== 'undefined' && PredictionCharts.cleanup) {
            PredictionCharts.cleanup();
        }
        
        // 清理工作
        if (container) {
            const content = container.querySelector('.prediction-detail-content');
            if (content) {
                content.remove();
            }
        }
    }

    /**
     * 載入視圖
     */
    async function load() {
        // 監聽語言變化事件
        if (!languageChangeHandler) {
            languageChangeHandler = handleLanguageChange;
            window.addEventListener('languageChanged', languageChangeHandler);
        }
        
        await render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return {
        load,
        unload,
        handleLanguageChange
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.PredictionView = PredictionView;
}
