/**
 * 安全的 DOM 操作工具函數庫
 * 提供防止 XSS 攻擊的安全 DOM 操作方法
 */

const DOMUtils = (function () {
    'use strict';

    // 允許的 HTML 標籤和屬性白名單
    const ALLOWED_TAGS = {
        'p': ['class'],
        'div': ['class', 'id', 'style'],
        'span': ['class', 'style'],
        'a': ['href', 'target', 'rel', 'class'],
        'h1': ['class'],
        'h2': ['class'],
        'h3': ['class'],
        'h4': ['class'],
        'h5': ['class'],
        'h6': ['class'],
        'strong': [],
        'em': [],
        'b': [],
        'i': [],
        'br': [],
        'ul': ['class'],
        'ol': ['class'],
        'li': ['class'],
        'article': ['class'],
        'section': ['class'],
        'header': ['class'],
        'footer': ['class'],
        'canvas': ['id', 'class', 'width', 'height'],
        'button': ['id', 'class', 'type', 'title', 'data-type', 'data-filter', 'data-category'],
        'input': ['type', 'id', 'class', 'placeholder'],
        'select': ['id', 'class'],
        'option': ['value'],
        'label': ['for', 'class'],
        'svg': ['viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'class', 'width', 'height'],
        'path': ['d', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill'],
        'polyline': ['points', 'stroke', 'stroke-width'],
        'circle': ['cx', 'cy', 'r', 'fill', 'stroke'],
        'rect': ['x', 'y', 'width', 'height', 'fill', 'stroke'],
        'g': ['class'],
        'text': ['x', 'y', 'fill', 'class']
    };

    // 不安全的屬性（絕對禁止）
    const UNSAFE_ATTRIBUTES = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'javascript:', 'data:'];

    /**
     * 清理 HTML 字串，移除潛在的 XSS 攻擊代碼
     * @param {string} html - 原始 HTML 字串
     * @param {Object} options - 選項
     * @param {boolean} options.allowAllTags - 是否允許所有標籤（不推薦）
     * @returns {string} 清理後的 HTML 字串
     */
    function sanitizeHTML(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        // 移除 script 標籤和事件處理器
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        html = html.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
        html = html.replace(/on\w+\s*=\s*[^\s>]+/gi, '');

        // 移除 javascript: 和 data: URL
        html = html.replace(/javascript:/gi, '');
        html = html.replace(/data:text\/html/gi, '');

        // 移除 style 標籤中的危險內容
        html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

        // 移除 iframe、embed、object 等危險標籤（但保留 input、form 等安全標籤）
        html = html.replace(/<\/?(iframe|embed|object|meta|link|base)[^>]*>/gi, '');

        // 使用 DOMParser 解析並清理
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // 遞迴清理所有節點
            function cleanNode(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node;
                }

                if (node.nodeType === Node.ELEMENT_NODE) {
                    const tagName = node.tagName.toLowerCase();

                    // 檢查標籤是否在白名單中
                    if (!ALLOWED_TAGS[tagName]) {
                        // 如果不在白名單中，返回其子節點的文本內容
                        const fragment = document.createDocumentFragment();
                        Array.from(node.childNodes).forEach(child => {
                            if (child.nodeType === Node.TEXT_NODE) {
                                fragment.appendChild(child.cloneNode(true));
                            } else if (child.nodeType === Node.ELEMENT_NODE) {
                                const cleaned = cleanNode(child);
                                if (cleaned) {
                                    fragment.appendChild(cleaned);
                                }
                            }
                        });
                        return fragment.childNodes.length > 0 ? fragment : null;
                    }

                    // 創建清理後的元素
                    const cleanElement = document.createElement(tagName);

                    // 只保留白名單中的屬性
                    const allowedAttrs = ALLOWED_TAGS[tagName] || [];
                    Array.from(node.attributes).forEach(attr => {
                        const attrName = attr.name.toLowerCase();

                        // 檢查是否為允許的屬性（允許 data-* 屬性用於數據綁定）
                        if (allowedAttrs.includes(attrName) || attrName === 'data-i18n' || attrName === 'data-i18n-placeholder' || attrName.startsWith('data-')) {
                            let attrValue = attr.value;

                            // 檢查屬性值是否包含危險內容
                            let isUnsafe = UNSAFE_ATTRIBUTES.some(unsafe =>
                                attrValue.toLowerCase().includes(unsafe)
                            );

                            // 特別檢查 style 屬性
                            if (!isUnsafe && attrName === 'style') {
                                if (attrValue.toLowerCase().match(/(javascript:|expression|url\(|alert\()/)) {
                                    isUnsafe = true;
                                }
                            }

                            if (!isUnsafe) {
                                // 對於 href 屬性，只允許 http/https 協議
                                if (attrName === 'href') {
                                    if (attrValue.match(/^(https?:\/\/|#|\/|mailto:)/i)) {
                                        cleanElement.setAttribute(attrName, attrValue);
                                    }
                                } else if (attrName === 'target') {
                                    // 只允許 _blank 或 _self
                                    if (attrValue === '_blank' || attrValue === '_self') {
                                        cleanElement.setAttribute(attrName, attrValue);
                                        // 如果是 _blank，自動添加 noopener noreferrer
                                        if (attrValue === '_blank') {
                                            cleanElement.setAttribute('rel', 'noopener noreferrer');
                                        }
                                    }
                                } else {
                                    cleanElement.setAttribute(attrName, attrValue);
                                }
                            }
                        }
                    });

                    // 遞迴清理子節點
                    Array.from(node.childNodes).forEach(child => {
                        const cleaned = cleanNode(child);
                        if (cleaned) {
                            if (cleaned.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                                Array.from(cleaned.childNodes).forEach(n => {
                                    cleanElement.appendChild(n);
                                });
                            } else {
                                cleanElement.appendChild(cleaned);
                            }
                        }
                    });

                    return cleanElement;
                }

                return null;
            }

            // 清理 body 中的所有子節點
            const fragment = document.createDocumentFragment();
            Array.from(doc.body.childNodes).forEach(child => {
                const cleaned = cleanNode(child);
                if (cleaned) {
                    if (cleaned.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                        Array.from(cleaned.childNodes).forEach(n => {
                            fragment.appendChild(n);
                        });
                    } else {
                        fragment.appendChild(cleaned);
                    }
                }
            });

            // 將清理後的內容轉換為 HTML 字串
            const container = document.createElement('div');
            container.appendChild(fragment);
            const result = container.innerHTML;

            // 調試：如果結果為空但原始 HTML 不為空，記錄警告
            if (!result && html && html.trim().length > 0) {
                Logger.warn('[DOMUtils] 清理後的 HTML 為空，原始長度:', html.length);
            }

            return result;

        } catch (error) {
            // 如果解析失敗，記錄錯誤但返回原始 HTML（不進行轉義，避免內容丟失）
            Logger.warn('[DOMUtils] HTML 清理失敗，使用原始 HTML:', error.message);
            // 只移除最危險的內容
            const minimalClean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            return minimalClean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
        }
    }

    /**
     * HTML 實體轉義
     * @param {string} text - 要轉義的文字
     * @returns {string} 轉義後的文字
     */
    function escapeHTML(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * 安全地設置元素的 HTML 內容
     * @param {HTMLElement} element - 目標元素
     * @param {string} html - HTML 字串
     * @param {Object} options - 選項
     * @param {boolean} options.sanitize - 是否清理 HTML（預設 true）
     */
    function safeSetHTML(element, html, options = {}) {
        if (!element || !(element instanceof HTMLElement)) {
            Logger.error('[DOMUtils] safeSetHTML: 無效的元素');
            return;
        }

        const { sanitize = true } = options;

        if (sanitize) {
            element.innerHTML = sanitizeHTML(html);
        } else {
            // 即使不清理，也要移除最危險的內容（寬鬆清理模式）
            let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
            element.innerHTML = cleaned;

            // 調試：如果設置後為空但原始不為空，記錄警告
            if (!element.innerHTML && html && html.trim().length > 0) {
                Logger.warn('[DOMUtils] 寬鬆清理後 HTML 為空！原始長度:', html.length);
                // 降級：直接設置原始 HTML
                element.innerHTML = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            }
        }
    }

    /**
     * 安全地創建 DOM 元素
     * @param {string} tag - 標籤名稱
     * @param {Object} attrs - 屬性物件
     * @param {string|HTMLElement|Array} content - 內容（可為字串、元素或元素陣列）
     * @returns {HTMLElement} 創建的元素
     */
    function safeCreateElement(tag, attrs = {}, content = null) {
        const element = document.createElement(tag);

        // 設置屬性
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'class') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('data-') || ALLOWED_TAGS[tag]?.includes(key) || key === 'id') {
                // 檢查是否為危險屬性
                const isUnsafe = UNSAFE_ATTRIBUTES.some(unsafe =>
                    String(value).toLowerCase().includes(unsafe)
                );

                if (!isUnsafe) {
                    if (key === 'href' && !value.match(/^(https?:\/\/|#|\/|mailto:)/i)) {
                        Logger.warn('[DOMUtils] 不安全的 href:', value);
                        return;
                    }
                    element.setAttribute(key, value);
                }
            }
        });

        // 設置內容
        if (content !== null) {
            if (typeof content === 'string') {
                // 如果內容是 HTML，先清理
                const cleaned = sanitizeHTML(content);
                element.innerHTML = cleaned;
            } else if (content instanceof HTMLElement) {
                element.appendChild(content);
            } else if (Array.isArray(content)) {
                content.forEach(item => {
                    if (item instanceof HTMLElement) {
                        element.appendChild(item);
                    } else if (typeof item === 'string') {
                        const textNode = document.createTextNode(item);
                        element.appendChild(textNode);
                    }
                });
            }
        }

        return element;
    }

    /**
     * 安全地設置元素的文本內容（推薦使用，最安全）
     * @param {HTMLElement} element - 目標元素
     * @param {string} text - 文本內容
     */
    function safeSetText(element, text) {
        if (!element || !(element instanceof HTMLElement)) {
            Logger.error('[DOMUtils] safeSetText: 無效的元素');
            return;
        }
        element.textContent = text || '';
    }

    /**
     * 從 HTML 字串創建安全的 DocumentFragment
     * @param {string} html - HTML 字串
     * @returns {DocumentFragment} DocumentFragment
     */
    function safeCreateFragment(html) {
        const fragment = document.createDocumentFragment();
        const container = document.createElement('div');
        safeSetHTML(container, html);

        while (container.firstChild) {
            fragment.appendChild(container.firstChild);
        }

        return fragment;
    }

    // 公開 API
    return {
        sanitizeHTML,
        escapeHTML,
        safeSetHTML,
        safeCreateElement,
        safeSetText,
        safeCreateFragment
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.DOMUtils = DOMUtils;
}

// 匯出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOMUtils;
}
