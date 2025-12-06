/**
 * 預測市場圖表組件模組
 * 負責渲染和更新所有預測市場相關的圖表
 */

const PredictionCharts = (function() {
    'use strict';

    // 圖表實例存儲
    let chartInstances = {
        category: null,
        volume: null,
        probability: null,
        trend: null,
        timeline: null,
        heatmap: null,
        comparison: null
    };

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
     * 獲取類別名稱（支援多語言）
     */
    function getCategoryName(category) {
        const lang = typeof I18nModule !== 'undefined' ? I18nModule.getLanguage() : 'zh-TW';
        const categoryNames = {
            'zh-TW': {
                'military': '軍事',
                'politics': '政治',
                'economy': '經濟',
                'diplomacy': '外交',
                'society': '社會',
                'other': '其他'
            },
            'zh-CN': {
                'military': '军事',
                'politics': '政治',
                'economy': '经济',
                'diplomacy': '外交',
                'society': '社会',
                'other': '其他'
            },
            'en': {
                'military': 'Military',
                'politics': 'Politics',
                'economy': 'Economy',
                'diplomacy': 'Diplomacy',
                'society': 'Society',
                'other': 'Other'
            }
        };
        const names = categoryNames[lang] || categoryNames['zh-TW'];
        return names[category] || category;
    }

    /**
     * 格式化交易量
     */
    function formatVolume(value) {
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}K`;
        }
        return `$${value.toFixed(0)}`;
    }

    /**
     * 渲染類別分佈圖（圓環圖）- 優化版
     * @param {Array} markets - 市場數據陣列
     */
    function renderCategoryChart(markets) {
        const canvas = document.getElementById('category-chart');
        if (!canvas || typeof Chart === 'undefined') return;

        // 統計各類別數量
        const categoryCount = {};
        markets.forEach(market => {
            const cat = market.category || 'other';
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });

        const labels = Object.keys(categoryCount).map(cat => getCategoryName(cat));
        const data = Object.values(categoryCount);
        
        // 專業化配色方案 - 增強對比度和視覺效果
        const colors = [
            'rgba(239, 68, 68, 0.9)',      // 軍事 - 鮮紅色
            'rgba(59, 130, 246, 0.9)',     // 經濟 - 藍色
            'rgba(34, 197, 94, 0.9)',      // 外交 - 綠色
            'rgba(168, 85, 247, 0.9)',     // 政治 - 紫色
            'rgba(251, 146, 60, 0.9)',     // 社會 - 橙色
            'rgba(156, 163, 175, 0.9)'     // 其他 - 灰色
        ];

        // 銷毀舊圖表
        if (chartInstances.category) {
            chartInstances.category.destroy();
            chartInstances.category = null;
        }

        const ctx = canvas.getContext('2d');
        chartInstances.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: 'rgba(212, 168, 83, 1)',
                    borderWidth: 3,
                    hoverBorderWidth: 4,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.95)',
                            font: { 
                                size: window.innerWidth <= 768 ? 11 : 13,
                                weight: '500'
                            },
                            padding: 12,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 12,
                            boxHeight: 12
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        titleColor: 'rgba(255, 255, 255, 1)',
                        bodyColor: 'rgba(255, 255, 255, 0.95)',
                        borderColor: 'rgba(212, 168, 83, 1)',
                        borderWidth: 2,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} ${t('charts.count', '個')} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    /**
     * 渲染交易量分佈圖（水平條形圖）- 優化版
     * @param {Array} markets - 市場數據陣列
     */
    function renderVolumeChart(markets) {
        const canvas = document.getElementById('volume-chart');
        if (!canvas || typeof Chart === 'undefined') return;

        // 使用工具函數解析和排序
        let sortedMarkets;
        if (typeof PredictionFilterService !== 'undefined') {
            sortedMarkets = PredictionFilterService.sortMarkets(markets, 'volume').slice(0, 5);
        } else {
            // 降級方案
            sortedMarkets = [...markets]
                .sort((a, b) => {
                    const volA = parseFloat((a.volume || '').replace(/[^0-9.]/g, '')) || 0;
                    const volB = parseFloat((b.volume || '').replace(/[^0-9.]/g, '')) || 0;
                    return volB - volA;
                })
                .slice(0, 5);
        }

        const labels = sortedMarkets.map(m => {
            const q = (typeof PredictionUtils !== 'undefined' && PredictionUtils.translateQuestion)
                ? PredictionUtils.translateQuestion(m.question || '')
                : (m.question || '');
            return q.length > 40 ? q.substring(0, 40) + '...' : q;
        });
        const data = sortedMarkets.map(m => {
            if (typeof PredictionUtils !== 'undefined' && PredictionUtils.parseVolume) {
                return PredictionUtils.parseVolume(m.volume || '0');
            }
            return parseFloat((m.volume || '').replace(/[^0-9.]/g, '')) || 0;
        });

        // 生成漸變色
        const maxValue = Math.max(...data);
        const gradientColors = data.map((value, index) => {
            const intensity = value / maxValue;
            return `rgba(212, 168, 83, ${0.5 + intensity * 0.4})`;
        });

        // 銷毀舊圖表
        if (chartInstances.volume) {
            chartInstances.volume.destroy();
            chartInstances.volume = null;
        }

        const ctx = canvas.getContext('2d');
        chartInstances.volume = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: t('charts.volumeLabel', '交易量'),
                    data: data,
                    backgroundColor: gradientColors,
                    borderColor: 'rgba(212, 168, 83, 1)',
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        titleColor: 'rgba(255, 255, 255, 1)',
                        bodyColor: 'rgba(255, 255, 255, 0.95)',
                        borderColor: 'rgba(212, 168, 83, 1)',
                        borderWidth: 2,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.x || 0;
                                return `${t('charts.volumeLabel', '交易量')}: ${formatVolume(value)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: {
                                size: window.innerWidth <= 768 ? 10 : 12
                            },
                            callback: function(value) {
                                return formatVolume(value);
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.15)',
                            lineWidth: 1
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: { 
                                size: window.innerWidth <= 768 ? 10 : 12
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    /**
     * 渲染機率分佈圖（散點圖）- 優化版
     * @param {Array} markets - 市場數據陣列
     */
    function renderProbabilityChart(markets) {
        const canvas = document.getElementById('probability-chart');
        if (!canvas || typeof Chart === 'undefined') return;

        const translateQuestion = (typeof PredictionUtils !== 'undefined' && PredictionUtils.translateQuestion)
            ? PredictionUtils.translateQuestion
            : (q => q);

        const parseVolume = (typeof PredictionUtils !== 'undefined' && PredictionUtils.parseVolume)
            ? PredictionUtils.parseVolume
            : (v => parseFloat((v || '').replace(/[^0-9.]/g, '')) || 0);

        const data = markets.map((m, index) => ({
            x: m.yesPercentage || 0,
            y: parseVolume(m.volume || '0'),
            label: translateQuestion(m.question || ''),
            category: m.category || 'other'
        }));

        // 根據類別分配顏色
        const categoryColors = {
            'military': 'rgba(239, 68, 68, 0.8)',
            'economy': 'rgba(59, 130, 246, 0.8)',
            'diplomacy': 'rgba(34, 197, 94, 0.8)',
            'politics': 'rgba(168, 85, 247, 0.8)',
            'society': 'rgba(251, 146, 60, 0.8)',
            'other': 'rgba(156, 163, 175, 0.8)'
        };

        // 銷毀舊圖表
        if (chartInstances.probability) {
            chartInstances.probability.destroy();
            chartInstances.probability = null;
        }

        const ctx = canvas.getContext('2d');
        
        // 按類別分組數據
        const datasets = {};
        data.forEach((point, index) => {
            const cat = point.category;
            if (!datasets[cat]) {
                datasets[cat] = {
                    label: getCategoryName(cat),
                    data: [],
                    backgroundColor: categoryColors[cat] || categoryColors['other'],
                    borderColor: categoryColors[cat] || categoryColors['other'],
                    borderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                };
            }
            datasets[cat].data.push(point);
        });

        chartInstances.probability = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: Object.values(datasets)
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.95)',
                            font: {
                                size: window.innerWidth <= 768 ? 10 : 12
                            },
                            usePointStyle: true,
                            padding: 8
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        titleColor: 'rgba(255, 255, 255, 1)',
                        bodyColor: 'rgba(255, 255, 255, 0.95)',
                        borderColor: 'rgba(212, 168, 83, 1)',
                        borderWidth: 2,
                        padding: 12,
                        callbacks: {
                            title: function(context) {
                                const point = context[0].raw;
                                return point.label && point.label.length > 50 
                                    ? point.label.substring(0, 50) + '...' 
                                    : (point.label || '');
                            },
                            label: function(context) {
                                const x = context.parsed.x;
                                const y = context.parsed.y;
                                return [
                                    `${t('charts.probabilityTooltip', '機率:')} ${x.toFixed(1)}%`,
                                    `${t('charts.volumeTooltip', '交易量:')} ${formatVolume(y)}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: t('charts.probabilityPercent', '機率 (%)'),
                            color: 'rgba(255, 255, 255, 0.95)',
                            font: {
                                size: 13,
                                weight: '600'
                            }
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: {
                                size: window.innerWidth <= 768 ? 10 : 12
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.15)',
                            lineWidth: 1
                        },
                        min: 0,
                        max: 100
                    },
                    y: {
                        title: {
                            display: true,
                            text: t('charts.volumeLabel', '交易量'),
                            color: 'rgba(255, 255, 255, 0.95)',
                            font: {
                                size: 13,
                                weight: '600'
                            }
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: {
                                size: window.innerWidth <= 768 ? 10 : 12
                            },
                            callback: function(value) {
                                return formatVolume(value);
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.15)',
                            lineWidth: 1
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    /**
     * 渲染趨勢分析圖（折線圖）- 優化版
     * @param {Array} markets - 市場數據陣列
     */
    function renderTrendChart(markets) {
        const canvas = document.getElementById('trend-chart');
        if (!canvas || typeof Chart === 'undefined') return;

        // 統計各趨勢的數量
        const trendCount = {
            up: 0,
            down: 0,
            stable: 0
        };

        markets.forEach(market => {
            const trend = market.trend || 'stable';
            if (trendCount.hasOwnProperty(trend)) {
                trendCount[trend]++;
            }
        });

        const labels = [
            t('charts.trendUp', '上升'),
            t('charts.trendStable', '穩定'),
            t('charts.trendDown', '下降')
        ];
        const data = [trendCount.up, trendCount.stable, trendCount.down];
        const pointColors = [
            'rgba(34, 197, 94, 1)',    // 上升 - 綠色
            'rgba(212, 168, 83, 1)',   // 穩定 - 金色
            'rgba(239, 68, 68, 1)'     // 下降 - 紅色
        ];

        // 銷毀舊圖表
        if (chartInstances.trend) {
            chartInstances.trend.destroy();
            chartInstances.trend = null;
        }

        const ctx = canvas.getContext('2d');
        
        // 創建漸變背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(212, 168, 83, 0.3)');
        gradient.addColorStop(1, 'rgba(212, 168, 83, 0.05)');

        chartInstances.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: t('charts.trendDistribution', '趨勢分佈'),
                    data: data,
                    backgroundColor: gradient,
                    borderColor: 'rgba(212, 168, 83, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.5,
                    pointBackgroundColor: pointColors,
                    pointBorderColor: 'rgba(255, 255, 255, 1)',
                    pointBorderWidth: 3,
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    pointHoverBorderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        titleColor: 'rgba(255, 255, 255, 1)',
                        bodyColor: 'rgba(255, 255, 255, 0.95)',
                        borderColor: 'rgba(212, 168, 83, 1)',
                        borderWidth: 2,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed.y || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} ${t('charts.count', '個')} (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: {
                                size: window.innerWidth <= 768 ? 10 : 12
                            },
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.15)',
                            lineWidth: 1
                        }
                    },
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: {
                                size: window.innerWidth <= 768 ? 10 : 12
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.15)',
                            lineWidth: 1
                        }
                    }
                },
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    /**
     * 渲染時間序列圖（新增）
     * @param {Array} markets - 市場數據陣列
     */
    function renderTimelineChart(markets) {
        const canvas = document.getElementById('timeline-chart');
        if (!canvas || typeof Chart === 'undefined') return;

        // 按日期分組統計
        const dateGroups = {};
        markets.forEach(market => {
            const date = market.endDate ? new Date(market.endDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }) : '未知';
            if (!dateGroups[date]) {
                dateGroups[date] = 0;
            }
            dateGroups[date]++;
        });

        const labels = Object.keys(dateGroups).sort();
        const data = labels.map(date => dateGroups[date]);

        // 銷毀舊圖表
        if (chartInstances.timeline) {
            chartInstances.timeline.destroy();
            chartInstances.timeline = null;
        }

        const ctx = canvas.getContext('2d');
        chartInstances.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: t('charts.marketsOverTime', '市場數量'),
                    data: data,
                    backgroundColor: 'rgba(212, 168, 83, 0.2)',
                    borderColor: 'rgba(212, 168, 83, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(212, 168, 83, 1)',
                    pointBorderColor: 'rgba(255, 255, 255, 1)',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        titleColor: 'rgba(255, 255, 255, 1)',
                        bodyColor: 'rgba(255, 255, 255, 0.95)',
                        borderColor: 'rgba(212, 168, 83, 1)',
                        borderWidth: 2,
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.15)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.15)'
                        }
                    }
                }
            }
        });
    }

    /**
     * 渲染類別對比圖（新增）
     * @param {Array} markets - 市場數據陣列
     */
    function renderComparisonChart(markets) {
        const canvas = document.getElementById('comparison-chart');
        if (!canvas || typeof Chart === 'undefined') return;

        // 統計各類別的交易量總和
        const categoryVolume = {};
        markets.forEach(market => {
            const cat = market.category || 'other';
            const parseVolume = (typeof PredictionUtils !== 'undefined' && PredictionUtils.parseVolume)
                ? PredictionUtils.parseVolume
                : (v => parseFloat((v || '').replace(/[^0-9.]/g, '')) || 0);
            const volume = parseVolume(market.volume || '0');
            categoryVolume[cat] = (categoryVolume[cat] || 0) + volume;
        });

        const labels = Object.keys(categoryVolume).map(cat => getCategoryName(cat));
        const data = Object.values(categoryVolume);
        
        const colors = [
            'rgba(239, 68, 68, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(156, 163, 175, 0.8)'
        ];

        // 銷毀舊圖表
        if (chartInstances.comparison) {
            chartInstances.comparison.destroy();
            chartInstances.comparison = null;
        }

        const ctx = canvas.getContext('2d');
        chartInstances.comparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: t('charts.totalVolume', '總交易量'),
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: 'rgba(212, 168, 83, 1)',
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        titleColor: 'rgba(255, 255, 255, 1)',
                        bodyColor: 'rgba(255, 255, 255, 0.95)',
                        borderColor: 'rgba(212, 168, 83, 1)',
                        borderWidth: 2,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y || 0;
                                return `${t('charts.totalVolume', '總交易量')}: ${formatVolume(value)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            callback: function(value) {
                                return formatVolume(value);
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.15)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * 更新所有圖表
     * @param {Array} markets - 市場數據陣列
     */
    function updateAllCharts(markets) {
        if (typeof Chart === 'undefined') {
            if (typeof Logger !== 'undefined') {
                Logger.warn('[PredictionCharts] Chart.js 未載入，跳過圖表渲染');
            }
            return;
        }

        if (!markets || markets.length === 0) {
            return;
        }

        // 等待一小段時間確保 DOM 已準備好
        setTimeout(() => {
            renderCategoryChart(markets);
            renderVolumeChart(markets);
            renderProbabilityChart(markets);
            renderTrendChart(markets);
            
            // 渲染新圖表（如果 canvas 存在）
            const timelineCanvas = document.getElementById('timeline-chart');
            if (timelineCanvas) {
                renderTimelineChart(markets);
            }
            
            const comparisonCanvas = document.getElementById('comparison-chart');
            if (comparisonCanvas) {
                renderComparisonChart(markets);
            }
        }, 100);
    }

    /**
     * 清理所有圖表
     */
    function cleanup() {
        Object.keys(chartInstances).forEach(key => {
            if (chartInstances[key]) {
                chartInstances[key].destroy();
                chartInstances[key] = null;
            }
        });
    }

    return {
        renderCategoryChart,
        renderVolumeChart,
        renderProbabilityChart,
        renderTrendChart,
        renderTimelineChart,
        renderComparisonChart,
        updateAllCharts,
        cleanup
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.PredictionCharts = PredictionCharts;
}

