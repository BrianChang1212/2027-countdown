/**
 * 側邊選單模組
 * 處理選單顯示、收合和導航
 */

const SidebarModule = (function() {
    'use strict';

    // Debug 函數（如果 DebugUtils 可用）
    const debug = typeof DebugUtils !== 'undefined' ? DebugUtils : {
        log: (msg) => Logger.debug(`[Sidebar] ${msg}`),
        success: (msg) => Logger.debug(`[Sidebar] ✅ ${msg}`),
        warning: (msg) => Logger.warn(`[Sidebar] ⚠️ ${msg}`),
        error: (msg) => Logger.error(`[Sidebar] ❌ ${msg}`)
    };

    let sidebar = null;
    let sidebarToggle = null;
    let mobileSidebarToggle = null;
    let sidebarOverlay = null;
    let isCollapsed = false;
    let isMobile = false;

    /**
     * 檢查是否為行動裝置
     */
    function checkMobile() {
        const wasMobile = isMobile;
        const currentWidth = window.innerWidth;
        isMobile = currentWidth < 768;
        
        if (isMobile && !wasMobile) {
            // 切換到手機版
            sidebar?.classList.add('mobile');
            sidebar?.classList.remove('collapsed');
            sidebar?.classList.remove('mobile-open');
            // 關閉 overlay 並恢復 body 滾動
            sidebarOverlay?.classList.remove('active');
            document.body.style.overflow = '';
        } else if (!isMobile && wasMobile) {
            // 切換到桌面版
            sidebar?.classList.remove('mobile');
            sidebar?.classList.remove('mobile-open');
            sidebarOverlay?.classList.remove('active');
            document.body.style.overflow = '';
            // 恢復儲存的收合狀態
            loadSavedState();
        }
    }

    /**
     * 切換選單收合狀態
     */
    function toggleSidebar() {
        if (isMobile) {
            // 手機版：切換顯示/隱藏
            const isOpen = sidebar?.classList.contains('mobile-open');
            if (isOpen) {
                sidebar?.classList.remove('mobile-open');
                sidebarOverlay?.classList.remove('active');
                // 防止 body 滾動
                document.body.style.overflow = '';
            } else {
                sidebar?.classList.add('mobile-open');
                sidebarOverlay?.classList.add('active');
                // 防止背景滾動
                document.body.style.overflow = 'hidden';
            }
        } else {
            // 桌面版：切換收合/展開
            isCollapsed = !isCollapsed;
            sidebar?.classList.toggle('collapsed');
            // 儲存狀態
            localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
        }
    }
    
    /**
     * 關閉手機版選單
     */
    function closeMobileSidebar() {
        if (isMobile && sidebar?.classList.contains('mobile-open')) {
            sidebar?.classList.remove('mobile-open');
            sidebarOverlay?.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * 處理選單項目點擊
     * @param {Event} e - 點擊事件
     */
    function handleMenuItemClick(e) {
        e.preventDefault(); // 阻止預設的連結行為
        
        const item = e.currentTarget;
        const route = item.dataset.route;

        debug.log(`選單項目點擊: ${route}`, 'Sidebar');

        if (route) {
            // 確保 Router 已載入
            if (typeof Router !== 'undefined' && Router.navigateTo) {
                debug.log(`調用 Router.navigateTo(${route})`, 'Sidebar');
                Router.navigateTo(route);
            } else {
                debug.warning(`Router 未載入，使用 hash 變更: ${route}`, 'Sidebar');
                // 如果 Router 還沒載入，使用 hash 變更
                window.location.hash = route;
            }
        } else {
            debug.error(`選單項目沒有 data-route 屬性`, 'Sidebar');
        }

        // 手機版：點擊後關閉選單
        if (isMobile) {
            closeMobileSidebar();
            debug.log('手機版：關閉選單', 'Sidebar');
        }
    }

    /**
     * 初始化選單項目
     */
    function initMenuItems() {
        const menuItems = document.querySelectorAll('.sidebar-item');
        menuItems.forEach(item => {
            item.addEventListener('click', handleMenuItemClick);
        });
    }

    /**
     * 載入儲存的選單狀態
     */
    function loadSavedState() {
        if (!isMobile) {
            const saved = localStorage.getItem('sidebarCollapsed');
            if (saved === 'true') {
                isCollapsed = true;
                sidebar?.classList.add('collapsed');
            }
        }
    }

    /**
     * 處理視窗大小變更
     */
    function handleResize() {
        // 使用防抖處理，避免頻繁觸發
        clearTimeout(handleResize.timeout);
        handleResize.timeout = setTimeout(() => {
            checkMobile();
        }, 150);
    }

    /**
     * 初始化側邊選單
     */
    function init() {
        sidebar = document.getElementById('sidebar');
        sidebarToggle = document.getElementById('sidebar-toggle');
        mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
        sidebarOverlay = document.getElementById('sidebar-overlay');

        if (!sidebar) {
            Logger.warn('側邊選單元素未找到');
            return;
        }

        // 檢查裝置類型
        checkMobile();

        // 載入儲存的狀態
        loadSavedState();

        // 初始化選單項目
        initMenuItems();

        // 綁定側邊欄內部的切換按鈕（桌面版）
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', toggleSidebar);
        }

        // 綁定工具列中的手機版切換按鈕
        if (mobileSidebarToggle) {
            mobileSidebarToggle.addEventListener('click', toggleSidebar);
        }

        // 綁定遮罩層點擊關閉
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', closeMobileSidebar);
        }

        // 監聽視窗大小變更
        window.addEventListener('resize', handleResize);
        
        // 監聽 ESC 鍵關閉手機版選單
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMobile && sidebar?.classList.contains('mobile-open')) {
                closeMobileSidebar();
            }
        });

        debug.success('側邊選單模組已初始化', 'Sidebar');
    }

    // DOM 載入完成後初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

    // 公開 API
    return {
        init,
        toggle: toggleSidebar,
        close: closeMobileSidebar,
        isCollapsed: () => isCollapsed,
        isMobile: () => isMobile
    };
})();

