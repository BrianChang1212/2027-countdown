/**
 * 統一的錯誤處理系統
 * 提供統一的錯誤處理、日誌記錄和錯誤恢復機制
 */

const ErrorHandler = (function () {
    'use strict';

    // 錯誤類型
    const ErrorType = {
        NETWORK: 'NETWORK',
        API: 'API',
        VALIDATION: 'VALIDATION',
        RUNTIME: 'RUNTIME',
        UNKNOWN: 'UNKNOWN'
    };

    // 錯誤處理器配置
    const config = {
        enableLogging: typeof CONFIG !== 'undefined' ? CONFIG.DEBUG : false,
        enableErrorReporting: false,
        maxRetries: 3,
        retryDelay: 1000
    };

    /**
     * 判斷錯誤類型
     * @param {Error} error - 錯誤物件
     * @returns {string} 錯誤類型
     */
    function getErrorType(error) {
        if (!error) return ErrorType.UNKNOWN;

        // 如果錯誤物件已有類型，直接返回
        if (error.type && Object.values(ErrorType).includes(error.type)) {
            return error.type;
        }

        // 網路錯誤
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return ErrorType.NETWORK;
        }
        if (error.message && error.message.includes('CORS')) {
            return ErrorType.NETWORK;
        }
        if (error.message && error.message.includes('network')) {
            return ErrorType.NETWORK;
        }

        // API 錯誤
        if (error.status || error.statusCode) {
            return ErrorType.API;
        }
        if (error.response) {
            return ErrorType.API;
        }

        // 驗證錯誤
        if (error.name === 'ValidationError' || error.message.includes('validation')) {
            return ErrorType.VALIDATION;
        }

        return ErrorType.RUNTIME;
    }

    /**
     * 格式化錯誤訊息
     * @param {Error} error - 錯誤物件
     * @param {string} context - 錯誤上下文
     * @returns {string} 格式化後的錯誤訊息
     */
    function formatError(error, context = '') {
        const type = getErrorType(error);
        const message = error.message || error.toString() || '未知錯誤';
        const contextStr = context ? `[${context}] ` : '';

        return `${contextStr}${type}: ${message}`;
    }

    /**
     * 記錄錯誤
     * @param {Error} error - 錯誤物件
     * @param {string} context - 錯誤上下文
     * @param {Object} metadata - 額外的元數據
     */
    function logError(error, context = '', metadata = {}) {
        if (!config.enableLogging) return;

        const errorInfo = {
            type: getErrorType(error),
            message: error.message || error.toString(),
            context,
            stack: error.stack,
            metadata,
            timestamp: new Date().toISOString()
        };

        // 使用統一的 logger
        if (typeof DebugUtils !== 'undefined') {
            DebugUtils.error(formatError(error, context), context);
        } else {
            Logger.error('[ErrorHandler]', errorInfo);
        }

        // 可以擴展為發送到錯誤追蹤服務
        if (config.enableErrorReporting) {
            // reportError(errorInfo);
        }
    }

    /**
     * 處理 API 錯誤
     * @param {Response} response - Fetch API 回應物件
     * @param {string} context - 錯誤上下文
     * @returns {Promise<Error>} 錯誤物件
     */
    async function handleApiError(response, context = '') {
        let errorMessage = `API 錯誤: ${response.status} ${response.statusText}`;

        try {
            const errorData = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch {
            // 無法解析 JSON，使用預設訊息
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.statusCode = response.status;
        error.response = response;

        logError(error, context);
        return error;
    }

    /**
     * 處理網路錯誤
     * @param {Error} error - 錯誤物件
     * @param {string} context - 錯誤上下文
     * @returns {Error} 處理後的錯誤物件
     */
    function handleNetworkError(error, context = '') {
        const networkError = new Error('網路連線失敗，請檢查您的網路連線');
        networkError.originalError = error;
        networkError.type = ErrorType.NETWORK;

        logError(networkError, context);
        return networkError;
    }

    /**
     * 安全的異步函數執行
     * @param {Function} fn - 要執行的異步函數
     * @param {string} context - 錯誤上下文
     * @param {*} fallback - 失敗時的預設值
     * @returns {Promise<*>} 執行結果或預設值
     */
    async function safeExecute(fn, context = '', fallback = null) {
        try {
            return await fn();
        } catch (error) {
            logError(error, context);
            return fallback;
        }
    }

    /**
     * 帶重試的異步函數執行
     * @param {Function} fn - 要執行的異步函數
     * @param {string} context - 錯誤上下文
     * @param {number} maxRetries - 最大重試次數
     * @param {number} delay - 重試延遲（毫秒）
     * @returns {Promise<*>} 執行結果
     */
    async function retryExecute(fn, context = '', maxRetries = config.maxRetries, delay = config.retryDelay) {
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                // 如果是最後一次嘗試，記錄錯誤
                if (attempt === maxRetries) {
                    logError(error, `${context} (重試 ${maxRetries} 次後失敗)`);
                    throw error;
                }

                // 等待後重試
                await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
            }
        }

        throw lastError;
    }

    /**
     * 包裝 Fetch API，自動處理錯誤
     * @param {string} url - 請求 URL
     * @param {Object} options - Fetch 選項
     * @param {string} context - 錯誤上下文
     * @returns {Promise<Response>} Fetch 回應
     */
    async function safeFetch(url, options = {}, context = '') {
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw await handleApiError(response, context);
            }

            return response;
        } catch (error) {
            // 如果是我們自己拋出的錯誤，直接重新拋出
            if (error.status) {
                throw error;
            }

            // 網路錯誤
            throw handleNetworkError(error, context);
        }
    }

    // 公開 API
    return {
        ErrorType,
        logError,
        handleApiError,
        handleNetworkError,
        safeExecute,
        retryExecute,
        safeFetch,
        formatError,
        getErrorType,
        config
    };
})();

// 匯出給其他模組使用
if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}

