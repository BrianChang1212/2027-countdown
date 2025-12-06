/**
 * 訪客分析模組
 * IP 地理定位與國家分布圖表
 */

const VisitorAnalyticsModule = (function() {
    'use strict';

    // IP 地理定位 API 配置
    const IP_API_URL = 'https://ipapi.co/json/';
    const FALLBACK_API_URL = 'https://ip-api.com/json/';
    
    // localStorage 鍵名
    const STORAGE_KEY = 'visitor_countries';
    const LAST_UPDATE_KEY = 'visitor_analytics_last_update';
    
    // 更新間隔（毫秒）- 每小時更新一次統計
    const UPDATE_INTERVAL = 60 * 60 * 1000;
    
    // 國家統計數據
    let countryStats = {};
    
    // Chart.js 實例
    let chartInstance = null;
    
    /**
     * 從 localStorage 載入國家統計
     */
    function loadCountryStats() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                countryStats = JSON.parse(stored);
            } else {
                countryStats = {};
            }
        } catch (error) {
            Logger.error('載入國家統計失敗:', error);
            countryStats = {};
        }
    }
    
    /**
     * 儲存國家統計到 localStorage
     */
    function saveCountryStats() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(countryStats));
            localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
        } catch (error) {
            Logger.error('儲存國家統計失敗:', error);
        }
    }
    
    /**
     * 獲取訪客 IP 和國家資訊
     */
    async function fetchVisitorInfo() {
        try {
            // 嘗試主要 API
            const response = await fetch(IP_API_URL);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data && data.country_code) {
                    return {
                        countryCode: data.country_code,
                        countryName: data.country_name || data.country_code,
                        ip: data.ip || 'unknown'
                    };
                }
            }
        } catch (error) {
            Logger.debug('主要 IP API 失敗，嘗試備用 API:', error);
        }
        
        // 嘗試備用 API (ip-api.com 免費版需要指定字段)
        try {
            const fallbackUrl = FALLBACK_API_URL + '?fields=status,country,countryCode,query';
            const response = await fetch(fallbackUrl);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data && data.status === 'success' && data.countryCode) {
                    return {
                        countryCode: data.countryCode,
                        countryName: data.country || data.countryCode,
                        ip: data.query || 'unknown'
                    };
                }
            }
        } catch (error) {
            Logger.error('備用 IP API 也失敗:', error);
        }
        
        return null;
    }
    
    /**
     * 記錄訪客國家
     */
    async function recordVisitor() {
        const visitorInfo = await fetchVisitorInfo();
        
        if (!visitorInfo) {
            Logger.warn('無法獲取訪客資訊');
            return;
        }
        
        const countryCode = visitorInfo.countryCode;
        
        // 更新統計
        if (!countryStats[countryCode]) {
            countryStats[countryCode] = {
                code: countryCode,
                name: visitorInfo.countryName,
                count: 0
            };
        }
        
        countryStats[countryCode].count += 1;
        countryStats[countryCode].name = visitorInfo.countryName; // 更新國家名稱
        
        // 儲存統計
        saveCountryStats();
        
        // 更新圖表
        updateChart();
        
        Logger.debug(`✅ 記錄訪客: ${visitorInfo.countryName} (${countryCode})`);
    }
    
    /**
     * 獲取國家旗幟 emoji
     */
    function getCountryFlag(countryCode) {
        if (!countryCode || countryCode.length !== 2) {
            return '🌍';
        }
        
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        
        return String.fromCodePoint(...codePoints);
    }
    
    /**
     * 準備圖表數據
     */
    function prepareChartData() {
        // 按訪問次數排序
        const sorted = Object.values(countryStats)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // 只顯示前 10 名
        
        const labels = sorted.map(item => `${getCountryFlag(item.code)} ${item.name}`);
        const data = sorted.map(item => item.count);
        const colors = generateColors(sorted.length);
        
        return { labels, data, colors, sorted };
    }
    
    /**
     * 生成圖表顏色
     */
    function generateColors(count) {
        const baseColors = [
            'rgba(212, 168, 83, 0.8)',   // 金色
            'rgba(240, 215, 140, 0.8)',  // 淺金色
            'rgba(212, 168, 83, 0.6)',
            'rgba(240, 215, 140, 0.6)',
            'rgba(255, 243, 196, 0.6)',
            'rgba(212, 168, 83, 0.4)',
            'rgba(240, 215, 140, 0.4)',
            'rgba(255, 243, 196, 0.4)',
            'rgba(212, 168, 83, 0.3)',
            'rgba(240, 215, 140, 0.3)'
        ];
        
        return baseColors.slice(0, count);
    }
    
    /**
     * 更新圖表
     */
    function updateChart() {
        const chartCanvas = document.getElementById('country-chart');
        if (!chartCanvas) {
            Logger.warn('圖表 canvas 元素未找到');
            return;
        }
        
        // 確保 canvas 有正確的尺寸
        const container = chartCanvas.parentElement;
        if (container) {
            chartCanvas.width = container.clientWidth || 400;
            chartCanvas.height = container.clientHeight || 400;
        }
        
        const chartData = prepareChartData();
        
        if (chartData.data.length === 0) {
            // 沒有數據，顯示提示
            const ctx = chartCanvas.getContext('2d');
            ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            const waitingText = (typeof I18nModule !== 'undefined' && I18nModule.t) 
                ? I18nModule.t('analytics.waitingData') || '等待訪客數據...'
                : '等待訪客數據...';
            ctx.fillText(waitingText, chartCanvas.width / 2, chartCanvas.height / 2);
            return;
        }
        
        // 檢查 Chart.js 是否已載入
        if (typeof Chart === 'undefined') {
            Logger.error('Chart.js 未載入');
            return;
        }
        
        // 如果圖表已存在，銷毀它
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        // 創建新圖表
        const ctx = chartCanvas.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.labels,
                datasets: [{
                    data: chartData.data,
                    backgroundColor: chartData.colors,
                    borderColor: 'rgba(212, 168, 83, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: {
                                size: 12
                            },
                            padding: 10,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'rgba(255, 255, 255, 1)',
                        bodyColor: 'rgba(255, 255, 255, 0.9)',
                        borderColor: 'rgba(212, 168, 83, 1)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} 次 (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // 更新國家列表
        updateCountryList(chartData.sorted);
    }
    
    /**
     * 更新國家列表顯示
     */
    function updateCountryList(sorted) {
        const listContainer = document.getElementById('country-list');
        if (!listContainer) return;
        
        if (sorted.length === 0) {
            const waitingText = (typeof I18nModule !== 'undefined' && I18nModule.t) 
                ? I18nModule.t('analytics.waitingData') || '等待訪客數據...'
                : '等待訪客數據...';
            const waitingHTML = `<p class="no-data" data-i18n="analytics.waitingData">${waitingText}</p>`;
            // 使用安全的 HTML 設置
            if (typeof DOMUtils !== 'undefined') {
                DOMUtils.safeSetHTML(listContainer, waitingHTML);
            } else {
                listContainer.innerHTML = waitingHTML; // 降級方案
            }
            // 更新翻譯
            if (typeof I18nModule !== 'undefined' && I18nModule.updateTranslations) {
                I18nModule.updateTranslations();
            }
            return;
        }
        
        const total = Object.values(countryStats).reduce((sum, item) => sum + item.count, 0);
        
        const countryListHTML = sorted.map((item, index) => {
            const percentage = ((item.count / total) * 100).toFixed(1);
            return `
                <div class="country-item">
                    <span class="country-rank">${index + 1}</span>
                    <span class="country-flag">${getCountryFlag(item.code)}</span>
                    <span class="country-name">${item.name}</span>
                    <span class="country-count">${item.count}</span>
                    <div class="country-bar">
                        <div class="country-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="country-percentage">${percentage}%</span>
                </div>
            `;
        }).join('');
        
        // 使用安全的 HTML 設置
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.safeSetHTML(listContainer, countryListHTML);
        } else {
            listContainer.innerHTML = countryListHTML; // 降級方案
        }
    }
    
    /**
     * 更新總訪客數顯示
     */
    function updateTotalVisitors() {
        const totalElement = document.getElementById('total-visitors');
        if (!totalElement) return;
        
        const total = Object.values(countryStats).reduce((sum, item) => sum + item.count, 0);
        totalElement.textContent = total.toLocaleString();
    }
    
    /**
     * 更新國家數量顯示
     */
    function updateCountryCount() {
        const countElement = document.getElementById('country-count');
        if (!countElement) return;
        
        const count = Object.keys(countryStats).length;
        countElement.textContent = count;
    }
    
    /**
     * 初始化模組
     */
    async function init() {
        // 載入現有統計
        loadCountryStats();
        
        // 檢查是否需要更新（避免頻繁 API 呼叫）
        const lastUpdate = parseInt(localStorage.getItem(LAST_UPDATE_KEY) || '0', 10);
        const now = Date.now();
        
        // 如果距離上次更新超過間隔時間，或沒有數據，則記錄新訪客
        if (now - lastUpdate > UPDATE_INTERVAL || Object.keys(countryStats).length === 0) {
            await recordVisitor();
        }
        
        // 更新顯示
        updateChart();
        updateTotalVisitors();
        updateCountryCount();
        
        Logger.debug('✅ 訪客分析模組已初始化');
    }
    
    /**
     * 手動刷新
     */
    async function refresh() {
        await recordVisitor();
        updateChart();
        updateTotalVisitors();
        updateCountryCount();
    }
    
    /**
     * 清除所有統計數據
     */
    function clearStats() {
        if (confirm('確定要清除所有訪客統計數據嗎？此操作無法復原。')) {
            countryStats = {};
            saveCountryStats();
            updateChart();
            updateTotalVisitors();
            updateCountryCount();
        }
    }
    
    // DOM 載入完成後初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 200);
    }
    
    // 公開 API
    return {
        init,
        refresh,
        clearStats,
        getStats: () => ({ ...countryStats }),
        getTotalVisitors: () => {
            return Object.values(countryStats).reduce((sum, item) => sum + item.count, 0);
        }
    };
})();

