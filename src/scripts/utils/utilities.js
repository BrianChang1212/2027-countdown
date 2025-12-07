/**
 * 共用工具函數庫
 * 提供各模組共用的輔助函數
 */

const Helpers = (function () {
    'use strict';

    /**
     * 格式化數字（補零）
     * @param {number} num - 要格式化的數字
     * @param {number} digits - 位數
     * @returns {string} 格式化後的字串
     */
    function padNumber(num, digits = 2) {
        return num.toString().padStart(digits, '0');
    }

    /**
     * 移除 HTML 標籤
     * @param {string} html - 含 HTML 的字串
     * @returns {string} 純文字
     */
    function stripHtml(html) {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    }

    /**
     * 截斷文字
     * @param {string} text - 原始文字
     * @param {number} maxLength - 最大長度
     * @param {string} suffix - 後綴 (預設 '...')
     * @returns {string} 截斷後的文字
     */
    function truncateText(text, maxLength, suffix = '...') {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + suffix;
    }

    /**
     * 格式化相對時間
     * @param {string|Date} dateStr - 日期
     * @param {Object} labels - 時間單位標籤
     * @param {string} locale - 地區設定
     * @returns {string} 格式化後的時間
     */
    function formatRelativeTime(dateStr, labels = {}, locale = 'zh-TW') {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';

            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            const defaultLabels = {
                minutesAgo: '分鐘前',
                hoursAgo: '小時前',
                daysAgo: '天前'
            };
            const l = { ...defaultLabels, ...labels };

            if (diffMins < 60) {
                return `${diffMins} ${l.minutesAgo}`;
            } else if (diffHours < 24) {
                return `${diffHours} ${l.hoursAgo}`;
            } else if (diffDays < 7) {
                return `${diffDays} ${l.daysAgo}`;
            } else {
                return date.toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric'
                });
            }
        } catch {
            return '';
        }
    }

    /**
     * 格式化大數字
     * @param {number} num - 數字
     * @returns {string} 格式化後的字串
     */
    function formatLargeNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'K';
        }
        return num.toString();
    }

    /**
     * 防抖函數
     * @param {Function} func - 要執行的函數
     * @param {number} wait - 等待時間 (毫秒)
     * @returns {Function} 防抖後的函數
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 節流函數
     * @param {Function} func - 要執行的函數
     * @param {number} limit - 間隔時間 (毫秒)
     * @returns {Function} 節流後的函數
     */
    function throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 安全的 JSON 解析
     * @param {string} str - JSON 字串
     * @param {*} fallback - 解析失敗時的預設值
     * @returns {*} 解析結果或預設值
     */
    function safeJsonParse(str, fallback = null) {
        try {
            return JSON.parse(str);
        } catch {
            return fallback;
        }
    }

    /**
     * 檢查是否為有效的 URL (僅限 http/https)
     * @param {string} str - 要檢查的字串
     * @returns {boolean} 是否為有效 URL
     */
    function isValidUrl(str) {
        try {
            const url = new URL(str);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }

    /**
     * 產生唯一 ID
     * @returns {string} 唯一 ID
     */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 等待指定時間
     * @param {number} ms - 毫秒
     * @returns {Promise} Promise
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 安全地取得巢狀物件屬性
     * @param {Object} obj - 物件
     * @param {string} path - 屬性路徑 (如 'a.b.c')
     * @param {*} defaultValue - 預設值
     * @returns {*} 屬性值或預設值
     */
    function getNestedProperty(obj, path, defaultValue = undefined) {
        return path.split('.').reduce((acc, part) =>
            acc && acc[part] !== undefined ? acc[part] : defaultValue, obj);
    }

    /**
     * 日誌工具
     */
    const logger = {
        log: (...args) => {
            if (typeof CONFIG !== 'undefined' && CONFIG.DEBUG) {
                Logger.debug('[App]', ...args);
            }
        },
        warn: (...args) => {
            Logger.warn('[App]', ...args);
        },
        error: (...args) => {
            Logger.error('[App]', ...args);
        }
    };

    /**
     * 顯示 Toast 通知
     * @param {string} message - 通知訊息
     * @param {string} type - 通知類型 ('success', 'error', 'info', 'warning')
     * @param {number} duration - 顯示時長（毫秒，預設 3000）
     */
    function showToast(message, type = 'success', duration = 3000) {
        // 確保 toast 容器存在
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // 創建 toast 元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // 根據類型設置圖標
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
                break;
            case 'error':
                icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';
                break;
            case 'warning':
                icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
                break;
            case 'info':
            default:
                icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
                break;
        }

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
        `;

        // 添加到容器
        toastContainer.appendChild(toast);

        // 觸發動畫
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 自動移除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    // 公開 API
    return {
        padNumber,
        stripHtml,
        truncateText,
        formatRelativeTime,
        formatLargeNumber,
        debounce,
        throttle,
        safeJsonParse,
        isValidUrl,
        generateId,
        sleep,
        getNestedProperty,
        logger,
        showToast
    };
})();

// 匯出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Helpers;
}

