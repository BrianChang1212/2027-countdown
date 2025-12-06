/**
 * 分析統計組件模組
 * 負責顯示訪客統計資訊和國家列表
 */

const AnalyticsStats = (function() {
    'use strict';

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
     * 格式化數字（添加千分位逗號）
     */
    function formatNumber(num) {
        if (typeof AnalyticsUtils !== 'undefined' && AnalyticsUtils.formatNumber) {
            return AnalyticsUtils.formatNumber(num);
        }
        // 降級方案
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * 獲取國家旗幟
     */
    function getCountryFlag(countryCode) {
        if (typeof AnalyticsUtils !== 'undefined' && AnalyticsUtils.getCountryFlag) {
            return AnalyticsUtils.getCountryFlag(countryCode);
        }
        // 降級方案
        return '🌍';
    }

    /**
     * 更新統計摘要
     * @param {number} totalVisitors - 總訪客數
     * @param {number} countryCount - 國家數量
     */
    function updateSummary(totalVisitors, countryCount) {
        const totalEl = document.getElementById('analytics-total-visitors');
        const countEl = document.getElementById('analytics-country-count');
        const updateEl = document.getElementById('analytics-last-update');

        if (totalEl) {
            totalEl.textContent = formatNumber(totalVisitors);
        }
        if (countEl) {
            countEl.textContent = formatNumber(countryCount);
        }
        if (updateEl) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('zh-TW', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            updateEl.textContent = timeStr;
        }
    }

    /**
     * 更新國家列表顯示
     * @param {Object} countryStats - 國家統計資料
     */
    function updateCountryList(countryStats) {
        const listContainer = document.getElementById('analytics-country-list');
        if (!listContainer) return;

        const sorted = Object.values(countryStats)
            .sort((a, b) => b.count - a.count);

        if (sorted.length === 0) {
            const waitingText = t('analytics.waitingData', '等待訪客數據...');
            const waitingHTML = `<p class="no-data">${waitingText}</p>`;
            // 使用安全的 HTML 設置
            if (typeof DOMUtils !== 'undefined') {
                DOMUtils.safeSetHTML(listContainer, waitingHTML);
            } else {
                listContainer.innerHTML = waitingHTML; // 降級方案
            }
            return;
        }

        const total = Object.values(countryStats).reduce((sum, item) => sum + item.count, 0);

        const countryListHTML = sorted.map((item, index) => {
            const percentage = ((item.count / total) * 100).toFixed(1);
            return `
                <div class="country-item">
                    <div class="country-rank">#${index + 1}</div>
                    <div class="country-flag">${getCountryFlag(item.code)}</div>
                    <div class="country-info">
                        <div class="country-name">${item.name}</div>
                        <div class="country-count">${formatNumber(item.count)} ${t('analytics.visits', '次')}</div>
                    </div>
                    <div class="country-percentage">${percentage}%</div>
                    <div class="country-bar">
                        <div class="country-bar-fill" style="width: ${percentage}%"></div>
                    </div>
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

    return {
        updateSummary,
        updateCountryList,
        formatNumber
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.AnalyticsStats = AnalyticsStats;
}

