/**
 * 2027 和平統一倒數計時器
 * 目標日期：2027年1月1日 00:00:00
 * 包含：倒數計時、進度環、分治年數計數器
 */

(function() {
    'use strict';

    // 目標日期設定
    const TARGET_DATE = new Date('2027-01-01T00:00:00+08:00');
    
    /**
     * 獲取今天的日期（UTC+8 時區）作為起始日期
     * 用於計算進度百分比 - 從今天開始計算進度
     */
    function getTodayInUTC8() {
        const now = new Date();
        // 獲取 UTC+8 時區的當前日期
        // 計算 UTC+8 時區的時間戳
        const utc8Offset = 8 * 60 * 60 * 1000; // UTC+8 的毫秒偏移量
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000); // 轉為 UTC 時間戳
        const utc8Time = utcTime + utc8Offset; // 轉為 UTC+8 時間戳
        const utc8Date = new Date(utc8Time);
        
        // 獲取 UTC+8 時區的年、月、日
        const year = utc8Date.getUTCFullYear();
        const month = String(utc8Date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(utc8Date.getUTCDate()).padStart(2, '0');
        
        // 創建 UTC+8 時區的今天 00:00:00
        const dateStr = `${year}-${month}-${day}T00:00:00+08:00`;
        return new Date(dateStr);
    }
    
    // 起始日期（用於計算進度）- 從今天開始計算
    const START_DATE = getTodayInUTC8();
    
    // 分治起始日期：1949年12月7日（中華民國政府遷台）
    const SEPARATION_DATE = new Date('1949-12-07T00:00:00+08:00');

    // DOM 元素
    const elements = {
        days: document.getElementById('days'),
        hours: document.getElementById('hours'),
        minutes: document.getElementById('minutes'),
        seconds: document.getElementById('seconds'),
        progressRing: document.getElementById('progress-ring-fill'),
        progressPercent: document.getElementById('progress-percent'),
        separationDays: document.getElementById('separation-days'),
        separationYears: document.getElementById('separation-years'),
        nextMilestone: document.getElementById('next-milestone'),
        milestoneCountdown: document.getElementById('milestone-countdown')
    };

    // 進度環周長
    const RING_CIRCUMFERENCE = 2 * Math.PI * 90; // r = 90

    // 上一次的值（用於動畫效果）
    let previousValues = {
        days: null,
        hours: null,
        minutes: null,
        seconds: null
    };

    // 定時器引用（用於清理）
    let countdownInterval = null;

    /**
     * 計算倒數時間
     * @returns {Object} 包含天、時、分、秒的物件
     */
    function calculateTimeRemaining() {
        const now = new Date().getTime();
        const target = TARGET_DATE.getTime();
        const diff = target - now;

        // 如果已經過了目標日期
        if (diff <= 0) {
            return {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                expired: true
            };
        }

        // 計算各時間單位
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return {
            days,
            hours,
            minutes,
            seconds,
            expired: false
        };
    }

    /**
     * 格式化數字（補零）
     * @param {number} num - 要格式化的數字
     * @param {number} digits - 位數
     * @returns {string} 格式化後的字串
     */
    function formatNumber(num, digits = 2) {
        return num.toString().padStart(digits, '0');
    }

    /**
     * 更新顯示並添加動畫效果
     * @param {string} key - 元素鍵名
     * @param {string} value - 新值
     */
    function updateWithAnimation(key, value) {
        const element = elements[key];
        
        if (previousValues[key] !== value) {
            // 添加更新動畫類別
            element.classList.add('updating');
            
            // 更新值
            element.textContent = value;
            
            // 移除動畫類別
            setTimeout(() => {
                element.classList.remove('updating');
            }, 300);
            
            // 記錄新值
            previousValues[key] = value;
        }
    }

    /**
     * 計算並更新進度環
     */
    function updateProgressRing() {
        if (!elements.progressRing || !elements.progressPercent) return;

        const now = new Date().getTime();
        const start = START_DATE.getTime();
        const end = TARGET_DATE.getTime();
        
        // 確保時間順序正確
        if (start >= end) {
            if (typeof DebugUtils !== 'undefined') {
                DebugUtils.error('起始日期不能晚於或等於目標日期', 'CountdownTimer');
            } else {
                Logger.error('[CountdownTimer] 起始日期不能晚於或等於目標日期');
            }
            return;
        }
        
        const totalDuration = end - start;
        
        // 如果現在時間早於起始時間，百分比為 0
        if (now < start) {
            elements.progressRing.style.strokeDashoffset = RING_CIRCUMFERENCE;
            elements.progressPercent.textContent = '0.0%';
            return;
        }
        
        // 如果現在時間已經過了目標時間，百分比為 100
        if (now >= end) {
            elements.progressRing.style.strokeDashoffset = 0;
            elements.progressPercent.textContent = '100.0%';
            return;
        }
        
        // 計算已過時間
        const elapsed = now - start;
        
        // 計算百分比 (0-100)，使用更精確的計算
        let percent = (elapsed / totalDuration) * 100;
        
        // 確保百分比在合理範圍內（避免浮點數誤差）
        percent = Math.max(0, Math.min(100, percent));
        
        // 四捨五入到小數點後 1 位，避免浮點數誤差
        percent = Math.round(percent * 10) / 10;
        
        // 更新進度環（使用剩餘百分比計算 offset）
        const offset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE;
        elements.progressRing.style.strokeDashoffset = offset;
        
        // 更新百分比文字
        elements.progressPercent.textContent = percent.toFixed(1) + '%';
        
        // 調試信息（可在開發時啟用）
        if (typeof DebugUtils !== 'undefined') {
            const totalDays = totalDuration / (1000 * 60 * 60 * 24);
            const elapsedDays = elapsed / (1000 * 60 * 60 * 24);
            DebugUtils.log(`進度計算: ${elapsedDays.toFixed(1)} 天 / ${totalDays.toFixed(1)} 天 = ${percent.toFixed(1)}%`, 'CountdownTimer');
        }
    }

    /**
     * 計算分治天數和年數
     */
    function calculateSeparationTime() {
        const now = new Date().getTime();
        const separation = SEPARATION_DATE.getTime();
        const diffMs = now - separation;
        
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
        
        return { days, years };
    }

    /**
     * 計算下一個里程碑
     */
    function calculateNextMilestone() {
        const separation = calculateSeparationTime();
        const currentYears = Math.floor(separation.years);
        
        // 里程碑年份：每 5 年、10 年為重要里程碑
        const milestones = [75, 76, 77, 78, 79, 80, 85, 90, 95, 100];
        let nextMilestone = milestones.find(m => m > currentYears) || 100;
        
        // 計算距離下一個里程碑的時間
        const milestoneDate = new Date(SEPARATION_DATE);
        milestoneDate.setFullYear(milestoneDate.getFullYear() + nextMilestone);
        
        const now = new Date().getTime();
        const diffMs = milestoneDate.getTime() - now;
        const daysUntil = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        return {
            year: nextMilestone,
            daysUntil: daysUntil,
            date: milestoneDate
        };
    }

    /**
     * 格式化數字（添加千分位）
     */
    function formatWithCommas(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * 更新分治計數器顯示
     */
    function updateSeparationCounter() {
        if (!elements.separationDays || !elements.separationYears) return;

        const separation = calculateSeparationTime();
        const milestone = calculateNextMilestone();
        
        // 更新分治天數
        elements.separationDays.textContent = formatWithCommas(separation.days);
        
        // 更新分治年數
        elements.separationYears.textContent = separation.years.toFixed(2);
        
        // 更新里程碑
        if (elements.nextMilestone) {
            // 根據語言設定顯示
            const lang = typeof I18nModule !== 'undefined' ? I18nModule.getLanguage() : 'zh-TW';
            if (lang === 'en') {
                elements.nextMilestone.textContent = milestone.year + ' Years';
            } else {
                elements.nextMilestone.textContent = milestone.year + ' 年';
            }
        }
        
        // 更新里程碑倒數
        if (elements.milestoneCountdown) {
            const lang = typeof I18nModule !== 'undefined' ? I18nModule.getLanguage() : 'zh-TW';
            if (lang === 'en') {
                elements.milestoneCountdown.textContent = `(${formatWithCommas(milestone.daysUntil)} days)`;
            } else {
                elements.milestoneCountdown.textContent = `(${formatWithCommas(milestone.daysUntil)} 天後)`;
            }
        }
    }

    /**
     * 更新倒數顯示
     */
    function updateCountdown() {
        const time = calculateTimeRemaining();

        if (time.expired) {
            // 倒數結束
            updateWithAnimation('days', '000');
            updateWithAnimation('hours', '00');
            updateWithAnimation('minutes', '00');
            updateWithAnimation('seconds', '00');
            
            // 更新進度環為 100%
            if (elements.progressRing) {
                elements.progressRing.style.strokeDashoffset = 0;
            }
            if (elements.progressPercent) {
                elements.progressPercent.textContent = '100%';
            }
            
            // 可以在這裡添加倒數結束後的處理
            document.querySelector('.subtitle').textContent = '歷史性的一刻已經到來';
            return;
        }

        // 更新各個時間單位
        updateWithAnimation('days', formatNumber(time.days, 3));
        updateWithAnimation('hours', formatNumber(time.hours));
        updateWithAnimation('minutes', formatNumber(time.minutes));
        updateWithAnimation('seconds', formatNumber(time.seconds));
        
        // 更新進度環
        updateProgressRing();
        
        // 更新分治計數器
        updateSeparationCounter();
    }

    /**
     * 清理定時器
     */
    function cleanup() {
        if (countdownInterval) {
            if (typeof TimerManager !== 'undefined' && TimerManager.clear) {
                TimerManager.clear('countdown-timer');
            } else {
                clearInterval(countdownInterval);
            }
            countdownInterval = null;
        }
    }

    /**
     * 初始化倒數計時器
     */
    function init() {
        // 清理舊的定時器（如果存在）
        cleanup();

        // 立即執行一次
        updateCountdown();

        // 每秒更新一次（使用 TimerManager 或降級方案）
        if (typeof TimerManager !== 'undefined' && TimerManager.create) {
            TimerManager.create('countdown-timer', updateCountdown, 1000);
        } else {
            countdownInterval = setInterval(updateCountdown, 1000);
        }

        // 頁面可見性變化時重新同步
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                updateCountdown();
            }
        });

        if (typeof DebugUtils !== 'undefined') {
            DebugUtils.success('倒數計時器已啟動', 'CountdownTimer');
            DebugUtils.log(`目標日期: ${TARGET_DATE.toLocaleString('zh-TW')}`, 'CountdownTimer');
        }
    }

    // 當 DOM 載入完成後初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 頁面卸載時清理
    window.addEventListener('beforeunload', cleanup);

    // 公開清理函數
    if (typeof window !== 'undefined') {
        window.CountdownTimer = {
            init,
            cleanup,
            update: updateCountdown
        };
    }
})();

