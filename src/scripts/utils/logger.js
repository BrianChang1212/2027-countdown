/**
 * 統一的日誌系統
 * 提供統一的日誌記錄介面，支援不同日誌級別和生產環境自動禁用
 */

const Logger = (function () {
    'use strict';

    // 日誌級別
    const LogLevel = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        NONE: 4
    };

    // 當前日誌級別（從配置讀取）
    const currentLevel = (() => {
        if (typeof CONFIG !== 'undefined' && CONFIG.DEBUG) {
            return LogLevel.DEBUG;
        }
        // 生產環境只顯示 WARN 和 ERROR
        return LogLevel.WARN;
    })();

    /**
     * 格式化日誌訊息
     * @param {string} level - 日誌級別
     * @param {string} message - 訊息
     * @param {string} module - 模組名稱
     * @returns {string} 格式化後的訊息
     */
    function formatMessage(level, message, module = '') {
        const timestamp = new Date().toLocaleTimeString('zh-TW');
        const moduleStr = module ? `[${module}]` : '';
        return `${timestamp} ${level} ${moduleStr} ${message}`;
    }

    /**
     * 記錄日誌
     * @param {number} level - 日誌級別
     * @param {string} message - 訊息
     * @param {string} module - 模組名稱
     * @param {Array} args - 額外參數
     */
    function log(level, message, module = '', ...args) {
        if (level < currentLevel) {
            return;
        }

        const formattedMessage = formatMessage(
            Object.keys(LogLevel).find(key => LogLevel[key] === level) || 'LOG',
            message,
            module
        );

        switch (level) {
            case LogLevel.DEBUG:
                if (typeof console.debug === 'function') {
                    console.debug(formattedMessage, ...args);
                } else {
                    console.log(formattedMessage, ...args);
                }
                break;
            case LogLevel.INFO:
                console.info(formattedMessage, ...args);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage, ...args);
                break;
            case LogLevel.ERROR:
                console.error(formattedMessage, ...args);
                break;
        }
    }

    /**
     * Debug 日誌
     * @param {string} message - 訊息
     * @param {string} module - 模組名稱
     * @param {...*} args - 額外參數
     */
    function debug(message, module = '', ...args) {
        log(LogLevel.DEBUG, message, module, ...args);
    }

    /**
     * Info 日誌
     * @param {string} message - 訊息
     * @param {string} module - 模組名稱
     * @param {...*} args - 額外參數
     */
    function info(message, module = '', ...args) {
        log(LogLevel.INFO, message, module, ...args);
    }

    /**
     * Warning 日誌
     * @param {string} message - 訊息
     * @param {string} module - 模組名稱
     * @param {...*} args - 額外參數
     */
    function warn(message, module = '', ...args) {
        log(LogLevel.WARN, message, module, ...args);
    }

    /**
     * Error 日誌
     * @param {string} message - 訊息
     * @param {string} module - 模組名稱
     * @param {...*} args - 額外參數
     */
    function error(message, module = '', ...args) {
        log(LogLevel.ERROR, message, module, ...args);
    }

    /**
     * 成功訊息（等同於 info）
     * @param {string} message - 訊息
     * @param {string} module - 模組名稱
     * @param {...*} args - 額外參數
     */
    function success(message, module = '', ...args) {
        log(LogLevel.INFO, `✅ ${message}`, module, ...args);
    }

    /**
     * 清除控制台（僅在開發模式）
     */
    function clear() {
        if (currentLevel <= LogLevel.DEBUG && typeof console.clear === 'function') {
            console.clear();
        }
    }

    /**
     * 設定日誌級別
     * @param {number} level - 日誌級別
     */
    function setLevel(level) {
        if (typeof level === 'number' && level >= LogLevel.DEBUG && level <= LogLevel.NONE) {
            // 注意：這裡只是為了 API 一致性，實際級別由 CONFIG.DEBUG 控制
            // 在生產環境中不應該改變日誌級別
        }
    }

    /**
     * 取得當前日誌級別
     * @returns {number} 當前日誌級別
     */
    function getLevel() {
        return currentLevel;
    }

    // 公開 API
    return {
        LogLevel,
        debug,
        info,
        warn,
        error,
        success,
        clear,
        setLevel,
        getLevel
    };
})();

// 匯出給其他模組使用
if (typeof window !== 'undefined') {
    window.Logger = Logger;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}

