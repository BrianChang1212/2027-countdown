/**
 * 首頁視圖模組
 * 顯示倒數計時和主要內容
 * 使用模板系統動態載入各個 section
 */

const HomeView = (function() {
    'use strict';

    let templatesLoaded = false;

    /**
     * 檢查是否應該使用模板系統
     */
    function shouldUseTemplates() {
        // 在 file:// 協議下，無法使用 fetch 載入模板，跳過模板系統
        if (window.location.protocol === 'file:') {
            return false;
        }
        
        // 檢查容器是否已有內容（如果 HTML 中已有內容，不需要載入模板）
        const container = document.querySelector('#view-home .container');
        if (container && container.children.length > 0) {
            return false;
        }
        
        return true;
    }

    /**
     * 載入首頁模板
     */
    async function loadTemplates() {
        // 如果已經載入過，跳過
        if (templatesLoaded) {
            return true;
        }

        // 檢查是否應該使用模板系統
        if (!shouldUseTemplates()) {
            // 容器已有內容或 file:// 協議，跳過模板載入
            templatesLoaded = true;
            return true;
        }

        // 檢查容器是否存在
        const container = document.querySelector('#view-home .container');
        if (!container) {
            if (typeof Logger !== 'undefined') {
                Logger.error('[HomeView] 找不到 #view-home .container 容器');
            }
            return false;
        }

        // 使用模板初始化服務載入首頁模板
        if (typeof TemplateInitializer !== 'undefined') {
            try {
                const success = await TemplateInitializer.initHomeTemplates();
                if (success) {
                    templatesLoaded = true;
                    
                    // 更新翻譯（如果有 i18n 模組）
                    if (typeof I18nModule !== 'undefined' && I18nModule.updateTranslations) {
                        I18nModule.updateTranslations(container);
                    }

                    if (typeof Logger !== 'undefined') {
                        Logger.debug('[HomeView] 首頁模板載入成功');
                    }
                    return true;
                } else {
                    if (typeof Logger !== 'undefined') {
                        Logger.warn('[HomeView] 部分首頁模板載入失敗');
                    }
                    return false;
                }
            } catch (error) {
                if (typeof Logger !== 'undefined') {
                    Logger.error('[HomeView] 載入首頁模板時發生錯誤:', error);
                }
                return false;
            }
        } else {
            if (typeof Logger !== 'undefined') {
                Logger.warn('[HomeView] TemplateInitializer 未定義，無法載入模板');
            }
            return false;
        }
    }

    /**
     * 載入視圖
     */
    async function load() {
        if (typeof Logger !== 'undefined') {
            Logger.debug('[HomeView] 開始載入首頁視圖...');
        }

        // 載入首頁模板
        await loadTemplates();
        
        // 觸發滾動到頂部
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (typeof Logger !== 'undefined') {
            Logger.debug('[HomeView] 首頁視圖載入完成');
        }
    }

    /**
     * 卸載視圖
     */
    function unload() {
        // 清理工作（如果需要）
        // 注意：我們不清理模板內容，因為用戶可能會再次訪問首頁
    }

    /**
     * 重新載入模板（用於強制刷新）
     */
    async function reload() {
        templatesLoaded = false;
        const container = document.querySelector('#view-home .container');
        if (container) {
            container.innerHTML = '';
        }
        await load();
    }

    return {
        load,
        unload,
        reload,
        loadTemplates
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.HomeView = HomeView;
}

