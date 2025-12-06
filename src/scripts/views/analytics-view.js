/**
 * 訪客分析視圖模組
 * 提供詳細的訪客分析資訊，與首頁功能分離
 */

const AnalyticsView = (function() {
    'use strict';

    let container = null;
    let currentChartType = 'doughnut'; // 'doughnut' or 'bar'
    let countryStats = {};
    let totalVisitors = 0;
    let countryCount = 0;
    let languageChangeHandler = null; // 保存事件處理器引用

    /**
     * 獲取翻譯文字
     */
    function t(key, defaultValue = '') {
        if (typeof I18nModule !== 'undefined' && I18nModule.t) {
            return I18nModule.t(key) || defaultValue;
        }
        return defaultValue;
    }

    // 以下函數已拆分到組件模組：
    // - getCountryFlag, formatNumber → AnalyticsUtils
    // - generateColors, prepareChartData, updateChart → AnalyticsChart
    // - updateCountryList, updateSummary → AnalyticsStats

    /**
     * 更新圖表（使用 AnalyticsChart 組件）
     */
    function updateChart() {
        if (typeof AnalyticsChart !== 'undefined' && AnalyticsChart.updateChart) {
            AnalyticsChart.updateChart(countryStats, currentChartType);
        } else {
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.error('AnalyticsChart 組件未載入', 'AnalyticsView');
            }
        }
    }

    /**
     * 更新國家列表顯示（使用 AnalyticsStats 組件）
     */
    function updateCountryList() {
        if (typeof AnalyticsStats !== 'undefined' && AnalyticsStats.updateCountryList) {
            AnalyticsStats.updateCountryList(countryStats);
        } else {
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.error('AnalyticsStats 組件未載入', 'AnalyticsView');
            }
        }
    }

    /**
     * 更新統計摘要（使用 AnalyticsStats 組件）
     */
    function updateSummary() {
        if (typeof AnalyticsStats !== 'undefined' && AnalyticsStats.updateSummary) {
            AnalyticsStats.updateSummary(totalVisitors, countryCount);
        } else {
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.error('AnalyticsStats 組件未載入', 'AnalyticsView');
            }
        }
    }

    /**
     * 切換圖表類型（使用 AnalyticsChart 組件）
     */
    function switchChartType(type) {
        currentChartType = type;
        
        if (typeof AnalyticsChart !== 'undefined' && AnalyticsChart.switchChartType) {
            AnalyticsChart.switchChartType(type, countryStats);
        } else {
            updateChart(); // 降級方案
        }
        
        // 更新按鈕狀態
        const buttons = document.querySelectorAll('.chart-type-btn');
        buttons.forEach(btn => {
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * 重新整理數據
     */
    async function refreshData() {
        const refreshBtn = document.getElementById('analytics-refresh-btn');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.textContent = t('loading', '載入中...');
        }

        try {
            // 從 VisitorAnalyticsModule 獲取最新數據
            if (typeof VisitorAnalyticsModule !== 'undefined') {
                await VisitorAnalyticsModule.refresh();
                countryStats = VisitorAnalyticsModule.getStats();
                totalVisitors = VisitorAnalyticsModule.getTotalVisitors();
                countryCount = Object.keys(countryStats).length;
            }

            // 從 VisitorCounterModule 獲取瀏覽數
            if (typeof VisitorCounterModule !== 'undefined') {
                VisitorCounterModule.refresh();
            }

            // 更新顯示
            updateChart();
            updateCountryList();
            updateSummary();
        } catch (error) {
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.error('重新整理數據失敗:', 'AnalyticsView', error);
            } else {
                Logger.error('[AnalyticsView] 重新整理數據失敗:', error);
            }
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                // 確保 data-i18n 屬性存在，以便語言切換時能正確更新
                if (!refreshBtn.hasAttribute('data-i18n')) {
                    refreshBtn.setAttribute('data-i18n', 'analytics.refresh');
                }
                // 使用翻譯系統更新按鈕文字
                const refreshText = t('analytics.refresh', '重新整理');
                refreshBtn.textContent = refreshText;
            }
        }
    }

    /**
     * 匯出數據
     */
    function exportData() {
        const data = {
            totalVisitors: totalVisitors,
            countryCount: countryCount,
            countries: Object.values(countryStats)
                .sort((a, b) => b.count - a.count)
                .map(item => ({
                    code: item.code,
                    name: item.name,
                    count: item.count
                })),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitor-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 創建視圖 HTML
     */
    function createViewHTML() {
        return `
            <section class="analytics-detail-section">
                <div class="analytics-detail-header">
                    <div class="analytics-detail-header-line"></div>
                    <h1 class="analytics-detail-title">
                        <span class="analytics-detail-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M21 10V3H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </span>
                        <span data-i18n="analytics.detailedTitle">詳細訪客分析</span>
                    </h1>
                    <div class="analytics-detail-header-line"></div>
                </div>

                <p class="analytics-detail-subtitle" data-i18n="analytics.detailedSubtitle">深入了解訪客來源與分布</p>

                <!-- 統計摘要 -->
                <div class="analytics-summary-grid">
                    <div class="analytics-summary-card">
                        <div class="summary-card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                <line x1="17" y1="10" x2="23" y2="10"></line>
                                <line x1="20" y1="7" x2="20" y2="13"></line>
                            </svg>
                        </div>
                        <div class="summary-card-content">
                            <div class="summary-card-label" data-i18n="analytics.totalVisitors">總訪客數</div>
                            <div class="summary-card-value" id="analytics-total-visitors">0</div>
                        </div>
                    </div>

                    <div class="analytics-summary-card">
                        <div class="summary-card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                        </div>
                        <div class="summary-card-content">
                            <div class="summary-card-label" data-i18n="analytics.countries">國家數量</div>
                            <div class="summary-card-value" id="analytics-country-count">0</div>
                        </div>
                    </div>

                    <div class="analytics-summary-card">
                        <div class="summary-card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <div class="summary-card-content">
                            <div class="summary-card-label" data-i18n="analytics.lastUpdate">最後更新</div>
                            <div class="summary-card-value-small" id="analytics-last-update">--</div>
                        </div>
                    </div>
                </div>

                <!-- 操作按鈕 -->
                <div class="analytics-actions">
                    <div class="chart-type-selector">
                        <span class="chart-type-label" data-i18n="analytics.chartType">圖表類型</span>
                        <button class="chart-type-btn active" data-type="doughnut" data-i18n="analytics.doughnut">圓餅圖</button>
                        <button class="chart-type-btn" data-type="bar" data-i18n="analytics.bar">長條圖</button>
                    </div>
                    <div class="analytics-buttons">
                        <button class="analytics-btn" id="analytics-refresh-btn" data-i18n="analytics.refresh">重新整理</button>
                        <button class="analytics-btn" id="analytics-export-btn" data-i18n="analytics.export">匯出數據</button>
                    </div>
                </div>

                <!-- 圖表區域 -->
                <div class="analytics-chart-section">
                    <h2 class="analytics-section-title" data-i18n="analytics.countryDistribution">國家分布</h2>
                    <div class="analytics-chart-container">
                        <canvas id="analytics-country-chart"></canvas>
                    </div>
                </div>

                <!-- 國家列表 -->
                <div class="analytics-list-section">
                    <h2 class="analytics-section-title" data-i18n="analytics.allCountries">所有國家</h2>
                    <div class="analytics-list-container">
                        <div class="analytics-list" id="analytics-country-list">
                            <p class="no-data" data-i18n="analytics.waitingData">等待訪客數據...</p>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    /**
     * 綁定事件
     */
    function bindEvents() {
        // 圖表類型切換
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                switchChartType(btn.dataset.type);
            });
        });

        // 重新整理按鈕
        const refreshBtn = document.getElementById('analytics-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshData);
        }

        // 匯出按鈕
        const exportBtn = document.getElementById('analytics-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportData);
        }
    }

    /**
     * 載入視圖
     */
    async function load() {
        if (typeof DebugUtils !== 'undefined') {
            DebugUtils.log('載入訪客分析視圖', 'AnalyticsView');
        }

        // 獲取容器
        container = document.getElementById('view-analytics');
        if (!container) {
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.error('找不到 analytics 視圖容器', 'AnalyticsView');
            } else {
                Logger.error('[AnalyticsView] 找不到 analytics 視圖容器');
            }
            return;
        }
        
        // 監聽語言變化事件（避免重複添加）
        if (!languageChangeHandler) {
            languageChangeHandler = handleLanguageChange;
            window.addEventListener('languageChanged', languageChangeHandler);
        }

        // 清空容器並創建視圖內容
        const containerInner = container.querySelector('.container');
        const viewHTML = createViewHTML();
        
        if (containerInner) {
            // 使用安全的 HTML 設置
            if (typeof DOMUtils !== 'undefined') {
                DOMUtils.safeSetHTML(containerInner, viewHTML);
            } else {
                containerInner.innerHTML = viewHTML; // 降級方案
            }
        } else {
            const wrapperHTML = `<div class="container">${viewHTML}</div>`;
            // 使用安全的 HTML 設置
            if (typeof DOMUtils !== 'undefined') {
                DOMUtils.safeSetHTML(container, wrapperHTML);
            } else {
                container.innerHTML = wrapperHTML; // 降級方案
            }
        }

        // 等待 DOM 更新
        await new Promise(resolve => setTimeout(resolve, 100));

        // 綁定事件
        bindEvents();

        // 先更新翻譯（確保文字正確顯示）
        if (typeof I18nModule !== 'undefined' && I18nModule.updateTranslations) {
            // 等待 I18nModule 準備好（如果 isReady 方法存在）
            if (typeof I18nModule.isReady === 'function') {
                let retries = 10;
                while (retries > 0 && !I18nModule.isReady()) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    retries--;
                }
            }
            I18nModule.updateTranslations();
        }

        // 載入數據
        try {
            // 從 VisitorAnalyticsModule 獲取數據
            if (typeof VisitorAnalyticsModule !== 'undefined') {
                countryStats = VisitorAnalyticsModule.getStats();
                totalVisitors = VisitorAnalyticsModule.getTotalVisitors();
                countryCount = Object.keys(countryStats).length;
            }

            // 更新顯示
            updateChart();
            updateCountryList();
            updateSummary();
        } catch (error) {
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.error('載入分析數據失敗:', 'AnalyticsView', error);
            } else {
                Logger.error('[AnalyticsView] 載入分析數據失敗:', error);
            }
        }

        // 滾動到頂部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 處理語言變化
     */
    async function handleLanguageChange() {
        // 檢查視圖是否當前顯示
        if (!container || container.style.display === 'none') {
            return;
        }
        
        if (typeof DebugUtils !== 'undefined') {
            DebugUtils.log('開始處理語言變化', 'AnalyticsView');
        }
        
        // 等待 I18nModule 準備好並更新翻譯
        if (typeof I18nModule !== 'undefined' && I18nModule.updateTranslations) {
            // 等待 I18nModule 準備好（如果 isReady 方法存在）
            if (typeof I18nModule.isReady === 'function') {
                let retries = 10;
                while (retries > 0 && !I18nModule.isReady()) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    retries--;
                }
            }
            
            // 確保當前語言的翻譯資料已載入
            const currentLang = I18nModule.getLanguage ? I18nModule.getLanguage() : 'zh-TW';
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.log(`當前語言: ${currentLang}`, 'AnalyticsView');
            }
            
            if (typeof I18nModule.loadLanguage === 'function') {
                try {
                    // 確保語言資料已載入
                    await I18nModule.loadLanguage(currentLang);
                    if (typeof DebugUtils !== 'undefined') {
                        DebugUtils.success('語言資料載入成功', 'AnalyticsView');
                    }
                } catch (error) {
                    if (typeof DebugUtils !== 'undefined') {
                        DebugUtils.warning('載入語言資料失敗:', 'AnalyticsView', error);
                    }
                }
            }
            
            // 確保語言切換完成，等待一小段時間讓翻譯資料完全載入
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // 驗證翻譯資料是否已正確載入
            const currentLangData = I18nModule.getLanguage ? I18nModule.getLanguage() : 'zh-TW';
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.log(`當前語言: ${currentLangData}`, 'AnalyticsView');
                
                // 測試翻譯功能是否正常
                const testTranslation = I18nModule.t('analytics.lastUpdate');
                DebugUtils.log(`測試翻譯 'analytics.lastUpdate': ${testTranslation || '翻譯失敗'}`, 'AnalyticsView');
                
                // 更新所有 data-i18n 屬性的翻譯
                DebugUtils.log('開始更新翻譯', 'AnalyticsView');
            }
            I18nModule.updateTranslations();
            
            // 再次等待，確保翻譯更新完成
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 額外確保容器內的所有元素都被更新（強制更新，不檢查當前文字）
            if (container) {
                // 先強制更新所有帶有 data-i18n 屬性的元素
                const containerElements = container.querySelectorAll('[data-i18n]');
                if (typeof DebugUtils !== 'undefined') {
                    DebugUtils.log(`找到 ${containerElements.length} 個需要翻譯的元素`, 'AnalyticsView');
                }
                containerElements.forEach(el => {
                    const key = el.getAttribute('data-i18n');
                    if (key && I18nModule.t) {
                        const text = I18nModule.t(key);
                        if (text) {
                            // 強制更新，不檢查當前文字是否相同
                            el.textContent = text;
                            if (typeof DebugUtils !== 'undefined') {
                                DebugUtils.log(`更新元素翻譯: ${key} = ${text}`, 'AnalyticsView');
                            }
                        } else {
                            if (typeof DebugUtils !== 'undefined') {
                                DebugUtils.warning(`找不到翻譯鍵: ${key}，當前語言: ${I18nModule.getLanguage ? I18nModule.getLanguage() : 'unknown'}`, 'AnalyticsView');
                            }
                        }
                    }
                });
                
                // 特別處理按鈕元素，確保它們的文字被正確更新（強制更新）
                const refreshBtn = container.querySelector('#analytics-refresh-btn');
                const exportBtn = container.querySelector('#analytics-export-btn');
                const chartTypeBtns = container.querySelectorAll('.chart-type-btn');
                const chartTypeLabel = container.querySelector('.chart-type-label');
                
                if (refreshBtn) {
                    // 確保 data-i18n 屬性存在
                    if (!refreshBtn.hasAttribute('data-i18n')) {
                        refreshBtn.setAttribute('data-i18n', 'analytics.refresh');
                    }
                    const refreshText = I18nModule.t('analytics.refresh');
                    if (refreshText) {
                        refreshBtn.textContent = refreshText;
                        if (typeof DebugUtils !== 'undefined') {
                            DebugUtils.log(`更新刷新按鈕: ${refreshText}`, 'AnalyticsView');
                        }
                    } else {
                        if (typeof DebugUtils !== 'undefined') {
                            DebugUtils.warning('刷新按鈕翻譯失敗: analytics.refresh', 'AnalyticsView');
                        }
                    }
                }
                
                if (exportBtn) {
                    // 確保 data-i18n 屬性存在
                    if (!exportBtn.hasAttribute('data-i18n')) {
                        exportBtn.setAttribute('data-i18n', 'analytics.export');
                    }
                    const exportText = I18nModule.t('analytics.export');
                    if (exportText) {
                        exportBtn.textContent = exportText;
                        if (typeof DebugUtils !== 'undefined') {
                            DebugUtils.log(`更新匯出按鈕: ${exportText}`, 'AnalyticsView');
                        }
                    } else {
                        if (typeof DebugUtils !== 'undefined') {
                            DebugUtils.warning('匯出按鈕翻譯失敗: analytics.export', 'AnalyticsView');
                        }
                    }
                }
                
                // 更新圖表類型標籤
                if (chartTypeLabel) {
                    // 確保 data-i18n 屬性存在
                    if (!chartTypeLabel.hasAttribute('data-i18n')) {
                        chartTypeLabel.setAttribute('data-i18n', 'analytics.chartType');
                    }
                    const labelText = I18nModule.t('analytics.chartType');
                    if (labelText) {
                        chartTypeLabel.textContent = labelText;
                        if (typeof DebugUtils !== 'undefined') {
                            DebugUtils.log(`更新圖表類型標籤: ${labelText}`, 'AnalyticsView');
                        }
                    } else {
                        if (typeof DebugUtils !== 'undefined') {
                            DebugUtils.warning('圖表類型標籤翻譯失敗: analytics.chartType', 'AnalyticsView');
                        }
                    }
                }
                
                // 更新圖表類型按鈕
                chartTypeBtns.forEach(btn => {
                    // 確保 data-i18n 屬性存在
                    const btnType = btn.getAttribute('data-type');
                    let expectedKey = '';
                    if (btnType === 'doughnut') {
                        expectedKey = 'analytics.doughnut';
                    } else if (btnType === 'bar') {
                        expectedKey = 'analytics.bar';
                    }
                    
                    if (expectedKey && !btn.hasAttribute('data-i18n')) {
                        btn.setAttribute('data-i18n', expectedKey);
                    }
                    
                    const key = btn.getAttribute('data-i18n');
                    if (key) {
                        const text = I18nModule.t(key);
                        if (text) {
                            btn.textContent = text;
                            if (typeof DebugUtils !== 'undefined') {
                                DebugUtils.log(`更新圖表類型按鈕: ${key} = ${text}`, 'AnalyticsView');
                            }
                        } else {
                            if (typeof DebugUtils !== 'undefined') {
                                DebugUtils.warning(`圖表類型按鈕翻譯失敗: ${key}`, 'AnalyticsView');
                            }
                        }
                    }
                });
                
                // 再次強制更新所有翻譯（最後一次確保）
                I18nModule.updateTranslations();
            }
        }
        
        // 再次等待一小段時間，確保翻譯資料已完全更新
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 強制再次更新所有翻譯（確保沒有遺漏）
        if (typeof I18nModule !== 'undefined' && I18nModule.updateTranslations) {
            I18nModule.updateTranslations();
        }
        
        // 再次等待一小段時間
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 重新更新圖表（因為圖表標籤和等待文字也需要翻譯）
        updateChart();
        
        // 重新更新國家列表（因為標題和等待文字需要翻譯）
        updateCountryList();
        
        // 重新更新摘要（確保所有文字都更新）
        updateSummary();
        
        if (typeof DebugUtils !== 'undefined') {
            DebugUtils.log('語言變化處理完成', 'AnalyticsView');
        }
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
        
        // 銷毀圖表實例（使用 AnalyticsChart 組件）
        if (typeof AnalyticsChart !== 'undefined' && AnalyticsChart.destroy) {
            AnalyticsChart.destroy();
        }

        // 清理事件監聽器
        const refreshBtn = document.getElementById('analytics-refresh-btn');
        const exportBtn = document.getElementById('analytics-export-btn');
        
        if (refreshBtn) {
            refreshBtn.replaceWith(refreshBtn.cloneNode(true));
        }
        if (exportBtn) {
            exportBtn.replaceWith(exportBtn.cloneNode(true));
        }

        if (typeof DebugUtils !== 'undefined') {
            DebugUtils.log('卸載訪客分析視圖', 'AnalyticsView');
        }
    }

    return {
        load,
        unload,
        handleLanguageChange
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.AnalyticsView = AnalyticsView;
}
