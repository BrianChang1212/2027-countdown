/**
 * 統一的 Debug 工具模組
 * 完全依賴 CONFIG.DEBUG flag 控制所有 debug 訊息輸出
 * 生產環境（CONFIG.DEBUG = false）時，所有 debug 訊息將被禁用
 * 錯誤訊息（error）始終輸出，不受 DEBUG flag 控制
 */

const DebugUtils = (function() {
    'use strict';

    /**
     * 檢查是否啟用 Debug 模式
     * @returns {boolean} 是否啟用 Debug
     */
    function isDebugEnabled() {
        return typeof CONFIG !== 'undefined' && CONFIG.DEBUG === true;
    }

    /**
     * Debug 日誌（僅在 DEBUG 模式輸出）
     * @param {string} message - 訊息
     * @param {string} module - 模組名稱
     * @param {...*} args - 額外參數
     */
    function log(message, module = '', ...args) {
        if (!isDebugEnabled()) {
            return;
        }

        const prefix = module ? `[${module}]` : '[DEBUG]';
        if (typeof console.debug === 'function') {
            console.debug(`${prefix} ${message}`, ...args);
        } else {
            Logger.debug(`${prefix} ${message}`, ...args);
        }
    }

    /**
     * Info 日誌（僅在 DEBUG 模式輸出）
     * @param {string} message - 訊息
     * @param {string} module - 模組名稱
     * @param {...*} args - 額外參數
     */
    function info(message, module = '', ...args) {
        if (!isDebugEnabled()) {
            return;
        }

        const prefix = module ? `[${module}]` : '[INFO]';
        console.info(`${prefix} ${message}`, ...args);
    }

    /**
     * 成功訊息（僅在 DEBUG 模式輸出）
     * @param {string} message - 訊息
     * @param {string} module - 模組名稱
     * @param {...*} args - 額外參數
     */
    function success(message, module = '', ...args) {
        if (!isDebugEnabled()) {
            return;
        }

        const prefix = module ? `[${module}]` : '[SUCCESS]';
        Logger.debug(`✅ ${prefix} ${message}`, ...args);
    }

    /**
     * 警告訊息（僅在 DEBUG 模式輸出）
     * @param {string} message - 訊息
     * @param {string} module - 模組名稱
     * @param {...*} args - 額外參數
     */
    function warning(message, module = '', ...args) {
        if (!isDebugEnabled()) {
            return;
        }

        const prefix = module ? `[${module}]` : '[WARN]';
        Logger.warn(`⚠️ ${prefix} ${message}`, ...args);
    }

    /**
     * 錯誤訊息（始終輸出，不受 DEBUG flag 控制）
     * @param {string} message - 訊息
     * @param {string} module - 模組名稱
     * @param {...*} args - 額外參數
     */
    function error(message, module = '', ...args) {
        const prefix = module ? `[${module}]` : '[ERROR]';
        Logger.error(`❌ ${prefix} ${message}`, ...args);
    }

    /**
     * 清除控制台（僅在 DEBUG 模式）
     */
    function clear() {
        if (isDebugEnabled() && typeof console.clear === 'function') {
            console.clear();
        }
    }

    /**
     * 初始化（向後相容）
     */
    function init() {
        if (isDebugEnabled()) {
            log('DebugUtils 已初始化', 'DebugUtils');
        }
    }

    /**
     * 檢查 Debug 狀態
     * @returns {boolean} 是否啟用 Debug
     */
    function isEnabled() {
        return isDebugEnabled();
    }

    // 公開 API
    return {
        log,
        info,
        success,
        warning,
        error,
        clear,
        init,
        isEnabled
    };
})();

// 匯出給其他模組使用
if (typeof window !== 'undefined') {
    window.DebugUtils = DebugUtils;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugUtils;
}
