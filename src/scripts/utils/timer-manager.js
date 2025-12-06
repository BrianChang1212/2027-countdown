/**
 * 統一的定時器管理器
 * 提供統一的定時器管理介面，支援清理機制
 */

const TimerManager = (function() {
    'use strict';

    // 定時器儲存
    const timers = new Map();
    let timerCounter = 0;

    /**
     * 建立定時器
     * @param {string} name - 定時器名稱（可選，如果不提供則自動生成）
     * @param {Function} callback - 回調函數
     * @param {number} delay - 延遲時間（毫秒）
     * @returns {string} 定時器 ID
     */
    function create(name, callback, delay) {
        if (!name) {
            name = `timer_${++timerCounter}`;
        }

        // 如果已存在同名定時器，先清除
        clear(name);

        const id = setInterval(callback, delay);
        timers.set(name, {
            id: id,
            callback: callback,
            delay: delay,
            createdAt: Date.now()
        });

        return name;
    }

    /**
     * 清除指定定時器
     * @param {string} name - 定時器名稱
     * @returns {boolean} 是否清除成功
     */
    function clear(name) {
        if (!name || typeof name !== 'string') {
            return false;
        }

        const timer = timers.get(name);
        if (timer) {
            clearInterval(timer.id);
            timers.delete(name);
            return true;
        }

        return false;
    }

    /**
     * 清除所有定時器
     * @returns {number} 清除的定時器數量
     */
    function clearAll() {
        let count = 0;
        timers.forEach((timer, name) => {
            clearInterval(timer.id);
            count++;
        });
        timers.clear();
        return count;
    }

    /**
     * 檢查定時器是否存在
     * @param {string} name - 定時器名稱
     * @returns {boolean} 是否存在
     */
    function has(name) {
        return timers.has(name);
    }

    /**
     * 取得定時器資訊
     * @param {string} name - 定時器名稱
     * @returns {Object|null} 定時器資訊
     */
    function get(name) {
        return timers.get(name) || null;
    }

    /**
     * 取得所有定時器列表
     * @returns {Array} 定時器名稱列表
     */
    function list() {
        return Array.from(timers.keys());
    }

    /**
     * 取得定時器統計資訊
     * @returns {Object} 統計資訊
     */
    function getStats() {
        return {
            total: timers.size,
            timers: Array.from(timers.keys())
        };
    }

    // 頁面卸載時自動清理所有定時器
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
            clearAll();
        });
    }

    // 公開 API
    return {
        create,
        clear,
        clearAll,
        has,
        get,
        list,
        getStats
    };
})();

// 匯出給其他模組使用
if (typeof window !== 'undefined') {
    window.TimerManager = TimerManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimerManager;
}

