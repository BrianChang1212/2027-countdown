/**
 * 應用程式初始化腳本
 * 負責路由系統的初始化
 */

(function() {
    'use strict';

    /**
     * 等待所有腳本載入完成後再註冊路由
     */
    function initRouter() {
        if (typeof Router === 'undefined') {
            if (typeof Logger !== 'undefined') {
                Logger.error('Router 未定義', 'RouterInit');
            } else if (typeof DebugUtils !== 'undefined') {
                DebugUtils.error('Router 未定義', 'RouterInit');
            } else {
                Logger.error('[Router Init] Router 未定義');
            }
            return false;
        }

        // 檢查並註冊路由
        const routesToRegister = [
            { name: 'home', view: 'HomeView' },
            { name: 'prediction', view: 'PredictionView' },
            { name: 'news', view: 'NewsView' },
            { name: 'timeline', view: 'TimelineView' },
            { name: 'stats', view: 'StatsView' },
            { name: 'analytics', view: 'AnalyticsView' }
        ];

        let allRegistered = true;

        routesToRegister.forEach(({ name, view }) => {
            const viewModule = window[view];
            
            if (typeof Logger !== 'undefined') {
                Logger.debug(`檢查視圖模組: ${view}`, 'RouterInit');
                Logger.debug(`window[${view}] = ${typeof viewModule}`, 'RouterInit');
                
                if (typeof viewModule === 'undefined') {
                    // 列出所有 window 上的 View 相關變數
                    const viewVars = Object.keys(window).filter(key => key.includes('View'));
                    Logger.debug(`可用的 View 變數: ${viewVars.join(', ') || '無'}`, 'RouterInit');
                }
            }

            if (typeof viewModule !== 'undefined' && viewModule !== null) {
                Router.registerRoute(name, viewModule);
                if (typeof Logger !== 'undefined') {
                    Logger.success(`路由已註冊: ${name}`, 'RouterInit');
                }
            } else {
                if (typeof Logger !== 'undefined') {
                    Logger.error(`視圖模組 ${view} 未定義`, 'RouterInit');
                } else if (typeof DebugUtils !== 'undefined') {
                    DebugUtils.error(`視圖模組 ${view} 未定義`, 'RouterInit');
                } else {
                    Logger.error(`[Router Init] 視圖模組 ${view} 未定義`);
                }
                allRegistered = false;
            }
        });

        if (allRegistered) {
            // 初始化路由
            Router.init();
            return true;
        } else {
            if (typeof Logger !== 'undefined') {
                Logger.warn('部分路由未註冊，將重試...', 'RouterInit');
            }
            return false;
        }
    }

    /**
     * 確保所有腳本都已載入
     * @param {number} retries - 剩餘重試次數
     */
    function tryInitRouter(retries = 10) {
        if (retries <= 0) {
            const errorMsg = '路由初始化失敗：達到最大重試次數';
            if (typeof Logger !== 'undefined') {
                Logger.error(errorMsg, 'RouterInit');
            } else if (typeof DebugUtils !== 'undefined') {
                DebugUtils.error(errorMsg, 'RouterInit');
            } else {
                Logger.error('[Router Init]', errorMsg);
            }
            return;
        }

        const success = initRouter();
        if (!success) {
            setTimeout(() => tryInitRouter(retries - 1), 100);
        }
    }

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => tryInitRouter(), 300);
        });
    } else {
        setTimeout(() => tryInitRouter(), 300);
    }
})();

