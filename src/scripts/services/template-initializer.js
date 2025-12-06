/**
 * 模板初始化服務
 * 負責在頁面載入時自動載入必需的模板
 */

const TemplateInitializer = (function() {
    'use strict';

    // 模板載入配置
    const templateConfig = {
        // 全局 UI 模板（必須立即載入）
        layout: [
            { path: 'src/templates/layout/sidebar.html', target: 'body', position: 'afterbegin' },
            { path: 'src/templates/layout/toolbar.html', target: 'body', position: 'afterbegin' },
            { path: 'src/templates/layout/loader.html', target: 'body', position: 'afterbegin' },
            { path: 'src/templates/layout/language-dropdown.html', target: 'body', position: 'beforeend' },
            { path: 'src/templates/layout/news-ticker.html', target: 'body', position: 'beforeend' }
        ],
        // 首頁 section 模板
        home: [
            { path: 'src/templates/sections/header.html', target: '#view-home .container', position: 'afterbegin' },
            { path: 'src/templates/sections/countdown-section.html', target: '#view-home .container', position: 'beforeend' },
            { path: 'src/templates/sections/target-date.html', target: '#view-home .container', position: 'beforeend' },
            { path: 'src/templates/sections/separation-counter-section.html', target: '#view-home .container', position: 'beforeend' },
            { path: 'src/templates/sections/prediction-section.html', target: '#view-home .container', position: 'beforeend' },
            { path: 'src/templates/sections/stats-section.html', target: '#view-home .container', position: 'beforeend' },
            { path: 'src/templates/sections/military-section.html', target: '#view-home .container', position: 'beforeend' },
            { path: 'src/templates/sections/economy-section.html', target: '#view-home .container', position: 'beforeend' },
            { path: 'src/templates/sections/worldclock-section.html', target: '#view-home .container', position: 'beforeend' },
            { path: 'src/templates/sections/timeline-section.html', target: '#view-home .container', position: 'beforeend' },
            { path: 'src/templates/sections/news-section.html', target: '#view-home .container', position: 'beforeend' },
            { path: 'src/templates/sections/share-section.html', target: '#view-home .container', position: 'beforeend' },
            { path: 'src/templates/sections/visitor-stats-section.html', target: '#view-home .container', position: 'beforeend' },
            { path: 'src/templates/sections/visitor-analytics-section.html', target: '#view-home .container', position: 'beforeend' },
            { path: 'src/templates/sections/footer.html', target: '#view-home .container', position: 'beforeend' }
        ]
    };

    /**
     * 載入單個模板
     * @param {string} templatePath - 模板路徑
     * @param {string} target - 目標選擇器
     * @param {string} position - 插入位置
     * @returns {Promise<boolean>}
     */
    async function loadTemplate(templatePath, target, position = 'beforeend') {
        try {
            if (typeof TemplateLoader === 'undefined') {
                if (typeof Logger !== 'undefined') {
                    Logger.error('[TemplateInitializer] TemplateLoader 未定義', 'TemplateInitializer');
                }
                return false;
            }

            await TemplateLoader.loadAndInsert(target, templatePath, position);
            if (typeof Logger !== 'undefined') {
                Logger.debug(`[TemplateInitializer] 成功載入模板: ${templatePath}`);
            }
            return true;
        } catch (error) {
            if (typeof Logger !== 'undefined') {
                Logger.error(`[TemplateInitializer] 載入模板失敗: ${templatePath}`, error);
            }
            return false;
        }
    }

    /**
     * 批量載入模板
     * @param {Array} templates - 模板配置陣列
     * @returns {Promise<number>} 成功載入的模板數量
     */
    async function loadTemplates(templates) {
        let successCount = 0;
        
        for (const template of templates) {
            const success = await loadTemplate(template.path, template.target, template.position || 'beforeend');
            if (success) {
                successCount++;
            }
            // 添加小延遲避免過多並發請求
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return successCount;
    }

    /**
     * 初始化全局 UI 模板
     * @returns {Promise<boolean>}
     */
    async function initLayoutTemplates() {
        if (typeof Logger !== 'undefined') {
            Logger.debug('[TemplateInitializer] 開始載入全局 UI 模板...');
        }
        
        const successCount = await loadTemplates(templateConfig.layout);
        const totalCount = templateConfig.layout.length;
        
        if (successCount === totalCount) {
            if (typeof Logger !== 'undefined') {
                Logger.debug(`[TemplateInitializer] 成功載入所有全局 UI 模板 (${successCount}/${totalCount})`);
            }
            return true;
        } else {
            if (typeof Logger !== 'undefined') {
                Logger.warn(`[TemplateInitializer] 部分全局 UI 模板載入失敗 (${successCount}/${totalCount})`);
            }
            return false;
        }
    }

    /**
     * 初始化首頁 section 模板
     * @returns {Promise<boolean>}
     */
    async function initHomeTemplates() {
        if (typeof Logger !== 'undefined') {
            Logger.debug('[TemplateInitializer] 開始載入首頁 section 模板...');
        }
        
        // 確保容器存在
        const container = document.querySelector('#view-home .container');
        if (!container) {
            if (typeof Logger !== 'undefined') {
                Logger.warn('[TemplateInitializer] 找不到 #view-home .container，跳過首頁模板載入');
            }
            return false;
        }
        
        const successCount = await loadTemplates(templateConfig.home);
        const totalCount = templateConfig.home.length;
        
        if (successCount === totalCount) {
            if (typeof Logger !== 'undefined') {
                Logger.debug(`[TemplateInitializer] 成功載入所有首頁 section 模板 (${successCount}/${totalCount})`);
            }
            return true;
        } else {
            if (typeof Logger !== 'undefined') {
                Logger.warn(`[TemplateInitializer] 部分首頁 section 模板載入失敗 (${successCount}/${totalCount})`);
            }
            return false;
        }
    }

    /**
     * 初始化所有模板
     * @param {Object} options - 選項
     * @param {boolean} options.loadLayout - 是否載入全局 UI 模板
     * @param {boolean} options.loadHome - 是否載入首頁模板
     * @returns {Promise<boolean>}
     */
    async function init(options = {}) {
        const { loadLayout = true, loadHome = true } = options;
        
        if (typeof Logger !== 'undefined') {
            Logger.debug('[TemplateInitializer] 開始初始化模板系統...');
        }
        
        let allSuccess = true;
        
        // 載入全局 UI 模板
        if (loadLayout) {
            const layoutSuccess = await initLayoutTemplates();
            allSuccess = allSuccess && layoutSuccess;
        }
        
        // 載入首頁模板
        if (loadHome) {
            const homeSuccess = await initHomeTemplates();
            allSuccess = allSuccess && homeSuccess;
        }
        
        if (typeof Logger !== 'undefined') {
            if (allSuccess) {
                Logger.debug('[TemplateInitializer] 所有模板初始化完成');
            } else {
                Logger.warn('[TemplateInitializer] 部分模板初始化失敗');
            }
        }
        
        return allSuccess;
    }

    return {
        init,
        initLayoutTemplates,
        initHomeTemplates,
        loadTemplate,
        loadTemplates
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.TemplateInitializer = TemplateInitializer;
}

