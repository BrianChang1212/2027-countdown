/**
 * HTML 模板載入服務模組
 * 負責載入和管理 HTML 模板檔案
 */

const TemplateLoader = (function() {
    'use strict';

    // 模板快取
    const templateCache = new Map();

    /**
     * 載入模板檔案
     * @param {string} templatePath - 模板檔案路徑
     * @param {boolean} useCache - 是否使用快取（預設：true）
     * @returns {Promise<string>} 模板 HTML 內容
     */
    async function loadTemplate(templatePath, useCache = true) {
        // 檢查快取
        if (useCache && templateCache.has(templatePath)) {
            Logger.debug(`[TemplateLoader] 從快取載入模板: ${templatePath}`);
            return templateCache.get(templatePath);
        }

        try {
            const response = await fetch(templatePath);
            
            if (!response.ok) {
                throw new Error(`無法載入模板: ${response.status} ${response.statusText}`);
            }

            const html = await response.text();
            
            // 存入快取
            if (useCache) {
                templateCache.set(templatePath, html);
            }

            Logger.debug(`[TemplateLoader] 成功載入模板: ${templatePath}`);
            return html;
        } catch (error) {
            Logger.error(`[TemplateLoader] 載入模板失敗: ${templatePath}`, error);
            throw error;
        }
    }

    /**
     * 批量載入多個模板
     * @param {Array<string>} templatePaths - 模板檔案路徑陣列
     * @param {boolean} useCache - 是否使用快取
     * @returns {Promise<Object>} 模板路徑到內容的映射
     */
    async function loadTemplates(templatePaths, useCache = true) {
        const templates = {};
        
        try {
            await Promise.all(
                templatePaths.map(async (path) => {
                    templates[path] = await loadTemplate(path, useCache);
                })
            );
            
            Logger.debug(`[TemplateLoader] 成功載入 ${templatePaths.length} 個模板`);
            return templates;
        } catch (error) {
            Logger.error('[TemplateLoader] 批量載入模板失敗:', error);
            throw error;
        }
    }

    /**
     * 將模板插入到指定元素
     * @param {string|HTMLElement} target - 目標元素或選擇器
     * @param {string} templatePath - 模板檔案路徑
     * @param {string} position - 插入位置 ('beforebegin', 'afterbegin', 'beforeend', 'afterend')，預設為 'beforeend'
     * @param {boolean} useCache - 是否使用快取
     * @returns {Promise<HTMLElement>} 插入的元素
     */
    async function loadAndInsert(target, templatePath, position = 'beforeend', useCache = true) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        
        if (!element) {
            throw new Error(`找不到目標元素: ${target}`);
        }

        try {
            const html = await loadTemplate(templatePath, useCache);
            
            // 使用安全的 HTML 設置
            if (typeof DOMUtils !== 'undefined' && DOMUtils.safeSetHTML) {
                if (position === 'replace') {
                    DOMUtils.safeSetHTML(element, html);
                    return element;
                } else {
                    const temp = document.createElement('div');
                    DOMUtils.safeSetHTML(temp, html);
                    const fragment = document.createDocumentFragment();
                    Array.from(temp.childNodes).forEach(node => fragment.appendChild(node));
                    element.insertAdjacentElement(position, fragment.firstElementChild || fragment);
                    return fragment.firstElementChild || element;
                }
            } else {
                // 降級方案：使用 DOMParser
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                if (position === 'replace') {
                    element.innerHTML = '';
                    Array.from(doc.body.childNodes).forEach(node => {
                        element.appendChild(node.cloneNode(true));
                    });
                    return element;
                } else {
                    // 創建文檔片段並複製所有節點
                    const nodes = Array.from(doc.body.childNodes);
                    
                    if (position === 'beforebegin') {
                        nodes.forEach(node => {
                            element.parentNode.insertBefore(node.cloneNode(true), element);
                        });
                    } else if (position === 'afterbegin') {
                        // 反向插入以保持順序
                        for (let i = nodes.length - 1; i >= 0; i--) {
                            element.insertBefore(nodes[i].cloneNode(true), element.firstChild);
                        }
                    } else if (position === 'afterend') {
                        nodes.forEach(node => {
                            element.parentNode.insertBefore(node.cloneNode(true), element.nextSibling);
                        });
                    } else {
                        // beforeend (default)
                        nodes.forEach(node => {
                            element.appendChild(node.cloneNode(true));
                        });
                    }
                    
                    // 返回第一個插入的元素（如果存在）
                    const insertedElement = nodes.find(node => node.nodeType === 1); // Node.ELEMENT_NODE
                    return insertedElement ? element.querySelector(insertedElement.tagName) || element : element;
                }
            }
        } catch (error) {
            Logger.error(`[TemplateLoader] 載入並插入模板失敗: ${templatePath}`, error);
            throw error;
        }
    }

    /**
     * 清除模板快取
     * @param {string} templatePath - 可選，指定要清除的模板路徑，不提供則清除所有快取
     */
    function clearCache(templatePath = null) {
        if (templatePath) {
            templateCache.delete(templatePath);
            Logger.debug(`[TemplateLoader] 清除模板快取: ${templatePath}`);
        } else {
            templateCache.clear();
            Logger.debug('[TemplateLoader] 清除所有模板快取');
        }
    }

    /**
     * 取得模板快取大小
     * @returns {number} 快取的模板數量
     */
    function getCacheSize() {
        return templateCache.size;
    }

    return {
        loadTemplate,
        loadTemplates,
        loadAndInsert,
        clearCache,
        getCacheSize
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.TemplateLoader = TemplateLoader;
}

