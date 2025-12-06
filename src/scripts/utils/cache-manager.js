/**
 * 統一的快取管理器
 * 提供統一的快取策略和管理介面
 */

const CacheManager = (function() {
    'use strict';

    // 快取儲存
    const cache = new Map();
    
    // 預設快取時長（毫秒）
    const DEFAULT_DURATION = 5 * 60 * 1000; // 5 分鐘

    // 定時器引用（用於清理）
    let cleanupInterval = null;

    /**
     * 設定快取
     * @param {string} key - 快取鍵
     * @param {*} value - 快取值
     * @param {number} duration - 快取時長（毫秒），預設使用 DEFAULT_DURATION
     * @returns {boolean} 是否設定成功
     */
    function set(key, value, duration = DEFAULT_DURATION) {
        if (!key || typeof key !== 'string') {
            return false;
        }

        const expiresAt = Date.now() + duration;
        cache.set(key, {
            value,
            expiresAt,
            createdAt: Date.now()
        });

        return true;
    }

    /**
     * 取得快取
     * @param {string} key - 快取鍵
     * @returns {*|null} 快取值，如果不存在或已過期則返回 null
     */
    function get(key) {
        if (!key || typeof key !== 'string') {
            return null;
        }

        const item = cache.get(key);
        if (!item) {
            return null;
        }

        // 檢查是否過期
        if (Date.now() > item.expiresAt) {
            cache.delete(key);
            return null;
        }

        return item.value;
    }

    /**
     * 檢查快取是否存在且有效
     * @param {string} key - 快取鍵
     * @returns {boolean} 是否存在且有效
     */
    function has(key) {
        if (!key || typeof key !== 'string') {
            return false;
        }

        const item = cache.get(key);
        if (!item) {
            return false;
        }

        // 檢查是否過期
        if (Date.now() > item.expiresAt) {
            cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * 刪除快取
     * @param {string} key - 快取鍵，如果不提供則清除所有快取
     * @returns {boolean} 是否刪除成功
     */
    function remove(key) {
        if (key === undefined || key === null) {
            // 清除所有快取
            cache.clear();
            return true;
        }

        if (typeof key !== 'string') {
            return false;
        }

        return cache.delete(key);
    }

    /**
     * 清除過期快取
     * @returns {number} 清除的快取數量
     */
    function clearExpired() {
        const now = Date.now();
        let count = 0;

        for (const [key, item] of cache.entries()) {
            if (now > item.expiresAt) {
                cache.delete(key);
                count++;
            }
        }

        return count;
    }

    /**
     * 清理定時器
     */
    function cleanup() {
        if (cleanupInterval) {
            if (typeof TimerManager !== 'undefined' && TimerManager.clear) {
                TimerManager.clear('cache-cleanup');
            } else {
                clearInterval(cleanupInterval);
            }
            cleanupInterval = null;
        }
    }

    /**
     * 取得快取統計資訊
     * @returns {Object} 統計資訊
     */
    function getStats() {
        const now = Date.now();
        let total = 0;
        let expired = 0;
        let valid = 0;

        for (const item of cache.values()) {
            total++;
            if (now > item.expiresAt) {
                expired++;
            } else {
                valid++;
            }
        }

        return {
            total,
            valid,
            expired,
            size: cache.size
        };
    }

    /**
     * 使用快取包裝異步函數
     * @param {string} key - 快取鍵
     * @param {Function} fn - 要包裝的異步函數
     * @param {number} duration - 快取時長（毫秒）
     * @returns {Promise} 包裝後的函數結果
     */
    async function cached(key, fn, duration = DEFAULT_DURATION) {
        // 檢查快取
        const cachedValue = get(key);
        if (cachedValue !== null) {
            return cachedValue;
        }

        // 執行函數並快取結果
        try {
            const value = await fn();
            set(key, value, duration);
            return value;
        } catch (error) {
            // 如果函數執行失敗，不進行快取
            throw error;
        }
    }

    /**
     * 初始化定期清理
     */
    function initCleanup() {
        // 清理舊的定時器（如果存在）
        cleanup();

        // 定期清理過期快取（每 5 分鐘）
        if (typeof TimerManager !== 'undefined' && TimerManager.create) {
            TimerManager.create('cache-cleanup', clearExpired, 5 * 60 * 1000);
        } else {
            cleanupInterval = setInterval(clearExpired, 5 * 60 * 1000);
        }
    }

    // 初始化定期清理
    initCleanup();

    // 頁面卸載時清理
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', cleanup);
    }

    // 公開 API
    return {
        set,
        get,
        has,
        remove,
        clearExpired,
        getStats,
        cached,
        cleanup
    };
})();

// 匯出給其他模組使用
if (typeof window !== 'undefined') {
    window.CacheManager = CacheManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheManager;
}

