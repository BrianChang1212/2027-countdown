/**
 * 數據統計視圖模組
 * 提供詳細的兩岸統計數據，包含人口、經濟、地理、交流等多面向資訊
 */

const StatsView = (function () {
    'use strict';

    // 視圖容器元素
    let container = null;

    // Chart.js 圖表實例
    let charts = {
        population: null,
        economy: null,
        trade: null
    };

    /**
     * 等待 Chart.js 載入
     * @param {number} timeout - 超時時間（毫秒）
     * @returns {Promise} 當 Chart.js 載入完成時 resolve
     */
    function waitForChart(timeout = 30000) {
        return new Promise((resolve, reject) => {
            // 如果已經載入，直接 resolve
            if (typeof Chart !== 'undefined') {
                resolve();
                return;
            }

            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                if (typeof Chart !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error('Chart.js 載入超時'));
                }
            }, 100);
        });
    }

    // 統計數據
    const statsData = {
        // 人口統計
        population: {
            taiwan: {
                total: 23.26, // 百萬
                density: 647, // 人/平方公里
                growthRate: 0.08, // %
                urbanRate: 79.2, // %
                ageMedian: 42.3, // 歲
                lifeExpectancy: 80.7 // 歲
            },
            china: {
                total: 1402.0, // 百萬
                density: 148, // 人/平方公里
                growthRate: 0.03, // %
                urbanRate: 64.7, // %
                ageMedian: 38.5, // 歲
                lifeExpectancy: 77.9 // 歲
            }
        },
        // 經濟統計
        economy: {
            taiwan: {
                gdp: 7900, // 億美元
                gdpPerCapita: 33775, // 美元
                gdpGrowth: 2.04, // %
                export: 4794, // 億美元
                import: 4274, // 億美元
                inflation: 1.97 // %
            },
            china: {
                gdp: 177000, // 億美元
                gdpPerCapita: 12720, // 美元
                gdpGrowth: 5.2, // %
                export: 33776, // 億美元
                import: 25652, // 億美元
                inflation: 0.2 // %
            }
        },
        // 地理統計
        geography: {
            taiwan: {
                area: 36193, // 平方公里
                coastline: 1566, // 公里
                highestPoint: 3952, // 公尺（玉山）
                islands: 166 // 個島嶼
            },
            china: {
                area: 9596961, // 平方公里
                coastline: 14500, // 公里
                highestPoint: 8849, // 公尺（珠穆朗瑪峰）
                provinces: 34 // 省級行政區
            },
            strait: {
                width: 130, // 最窄處公里
                averageDepth: 60, // 平均深度公尺
                length: 370 // 長度公里
            }
        },
        // 交流統計
        exchange: {
            trade: {
                annual: 1500, // 億美元
                taiwanToChina: 850, // 億美元（出口）
                chinaToTaiwan: 650, // 億美元（進口）
                growthRate: 7.8 // %
            },
            investment: {
                taiwanToChina: 2000, // 億美元（累計）
                chinaToTaiwan: 2.5, // 億美元（累計）
                taiwanCompanies: 40000 // 在中國的台商企業數
            },
            people: {
                taiwanTourists: 3500000, // 人次/年（疫情前）
                chinaTourists: 1500000, // 人次/年（疫情前）
                taiwanStudents: 15000, // 在中國的台灣學生
                chinaStudents: 12000 // 在台灣的中國學生
            }
        },
        // 分治統計（從倒數計時器獲取）
        separation: {
            days: 0,
            years: 0,
            months: 0
        }
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
     * 格式化數字（千分位）
     */
    function formatNumber(num, decimals = 0) {
        if (typeof num !== 'number') return 'N/A';
        return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * 計算分治時間
     */
    function calculateSeparationTime() {
        const SEPARATION_DATE = new Date('1949-12-07T00:00:00+08:00');
        const now = new Date().getTime();
        const separation = SEPARATION_DATE.getTime();
        const diffMs = now - separation;

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
        const months = Math.floor(days / 30.44);

        return { days, years, months };
    }

    /**
     * 創建統計卡片
     */
    function createStatCard(iconSvg, value, label, desc, color = '#22c55e') {
        const card = document.createElement('div');
        card.className = 'stat-card';

        // 使用安全的 DOM 操作
        const iconDiv = document.createElement('div');
        iconDiv.className = 'stat-card-icon';
        const bgColor = color === '#22c55e' ? '34, 197, 94' : '59, 130, 246';
        iconDiv.style.background = `rgba(${bgColor}, 0.1)`;

        // 安全地設置 SVG
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.safeSetHTML(iconDiv, iconSvg);
        } else {
            iconDiv.innerHTML = iconSvg; // 降級方案
        }

        const valueDiv = document.createElement('div');
        valueDiv.className = 'stat-card-value';
        valueDiv.textContent = value;

        const labelDiv = document.createElement('div');
        labelDiv.className = 'stat-card-label';
        labelDiv.textContent = label;

        card.appendChild(iconDiv);
        card.appendChild(valueDiv);
        card.appendChild(labelDiv);

        if (desc) {
            const descDiv = document.createElement('div');
            descDiv.className = 'stat-card-desc';
            descDiv.textContent = desc;
            card.appendChild(descDiv);
        }

        const iconElement = card.querySelector('.stat-card-icon svg');
        if (iconElement) {
            iconElement.style.color = color;
        }

        return card;
    }

    /**
     * 創建對比卡片
     */
    function createComparisonCard(title, taiwanData, chinaData, unit = '') {
        const card = document.createElement('div');
        card.className = 'stats-comparison-card';

        // 使用安全的 DOM 操作創建元素
        const titleDiv = document.createElement('div');
        titleDiv.className = 'comparison-title';
        titleDiv.textContent = title;

        const gridDiv = document.createElement('div');
        gridDiv.className = 'comparison-grid';

        // 台灣項目
        const taiwanItem = document.createElement('div');
        taiwanItem.className = 'comparison-item taiwan';

        const twFlag = document.createElement('div');
        twFlag.className = 'comparison-flag';
        twFlag.textContent = 'TW';

        const twValue = document.createElement('div');
        twValue.className = 'comparison-value';
        twValue.textContent = taiwanData;

        const twUnit = document.createElement('div');
        twUnit.className = 'comparison-unit';
        twUnit.textContent = unit;

        taiwanItem.appendChild(twFlag);
        taiwanItem.appendChild(twValue);
        taiwanItem.appendChild(twUnit);

        // VS 分隔符
        const vsDiv = document.createElement('div');
        vsDiv.className = 'comparison-vs';
        vsDiv.textContent = 'VS';

        // 中國項目
        const chinaItem = document.createElement('div');
        chinaItem.className = 'comparison-item china';

        const cnFlag = document.createElement('div');
        cnFlag.className = 'comparison-flag';
        cnFlag.textContent = 'CN';

        const cnValue = document.createElement('div');
        cnValue.className = 'comparison-value';
        cnValue.textContent = chinaData;

        const cnUnit = document.createElement('div');
        cnUnit.className = 'comparison-unit';
        cnUnit.textContent = unit;

        chinaItem.appendChild(cnFlag);
        chinaItem.appendChild(cnValue);
        chinaItem.appendChild(cnUnit);

        gridDiv.appendChild(taiwanItem);
        gridDiv.appendChild(vsDiv);
        gridDiv.appendChild(chinaItem);

        // 比例
        const ratioDiv = document.createElement('div');
        ratioDiv.className = 'comparison-ratio';
        const ratio = (parseFloat(chinaData.replace(/,/g, '')) / parseFloat(taiwanData.replace(/,/g, ''))).toFixed(2);
        ratioDiv.textContent = `比例: 1 : ${ratio}`;

        card.appendChild(titleDiv);
        card.appendChild(gridDiv);
        card.appendChild(ratioDiv);

        return card;
    }

    /**
     * 創建圖表容器
     */
    function createChartContainer(id, title) {
        const section = document.createElement('section');
        section.className = 'stats-chart-section';

        // 使用安全的 DOM 操作
        const header = document.createElement('div');
        header.className = 'chart-header';

        const titleH3 = document.createElement('h3');
        titleH3.className = 'chart-title';
        titleH3.textContent = title;
        header.appendChild(titleH3);

        const container = document.createElement('div');
        container.className = 'chart-container';

        const canvas = document.createElement('canvas');
        canvas.id = id;
        container.appendChild(canvas);

        section.appendChild(header);
        section.appendChild(container);

        return section;
    }

    /**
     * 初始化人口統計圖表
     */
    function initPopulationChart() {
        const canvas = document.getElementById('chart-population');
        if (!canvas || typeof Chart === 'undefined') return;

        const ctx = canvas.getContext('2d');
        if (charts.population) {
            charts.population.destroy();
        }

        charts.population = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [
                    t('stats.detail.totalPop', '總人口'),
                    t('stats.detail.density', '人口密度'),
                    t('stats.detail.growthRate', '增長率'),
                    t('stats.detail.urbanRate', '城市化率'),
                    t('stats.detail.medianAge', '中位數年齡'),
                    t('stats.detail.lifeExpectancy', '平均壽命')
                ],
                datasets: [
                    {
                        label: t('military.taiwan', '台灣'),
                        data: [
                            statsData.population.taiwan.total,
                            statsData.population.taiwan.density,
                            statsData.population.taiwan.growthRate * 100,
                            statsData.population.taiwan.urbanRate,
                            statsData.population.taiwan.ageMedian,
                            statsData.population.taiwan.lifeExpectancy
                        ],
                        backgroundColor: 'rgba(34, 197, 94, 0.7)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 2
                    },
                    {
                        label: t('military.china', '中國'),
                        data: [
                            statsData.population.china.total,
                            statsData.population.china.density,
                            statsData.population.china.growthRate * 100,
                            statsData.population.china.urbanRate,
                            statsData.population.china.ageMedian,
                            statsData.population.china.lifeExpectancy
                        ],
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'center',
                        labels: {
                            color: '#e5e7eb',
                            font: {
                                size: 14
                            },
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#e5e7eb',
                        bodyColor: '#e5e7eb',
                        borderColor: 'rgba(34, 197, 94, 0.5)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.dataIndex === 0) {
                                    label += formatNumber(context.parsed.y) + ' ' + t('stats.million', '百萬');
                                } else if (context.dataIndex === 1) {
                                    label += formatNumber(context.parsed.y) + ' 人/km²';
                                } else if (context.dataIndex === 2) {
                                    label += formatNumber(context.parsed.y, 2) + '%';
                                } else if (context.dataIndex === 3) {
                                    label += formatNumber(context.parsed.y, 1) + '%';
                                } else if (context.dataIndex === 4) {
                                    label += formatNumber(context.parsed.y, 1) + ' ' + t('stats.detail.years', '歲');
                                } else {
                                    label += formatNumber(context.parsed.y, 1) + ' ' + t('stats.detail.years', '歲');
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 12
                            },
                            padding: 8
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 11
                            },
                            padding: 8
                        },
                        grid: {
                            display: false,
                            drawBorder: false
                        }
                    }
                }
            }
        });
    }

    /**
     * 初始化經濟統計圖表
     */
    function initEconomyChart() {
        const canvas = document.getElementById('chart-economy');
        if (!canvas || typeof Chart === 'undefined') return;

        const ctx = canvas.getContext('2d');
        if (charts.economy) {
            charts.economy.destroy();
        }

        charts.economy = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [
                    t('stats.detail.gdp', 'GDP'),
                    t('stats.detail.gdpPerCapita', '人均 GDP'),
                    t('stats.detail.gdpGrowth', 'GDP 增長率'),
                    t('stats.detail.export', '出口額'),
                    t('stats.detail.import', '進口額'),
                    t('stats.detail.inflation', '通膨率')
                ],
                datasets: [
                    {
                        label: t('military.taiwan', '台灣'),
                        data: [
                            statsData.economy.taiwan.gdp,
                            statsData.economy.taiwan.gdpPerCapita / 100,
                            statsData.economy.taiwan.gdpGrowth,
                            statsData.economy.taiwan.export,
                            statsData.economy.taiwan.import,
                            statsData.economy.taiwan.inflation
                        ],
                        backgroundColor: 'rgba(34, 197, 94, 0.7)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 2
                    },
                    {
                        label: t('military.china', '中國'),
                        data: [
                            statsData.economy.china.gdp,
                            statsData.economy.china.gdpPerCapita / 100,
                            statsData.economy.china.gdpGrowth,
                            statsData.economy.china.export,
                            statsData.economy.china.import,
                            statsData.economy.china.inflation
                        ],
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'center',
                        labels: {
                            color: '#e5e7eb',
                            font: {
                                size: 14
                            },
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#e5e7eb',
                        bodyColor: '#e5e7eb',
                        borderColor: 'rgba(34, 197, 94, 0.5)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.dataIndex === 0) {
                                    label += formatNumber(context.parsed.y) + ' ' + t('stats.billion', '億美元');
                                } else if (context.dataIndex === 1) {
                                    label += formatNumber(context.parsed.y * 100) + ' ' + t('economy.usd', '美元');
                                } else if (context.dataIndex === 2 || context.dataIndex === 5) {
                                    label += formatNumber(context.parsed.y, 2) + '%';
                                } else {
                                    label += formatNumber(context.parsed.y) + ' ' + t('stats.billion', '億美元');
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 12
                            },
                            padding: 8
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 11
                            },
                            padding: 8
                        },
                        grid: {
                            display: false,
                            drawBorder: false
                        }
                    }
                }
            }
        });
    }

    /**
     * 初始化貿易統計圖表
     */
    function initTradeChart() {
        const canvas = document.getElementById('chart-trade');
        if (!canvas || typeof Chart === 'undefined') return;

        const ctx = canvas.getContext('2d');
        if (charts.trade) {
            charts.trade.destroy();
        }

        // 模擬貿易趨勢數據（過去5年）
        const years = ['2019', '2020', '2021', '2022', '2023'];
        const taiwanToChina = [780, 760, 820, 890, 850];
        const chinaToTaiwan = [600, 580, 630, 680, 650];

        charts.trade = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: t('stats.detail.taiwanExport', '台灣對中國出口'),
                        data: taiwanToChina,
                        borderColor: 'rgba(34, 197, 94, 1)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: t('stats.detail.chinaExport', '中國對台灣出口'),
                        data: chinaToTaiwan,
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'center',
                        labels: {
                            color: '#e5e7eb',
                            font: {
                                size: 14
                            },
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#e5e7eb',
                        bodyColor: '#e5e7eb',
                        borderColor: 'rgba(34, 197, 94, 0.5)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ': ' + formatNumber(context.parsed.y) + ' ' + t('stats.billion', '億美元');
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 12
                            },
                            padding: 8,
                            callback: function (value) {
                                return formatNumber(value) + ' ' + t('stats.billion', '億');
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 12
                            },
                            padding: 8
                        },
                        grid: {
                            display: false,
                            drawBorder: false
                        }
                    }
                }
            }
        });
    }

    /**
     * 渲染統計視圖內容
     */
    async function renderContent() {
        if (!container) return;

        // 計算分治時間
        const separation = calculateSeparationTime();
        statsData.separation = separation;

        // 清空容器
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // 創建標題區域
        const header = document.createElement('header');
        header.className = 'stats-view-header';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'stats-view-title';

        const h1 = document.createElement('h1');
        h1.setAttribute('data-i18n', 'stats.detail.title');
        h1.textContent = '詳細數據統計';

        const p = document.createElement('p');
        p.className = 'stats-view-subtitle';
        p.setAttribute('data-i18n', 'stats.detail.subtitle');
        p.textContent = '兩岸全方位數據對比與分析';

        titleDiv.appendChild(h1);
        titleDiv.appendChild(p);
        header.appendChild(titleDiv);
        container.appendChild(header);

        // 分治統計區塊
        const separationSection = document.createElement('section');
        separationSection.className = 'stats-section';

        // 使用安全的 HTML 設置
        const separationHTML = `
            <div class="stats-header">
                <div class="stats-header-line"></div>
                <h2 class="stats-title">
                    <span class="stats-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </span>
                    <span data-i18n="separation.title">兩岸分治紀錄</span>
                </h2>
                <div class="stats-header-line"></div>
            </div>
            <div class="separation-stats-detailed">
                <div class="separation-stat-large">
                    <div class="stat-large-value" id="stats-separation-days">${formatNumber(separation.days)}</div>
                    <div class="stat-large-label" data-i18n="separation.days">天</div>
                    <div class="stat-large-desc" data-i18n="separation.sinceDesc">自 1949 年 12 月 7 日</div>
                </div>
                <div class="separation-stat-large">
                    <div class="stat-large-value" id="stats-separation-years">${formatNumber(separation.years, 2)}</div>
                    <div class="stat-large-label" data-i18n="separation.years">年</div>
                    <div class="stat-large-desc" data-i18n="separation.yearsDesc">分治歲月</div>
                </div>
                <div class="separation-stat-large">
                    <div class="stat-large-value" id="stats-separation-months">${formatNumber(separation.months)}</div>
                    <div class="stat-large-label" data-i18n="stats.detail.months">個月</div>
                    <div class="stat-large-desc" data-i18n="stats.detail.monthsDesc">累計月數</div>
                </div>
            </div>
        `;

        // 使用安全的 HTML 設置
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.safeSetHTML(separationSection, separationHTML);
        } else {
            separationSection.innerHTML = separationHTML; // 降級方案
        }

        container.appendChild(separationSection);

        // 人口統計區塊
        const populationSection = document.createElement('section');
        populationSection.className = 'stats-section';

        // 構建 HTML 字串然後安全地設置
        const populationHTML = `
            <div class="stats-header">
                <div class="stats-header-line"></div>
                <h2 class="stats-title">
                    <span class="stats-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </span>
                    <span data-i18n="stats.detail.population">人口統計</span>
                </h2>
                <div class="stats-header-line"></div>
            </div>
            <div class="stats-grid detailed-grid">
                ${createStatCard(
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            formatNumber(statsData.population.taiwan.total, 2),
            t('stats.million', '百萬人口'),
            t('stats.taiwanPop', '台灣人口')
        ).outerHTML}
                ${createStatCard(
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            formatNumber(statsData.population.china.total, 1),
            t('stats.million', '百萬人口'),
            t('stats.chinaPop', '中國人口'),
            '#3b82f6'
        ).outerHTML}
                ${createStatCard(
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line><circle cx="12" cy="12" r="2"></circle><path d="M3 15h18"></path><path d="M15 3v18"></path></svg>',
            formatNumber(statsData.population.taiwan.density),
            '人/km²',
            t('stats.detail.taiwanDensity', '台灣人口密度')
        ).outerHTML}
                ${createStatCard(
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line><circle cx="12" cy="12" r="2"></circle><path d="M3 15h18"></path><path d="M15 3v18"></path></svg>',
            formatNumber(statsData.population.china.density),
            '人/km²',
            t('stats.detail.chinaDensity', '中國人口密度'),
            '#3b82f6'
        ).outerHTML}
            </div>
        `;

        // 使用安全的 HTML 設置
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.safeSetHTML(populationSection, populationHTML);
        } else {
            populationSection.innerHTML = populationHTML; // 降級方案
        }

        container.appendChild(populationSection);

        // 人口統計圖表
        const populationChartSection = createChartContainer('chart-population', t('stats.detail.populationChart', '人口統計對比圖'));
        container.appendChild(populationChartSection);

        // 經濟統計區塊
        const economySection = document.createElement('section');
        economySection.className = 'stats-section';

        // 構建 HTML 字串然後安全地設置
        const economyHTML = `
            <div class="stats-header">
                <div class="stats-header-line"></div>
                <h2 class="stats-title">
                    <span class="stats-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </span>
                    <span data-i18n="economy.title">經濟數據</span>
                </h2>
                <div class="stats-header-line"></div>
            </div>
            <div class="stats-grid detailed-grid">
                ${createComparisonCard(
            t('economy.gdp', 'GDP'),
            formatNumber(statsData.economy.taiwan.gdp),
            formatNumber(statsData.economy.china.gdp),
            t('stats.billion', '億美元')
        ).outerHTML}
                ${createComparisonCard(
            t('economy.gdpPerCapita', '人均 GDP'),
            formatNumber(statsData.economy.taiwan.gdpPerCapita),
            formatNumber(statsData.economy.china.gdpPerCapita),
            t('economy.usd', '美元')
        ).outerHTML}
            </div>
        `;

        // 使用安全的 HTML 設置
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.safeSetHTML(economySection, economyHTML);
        } else {
            economySection.innerHTML = economyHTML; // 降級方案
        }

        container.appendChild(economySection);

        // 經濟統計圖表
        const economyChartSection = createChartContainer('chart-economy', t('stats.detail.economyChart', '經濟數據對比圖'));
        container.appendChild(economyChartSection);

        // 地理統計區塊
        const geographySection = document.createElement('section');
        geographySection.className = 'stats-section';

        // 構建 HTML 字串然後安全地設置
        const geographyHTML = `
            <div class="stats-header">
                <div class="stats-header-line"></div>
                <h2 class="stats-title">
                    <span class="stats-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                    </span>
                    <span data-i18n="stats.detail.geography">地理統計</span>
                </h2>
                <div class="stats-header-line"></div>
            </div>
            <div class="stats-grid detailed-grid">
                ${createStatCard(
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"></path><path d="M3 9h18"></path><path d="M9 3v18"></path><path d="M3 15h18"></path><path d="M15 3v18"></path></svg>',
            formatNumber(statsData.geography.taiwan.area),
            'km²',
            t('stats.detail.taiwanArea', '台灣面積')
        ).outerHTML}
                ${createStatCard(
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"></path><path d="M3 9h18"></path><path d="M9 3v18"></path><path d="M3 15h18"></path><path d="M15 3v18"></path></svg>',
            formatNumber(statsData.geography.china.area),
            'km²',
            t('stats.detail.chinaArea', '中國面積'),
            '#3b82f6'
        ).outerHTML}
                ${createStatCard(
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 12h8"></path></svg>',
            formatNumber(statsData.geography.strait.width),
            t('stats.km', '公里'),
            t('stats.distance', '台灣海峽最窄處')
        ).outerHTML}
            </div>
        `;

        // 使用安全的 HTML 設置
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.safeSetHTML(geographySection, geographyHTML);
        } else {
            geographySection.innerHTML = geographyHTML; // 降級方案
        }

        container.appendChild(geographySection);

        // 交流統計區塊
        const exchangeSection = document.createElement('section');
        exchangeSection.className = 'stats-section';

        // 構建 HTML 字串然後安全地設置
        const exchangeHTML = `
            <div class="stats-header">
                <div class="stats-header-line"></div>
                <h2 class="stats-title">
                    <span class="stats-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            <line x1="13" y1="11" x2="21" y2="11"></line>
                            <line x1="17" y1="7" x2="17" y2="15"></line>
                        </svg>
                    </span>
                    <span data-i18n="stats.detail.exchange">兩岸交流統計</span>
                </h2>
                <div class="stats-header-line"></div>
            </div>
            <div class="stats-grid detailed-grid">
                ${createStatCard(
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"></path><circle cx="12" cy="12" r="1"></circle></svg>',
            formatNumber(statsData.exchange.trade.annual),
            t('stats.billion', '億美元'),
            t('stats.detail.annualTrade', '年貿易額')
        ).outerHTML}
                ${createStatCard(
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path><path d="M12 2v20"></path><circle cx="12" cy="12" r="2"></circle><path d="M12 2a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2z"></path></svg>',
            formatNumber(statsData.exchange.investment.taiwanToChina),
            t('stats.billion', '億美元'),
            t('stats.detail.taiwanInvestment', '台商對中累計投資')
        ).outerHTML}
            </div>
        `;

        // 使用安全的 HTML 設置
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.safeSetHTML(exchangeSection, exchangeHTML);
        } else {
            exchangeSection.innerHTML = exchangeHTML; // 降級方案
        }

        container.appendChild(exchangeSection);

        // 貿易統計圖表
        const tradeChartSection = createChartContainer('chart-trade', t('stats.detail.tradeChart', '兩岸貿易趨勢'));
        container.appendChild(tradeChartSection);

        // 更新翻譯
        if (window.I18nModule && typeof window.I18nModule.updateTranslations === 'function') {
            window.I18nModule.updateTranslations();
        }

        // 等待 Chart.js 載入後初始化圖表
        waitForChart()
            .then(() => {
                setTimeout(() => {
                    initPopulationChart();
                    initEconomyChart();
                    initTradeChart();
                }, 300);
            })
            .catch(err => {
                Logger.warn('[StatsView] Chart.js 載入超時:', err.message);
            });
    }

    /**
     * 處理語言變化
     */
    async function handleLanguageChange() {
        // 檢查視圖是否當前顯示
        if (!container || container.style.display === 'none') {
            return;
        }

        // 重新渲染整個內容以更新所有翻譯文字
        await renderContent();
    }

    /**
     * 載入視圖
     */
    async function load() {
        container = document.getElementById('view-stats');
        if (!container) {
            Logger.error('[StatsView] 找不到視圖容器 #view-stats');
            return;
        }

        // 監聽語言變化事件
        window.addEventListener('languageChanged', handleLanguageChange);

        // 滾動到頂部
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 渲染內容
        await renderContent();

        Logger.debug('[StatsView] 統計視圖已載入');
    }

    /**
     * 卸載視圖
     */
    function unload() {
        // 移除語言變化監聽器
        window.removeEventListener('languageChanged', handleLanguageChange);

        // 銷毀所有圖表實例
        Object.values(charts).forEach(chart => {
            if (chart) {
                chart.destroy();
                chart = null;
            }
        });

        Logger.debug('[StatsView] 統計視圖已卸載');
    }

    return {
        load,
        unload
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.StatsView = StatsView;
}

