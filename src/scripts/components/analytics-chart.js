/**
 * 分析圖表組件模組
 * 負責訪客分析的圖表渲染和管理
 */

const AnalyticsChart = (function() {
    'use strict';

    let chartInstance = null;
    let currentChartType = 'doughnut'; // 'doughnut' or 'bar'

    /**
     * 獲取翻譯文字
     */
    function t(key, defaultValue = '') {
        if (typeof I18nModule !== 'undefined' && I18nModule.t) {
            return I18nModule.t(key) || defaultValue;
        }
        return defaultValue;
    }

    /**
     * 生成圖表顏色
     * @param {number} count - 需要的顏色數量
     * @returns {Array<string>} 顏色陣列
     */
    function generateColors(count) {
        // 增強顏色對比度，使用更明顯的金色系
        const baseColors = [
            'rgba(212, 168, 83, 1)',     // 金色 - 完全不透明
            'rgba(240, 215, 140, 0.95)', // 淺金色
            'rgba(255, 200, 87, 0.9)',   // 亮金色
            'rgba(212, 168, 83, 0.85)',
            'rgba(240, 215, 140, 0.8)',
            'rgba(255, 243, 196, 0.75)',
            'rgba(212, 168, 83, 0.7)',
            'rgba(240, 215, 140, 0.65)',
            'rgba(255, 200, 87, 0.6)',
            'rgba(212, 168, 83, 0.55)'
        ];
        
        // 如果需要的顏色超過基礎顏色數量，循環使用
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        
        return colors;
    }

    /**
     * 準備圖表數據
     * @param {Object} countryStats - 國家統計資料
     * @param {number|null} limit - 限制顯示數量（null 表示顯示全部）
     * @returns {Object} 圖表數據物件
     */
    function prepareChartData(countryStats, limit = null) {
        // 按訪問次數排序
        const sorted = Object.values(countryStats)
            .sort((a, b) => b.count - a.count);
        
        const limited = limit ? sorted.slice(0, limit) : sorted;
        
        const getCountryFlag = (typeof AnalyticsUtils !== 'undefined' && AnalyticsUtils.getCountryFlag)
            ? AnalyticsUtils.getCountryFlag
            : (code) => '🌍'; // 降級方案
        
        const labels = limited.map(item => `${getCountryFlag(item.code)} ${item.name}`);
        const data = limited.map(item => item.count);
        const colors = generateColors(limited.length);
        
        return { labels, data, colors, sorted: limited, allSorted: sorted };
    }

    /**
     * 更新圖表
     * @param {Object} countryStats - 國家統計資料
     * @param {string} chartType - 圖表類型 ('doughnut' 或 'bar')
     */
    function updateChart(countryStats, chartType = 'doughnut') {
        currentChartType = chartType || 'doughnut';
        
        const chartCanvas = document.getElementById('analytics-country-chart');
        if (!chartCanvas) {
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.warning('圖表 canvas 元素未找到', 'AnalyticsChart');
            }
            return;
        }

        const container = chartCanvas.parentElement;
        if (!container) {
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.warning('圖表容器未找到', 'AnalyticsChart');
            }
            return;
        }

        const chartData = prepareChartData(countryStats, 20); // 顯示前20名

        if (chartData.data.length === 0) {
            // 沒有數據，顯示提示
            // 先清理舊圖表
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
            
            // 清理 Chart.js 創建的所有 wrapper 和殘留元素
            const allChildren = Array.from(container.children);
            allChildren.forEach(child => {
                if (child.id === 'analytics-country-chart') {
                    return;
                }
                if (child.tagName === 'DIV' && child.contains(chartCanvas)) {
                    container.insertBefore(chartCanvas, child);
                    child.remove();
                } else if (child.tagName === 'DIV' || (child.tagName === 'CANVAS' && child !== chartCanvas)) {
                    child.remove();
                }
            });

            // 確保 canvas 在容器中
            if (!container.contains(chartCanvas)) {
                container.appendChild(chartCanvas);
            }

            // 重置容器和 canvas 的尺寸
            container.style.height = '';
            container.style.minHeight = '';
            chartCanvas.style.width = '';
            chartCanvas.style.height = '';
            
            // 設定 canvas 尺寸
            chartCanvas.width = container.clientWidth || 400;
            chartCanvas.height = container.clientHeight || 400;
            
            const ctx = chartCanvas.getContext('2d');
            ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(t('analytics.waitingData', '等待訪客數據...'), chartCanvas.width / 2, chartCanvas.height / 2);
            return;
        }

        // 檢查 Chart.js 是否已載入
        if (typeof Chart === 'undefined') {
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.error('Chart.js 未載入', 'AnalyticsChart');
            } else {
                Logger.error('[AnalyticsChart] Chart.js 未載入');
            }
            return;
        }

        // 如果圖表已存在，銷毀它並清理
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        // 清理 Chart.js 創建的所有 wrapper 和殘留元素
        const allChildren = Array.from(container.children);
        allChildren.forEach(child => {
            if (child.id === 'analytics-country-chart') {
                return;
            }
            if (child.tagName === 'DIV' && child.contains(chartCanvas)) {
                container.insertBefore(chartCanvas, child);
                child.remove();
            } else if (child.tagName === 'DIV' || (child.tagName === 'CANVAS' && child !== chartCanvas)) {
                child.remove();
            }
        });

        // 確保 canvas 在容器中
        if (!container.contains(chartCanvas)) {
            container.appendChild(chartCanvas);
        }

        // 重置容器和 canvas 的尺寸（避免高度累積）
        container.style.height = '';
        container.style.minHeight = '';
        chartCanvas.style.width = '';
        chartCanvas.style.height = '';
        chartCanvas.width = 0;
        chartCanvas.height = 0;

        // 創建新圖表
        const ctx = chartCanvas.getContext('2d');
        const finalChartType = currentChartType === 'bar' ? 'bar' : 'doughnut';
        
        chartInstance = new Chart(ctx, {
            type: finalChartType,
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
                        position: finalChartType === 'doughnut' ? 'bottom' : 'right',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.95)',
                            font: {
                                size: window.innerWidth <= 480 ? 10 : (window.innerWidth <= 768 ? 11 : 12)
                            },
                            padding: window.innerWidth <= 480 ? 6 : 10,
                            usePointStyle: true,
                            boxWidth: window.innerWidth <= 480 ? 10 : 12
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
                                const value = context.parsed || context.raw || 0;
                                const total = chartData.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} ${t('analytics.visits', '次')} (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: finalChartType === 'bar' ? {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.9)',
                            font: {
                                size: window.innerWidth <= 480 ? 10 : (window.innerWidth <= 768 ? 11 : 12)
                            },
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.15)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.9)',
                            font: {
                                size: window.innerWidth <= 480 ? 9 : (window.innerWidth <= 768 ? 10 : 11),
                                maxRotation: window.innerWidth <= 480 ? 45 : 0,
                                minRotation: window.innerWidth <= 480 ? 45 : 0
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.15)'
                        }
                    }
                } : undefined
            }
        });
    }

    /**
     * 銷毀圖表實例
     */
    function destroy() {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    }

    /**
     * 切換圖表類型
     * @param {string} type - 圖表類型
     * @param {Object} countryStats - 國家統計資料
     */
    function switchChartType(type, countryStats) {
        currentChartType = type;
        updateChart(countryStats, type);
    }

    return {
        updateChart,
        destroy,
        switchChartType,
        generateColors,
        prepareChartData
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.AnalyticsChart = AnalyticsChart;
}

