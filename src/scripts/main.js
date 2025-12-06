/**
 * 應用程式主入口
 * 負責初始化所有模組並協調它們之間的通訊
 */

const App = (function() {
    'use strict';

    // 應用程式狀態
    const state = {
        initialized: false,
        modules: {
            i18n: false,
            countdown: false,
            news: false,
            polymarket: false
        }
    };

    /**
     * 記錄模組初始化狀態
     * @param {string} moduleName - 模組名稱
     */
    function moduleReady(moduleName) {
        state.modules[moduleName] = true;
        checkAllModulesReady();
    }

    /**
     * 檢查所有模組是否已就緒
     */
    function checkAllModulesReady() {
        const allReady = Object.values(state.modules).every(ready => ready);
        if (allReady && !state.initialized) {
            state.initialized = true;
            onAppReady();
        }
    }

    /**
     * 應用程式完全就緒後執行
     */
    function onAppReady() {
        if (typeof DebugUtils !== 'undefined') {
            DebugUtils.success('應用程式已完全載入', 'App');
        }
        
        // 移除載入畫面 (如果有的話)
        const loader = document.querySelector('.app-loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => loader.remove(), 500);
        }

        // 觸發自訂事件
        window.dispatchEvent(new CustomEvent('appReady'));
    }

    /**
     * 全域錯誤處理
     */
    function setupErrorHandling() {
        window.addEventListener('error', (event) => {
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.error('全域錯誤:', 'App', event.error);
            } else {
                Logger.error('[App] 全域錯誤:', event.error);
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.error('未處理的 Promise 拒絕:', 'App', event.reason);
            } else {
                Logger.error('[App] 未處理的 Promise 拒絕:', event.reason);
            }
        });
    }

    /**
     * 效能監控
     */
    function logPerformance() {
        if (typeof CONFIG !== 'undefined' && CONFIG.DEBUG) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const timing = performance.timing;
                    const loadTime = timing.loadEventEnd - timing.navigationStart;
                    if (typeof DebugUtils !== 'undefined') {
                        DebugUtils.log(`頁面載入時間: ${loadTime}ms`, 'App');
                    }
                }, 0);
            });
        }
    }

    /**
     * 初始化應用程式
     */
    function init() {
        if (typeof DebugUtils !== 'undefined') {
            DebugUtils.log('應用程式啟動中...', 'App');
        }
        
        setupErrorHandling();
        logPerformance();

        // 標記簡單模組為就緒 (它們會自行初始化)
        // 這裡可以擴展為更複雜的模組載入邏輯
        setTimeout(() => {
            if (typeof I18nModule !== 'undefined') moduleReady('i18n');
            if (typeof CountdownModule !== 'undefined' || document.getElementById('days')) moduleReady('countdown');
            if (typeof NewsModule !== 'undefined') moduleReady('news');
            if (typeof PolymarketModule !== 'undefined') moduleReady('polymarket');
            // 訪客統計模組會自行初始化，不需要等待
            if (typeof VisitorCounterModule !== 'undefined' && typeof DebugUtils !== 'undefined') {
                DebugUtils.success('訪客計數器模組已載入', 'App');
            }
            if (typeof VisitorAnalyticsModule !== 'undefined' && typeof DebugUtils !== 'undefined') {
                DebugUtils.success('訪客分析模組已載入', 'App');
            }
        }, 100);
    }

    // DOM 載入完成後初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 公開 API
    return {
        getState: () => ({ ...state }),
        moduleReady,
        isReady: () => state.initialized
    };
})();

