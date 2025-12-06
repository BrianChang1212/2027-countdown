/**
 * 訪客計數器模組
 * 使用 CountAPI 服務追蹤網站瀏覽數
 */

const VisitorCounterModule = (function() {
    'use strict';

    // CountAPI 配置
    const COUNT_API_NAMESPACE = '2027countdown';
    const COUNT_API_KEY = 'visits';
    const COUNT_API_URL = `https://api.countapi.xyz/hit/${COUNT_API_NAMESPACE}/${COUNT_API_KEY}`;
    
    // 今日瀏覽數使用 localStorage
    const TODAY_KEY = 'visitor_count_today';
    const TODAY_DATE_KEY = 'visitor_count_date';
    
    // DOM 元素
    let totalVisitsElement = null;
    let todayVisitsElement = null;
    
    /**
     * 格式化數字（添加千分位逗號）
     */
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    /**
     * 更新今日瀏覽數
     */
    function updateTodayCount() {
        const today = new Date().toDateString();
        const storedDate = localStorage.getItem(TODAY_DATE_KEY);
        let todayCount = 0;
        
        if (storedDate === today) {
            // 同一天，增加計數
            todayCount = parseInt(localStorage.getItem(TODAY_KEY) || '0', 10) + 1;
        } else {
            // 新的一天，重置計數
            todayCount = 1;
            localStorage.setItem(TODAY_DATE_KEY, today);
        }
        
        localStorage.setItem(TODAY_KEY, todayCount.toString());
        
        if (todayVisitsElement) {
            todayVisitsElement.textContent = formatNumber(todayCount);
            // 添加動畫效果
            todayVisitsElement.classList.add('pulse');
            setTimeout(() => {
                todayVisitsElement.classList.remove('pulse');
            }, 600);
        }
        
        return todayCount;
    }
    
    /**
     * 從 CountAPI 獲取總瀏覽數
     */
    async function fetchTotalVisits() {
        try {
            const response = await fetch(COUNT_API_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && typeof data.value === 'number') {
                return data.value;
            } else {
                Logger.warn('CountAPI 返回格式異常:', data);
                return null;
            }
        } catch (error) {
            Logger.error('獲取總瀏覽數失敗:', error);
            // 嘗試從 localStorage 獲取備用值
            const fallback = localStorage.getItem('visitor_count_fallback');
            return fallback ? parseInt(fallback, 10) : null;
        }
    }
    
    /**
     * 更新總瀏覽數顯示
     */
    async function updateTotalVisits() {
        const totalVisits = await fetchTotalVisits();
        
        if (totalVisits !== null && totalVisitsElement) {
            totalVisitsElement.textContent = formatNumber(totalVisits);
            // 儲存備用值
            localStorage.setItem('visitor_count_fallback', totalVisits.toString());
            
            // 添加動畫效果
            totalVisitsElement.classList.add('pulse');
            setTimeout(() => {
                totalVisitsElement.classList.remove('pulse');
            }, 600);
        } else if (totalVisitsElement) {
            // 顯示錯誤狀態
            totalVisitsElement.textContent = '--';
        }
    }
    
    /**
     * 初始化計數器
     */
    function init() {
        // 獲取 DOM 元素
        totalVisitsElement = document.getElementById('total-visits');
        todayVisitsElement = document.getElementById('today-visits');
        
        if (!totalVisitsElement || !todayVisitsElement) {
            Logger.warn('訪客計數器 DOM 元素未找到');
            return;
        }
        
        // 更新今日瀏覽數（立即執行）
        updateTodayCount();
        
        // 更新總瀏覽數（異步）
        updateTotalVisits();
        
        Logger.debug('✅ 訪客計數器模組已初始化');
    }
    
    /**
     * 手動刷新計數
     */
    function refresh() {
        updateTodayCount();
        updateTotalVisits();
    }
    
    // DOM 載入完成後初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM 已載入，延遲初始化以確保其他模組已準備
        setTimeout(init, 100);
    }
    
    // 公開 API
    return {
        init,
        refresh,
        getTodayCount: () => {
            const today = new Date().toDateString();
            const storedDate = localStorage.getItem(TODAY_DATE_KEY);
            if (storedDate === today) {
                return parseInt(localStorage.getItem(TODAY_KEY) || '0', 10);
            }
            return 0;
        }
    };
})();

