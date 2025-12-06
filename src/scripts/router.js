/**
 * 路由管理模組
 * 處理頁面視圖切換和 Hash 路由
 */

const Router = (function() {
    'use strict';

    // Debug 函數（已禁用所有 debug 輸出）
    const debug = typeof DebugUtils !== 'undefined' ? DebugUtils : {
        log: () => {},
        success: () => {},
        warning: () => {},
        error: (msg) => Logger.error(`[Router] ❌ ${msg}`) // 僅輸出錯誤
    };

    // 當前路由狀態
    let currentRoute = 'home';
    let routes = {};
    let viewContainers = {};
    
    // DOM 元素緩存
    let progressBar = null;
    let progressFill = null;
    let sidebarItems = null;
    let viewContainersCache = {};

    /**
     * 註冊路由
     * @param {string} route - 路由名稱
     * @param {Function} viewModule - 視圖模組
     */
    function registerRoute(route, viewModule) {
        if (!viewModule) {
            debug.error(`嘗試註冊空的路由: ${route}`, 'Router');
            return;
        }
        routes[route] = viewModule;
        debug.log(`路由已註冊: ${route}`, 'Router');
        debug.log(`已註冊的路由列表: ${Object.keys(routes).join(', ')}`, 'Router');
    }

    /**
     * 獲取當前路由
     */
    function getCurrentRoute() {
        // 從 URL hash 獲取路由
        const hash = window.location.hash.slice(1) || 'home';
        return hash;
    }

    /**
     * 獲取進度條元素（緩存）
     */
    function getProgressElements() {
        if (!progressBar || !progressFill) {
            progressBar = document.getElementById('page-progress-bar');
            progressFill = progressBar?.querySelector('.page-progress-fill');
        }
        return { progressBar, progressFill };
    }

    /**
     * 顯示進度條
     */
    function showProgress() {
        const { progressBar: bar, progressFill: fill } = getProgressElements();
        
        if (bar && fill) {
            bar.classList.remove('complete');
            fill.style.width = '0%';
            bar.classList.add('active');
            
            // 開始進度動畫
            setTimeout(() => {
                if (fill) {
                    fill.style.width = '30%';
                }
            }, 50);
        }
    }
    
    /**
     * 更新進度條進度
     * @param {number} percent - 進度百分比 (0-100)
     */
    function updateProgress(percent) {
        const { progressFill: fill } = getProgressElements();
        if (fill) {
            fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
    }
    
    /**
     * 完成並隱藏進度條
     */
    function hideProgress() {
        const { progressBar: bar, progressFill: fill } = getProgressElements();
        if (bar && fill) {
            // 確保進度條到達 100%
            fill.style.width = '100%';
            bar.classList.add('complete');
            
            // 等待動畫完成後隱藏
            setTimeout(() => {
                const { progressBar: currentBar, progressFill: currentFill } = getProgressElements();
                if (currentBar && currentFill) {
                    currentBar.classList.remove('active', 'complete');
                    currentFill.style.width = '0%';
                }
            }, 400);
        }
    }

    /**
     * 獲取視圖容器（緩存）
     */
    function getViewContainer(route) {
        const cacheKey = `view-${route}`;
        if (!viewContainersCache[cacheKey]) {
            viewContainersCache[cacheKey] = document.getElementById(cacheKey);
        }
        return viewContainersCache[cacheKey];
    }

    /**
     * 切換到指定路由（使用節流防止快速切換）
     * @param {string} route - 路由名稱
     * @param {boolean} updateHash - 是否更新 URL hash
     */
    async function navigateTo(route, updateHash = true) {
        debug.log(`開始導航到路由: ${route}`, 'Router');
        debug.log(`參數: updateHash=${updateHash}, currentHash=${window.location.hash}`, 'Router');
        
        // 顯示進度條
        showProgress();
        
        if (!routes[route]) {
            debug.warning(`路由 ${route} 未註冊，切換到首頁`, 'Router');
            debug.log(`可用的路由: ${Object.keys(routes).join(', ')}`, 'Router');
            route = 'home'; // 預設回到首頁
        }

        // 更新 URL hash（如果需要）
        if (updateHash) {
            const newHash = `#${route}`;
            if (window.location.hash !== newHash) {
                window.location.hash = newHash;
            }
        }
        
        // 更新進度到 30%
        updateProgress(30);

        // 在隱藏所有視圖之前，調用當前視圖的 unload 方法
        const currentViewModule = routes[currentRoute];
        if (currentViewModule && typeof currentViewModule.unload === 'function') {
            try {
                debug.log(`卸載視圖: ${currentRoute}`, 'Router');
                currentViewModule.unload();
                debug.success(`視圖已卸載: ${currentRoute}`, 'Router');
            } catch (error) {
                debug.error(`卸載視圖 ${currentRoute} 失敗: ${error.message}`, 'Router');
            }
        }

        // 更新進度到 40%
        updateProgress(40);

        // 隱藏所有視圖
        hideAllViews();
        
        // 更新進度到 60%
        updateProgress(60);

        // 顯示目標視圖（使用緩存）
        const viewContainer = getViewContainer(route);
        debug.log(`尋找視圖容器: view-${route}`, 'Router');
        
        if (viewContainer) {
            debug.success(`找到視圖容器: view-${route}`, 'Router');
            viewContainer.style.display = 'block';
            viewContainer.classList.add('active');
            
            // 滾動到頂部
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // 更新進度到 70%
            updateProgress(70);
            
            // 觸發視圖載入
            if (routes[route] && typeof routes[route].load === 'function') {
                try {
                    debug.log(`開始載入視圖模組: ${route}`, 'Router');
                    updateProgress(80);
                    await routes[route].load();
                    debug.success(`視圖模組載入完成: ${route}`, 'Router');
                    updateProgress(95);
                } catch (error) {
                    debug.error(`載入視圖 ${route} 失敗: ${error.message}`, 'Router');
                    updateProgress(95);
                }
            } else {
                debug.warning(`視圖 ${route} 沒有 load 方法或未定義`, 'Router');
                updateProgress(95);
            }
        } else {
            debug.error(`視圖容器 view-${route} 未找到`, 'Router');
            // 如果找不到視圖容器，嘗試顯示首頁（使用緩存）
            if (route !== 'home') {
                const homeContainer = getViewContainer('home');
                if (homeContainer) {
                    debug.warning(`切換到首頁作為備用`, 'Router');
                    homeContainer.style.display = 'block';
                    homeContainer.classList.add('active');
                    route = 'home';
                }
            }
        }

        currentRoute = route;

        // 更新選單高亮
        updateMenuActive(route);

        // 觸發路由變更事件
        window.dispatchEvent(new CustomEvent('routeChange', { detail: { route } }));
        
        // 完成進度條動畫
        hideProgress();
        
        debug.success(`路由切換完成: ${route}`, 'Router');
    }

    /**
     * 隱藏所有視圖
     */
    function hideAllViews() {
        document.querySelectorAll('.view-container').forEach(container => {
            container.style.display = 'none';
            container.classList.remove('active');
        });
    }

    /**
     * 獲取選單項目（緩存）
     */
    function getSidebarItems() {
        if (!sidebarItems) {
            sidebarItems = document.querySelectorAll('.sidebar-item');
        }
        return sidebarItems;
    }

    /**
     * 更新選單高亮狀態
     * @param {string} route - 當前路由
     */
    function updateMenuActive(route) {
        const items = getSidebarItems();
        items.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.route === route) {
                item.classList.add('active');
            }
        });
    }

    /**
     * 處理 Hash 變更（使用節流防止快速切換）
     */
    let hashChangeThrottle = null;
    function handleHashChange() {
        const route = getCurrentRoute();
        debug.log(`Hash 變更事件觸發: ${route}`, 'Router');
        
        // 使用節流防止快速切換
        if (typeof Helpers !== 'undefined' && Helpers.throttle) {
            if (!hashChangeThrottle) {
                hashChangeThrottle = Helpers.throttle((r) => {
                    navigateTo(r, false);
                }, 300);
            }
            hashChangeThrottle(route);
        } else {
            navigateTo(route, false);
        }
    }

    /**
     * 初始化路由系統
     */
    function init() {
        debug.log('開始初始化路由系統', 'Router');
        
        // 監聽 hash 變更
        window.addEventListener('hashchange', handleHashChange);
        debug.log('已註冊 hashchange 事件監聽器', 'Router');

        // 初始化當前路由
        function doInit() {
            const initialRoute = getCurrentRoute();
            debug.log(`初始化路由: ${initialRoute}`, 'Router');
            debug.log(`已註冊的路由: ${Object.keys(routes).join(', ')}`, 'Router');
            
            // 檢查視圖容器
            const containers = {
                'view-home': !!document.getElementById('view-home'),
                'view-prediction': !!document.getElementById('view-prediction'),
                'view-news': !!document.getElementById('view-news'),
                'view-timeline': !!document.getElementById('view-timeline'),
                'view-stats': !!document.getElementById('view-stats'),
                'view-analytics': !!document.getElementById('view-analytics')
            };
            
            debug.log(`視圖容器檢查: ${JSON.stringify(containers)}`, 'Router');
            
            const missing = Object.entries(containers).filter(([_, exists]) => !exists);
            if (missing.length > 0) {
                debug.warning(`缺少視圖容器: ${missing.map(([name]) => name).join(', ')}`, 'Router');
            }
            
            navigateTo(initialRoute, false);
        }

        // 等待 DOM 完全載入後再初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(doInit, 50);
            });
        } else {
            // DOM 已載入，延遲一點確保所有視圖容器都已存在
            setTimeout(doInit, 100);
        }

        debug.success('路由系統初始化完成', 'Router');
    }

    // 公開 API
    return {
        init,
        registerRoute,
        navigateTo,
        getCurrentRoute: () => currentRoute
    };
})();

