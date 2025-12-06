/**
 * 網站增強功能模組
 * 包含：載入動畫、粒子背景、主題切換、全螢幕、社群分享、翻頁動畫
 */

const EnhancementsModule = (function () {
    'use strict';

    // 動畫幀 ID（降級方案）
    let animationId = null;
    let parallaxAnimationId = null;

    // ===================================
    // 載入動畫
    // ===================================

    function initLoader() {
        const loader = document.getElementById('loader');
        if (!loader) return;

        function hideLoader() {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.classList.add('hidden');
                loader.remove();

                // 載入動畫完成後顯示語言選單
                showLanguageDropdown();
            }, 500);
        }

        function showLanguageDropdown() {
            // 使用 I18nModule 的方法顯示
            if (typeof I18nModule !== 'undefined' && I18nModule.showLanguageDropdown) {
                I18nModule.showLanguageDropdown();
            } else {
                // 備用方法：直接操作 DOM
                const dropdown = document.getElementById('language-dropdown');
                if (dropdown) {
                    dropdown.style.display = 'block';
                    setTimeout(() => {
                        dropdown.classList.add('visible');
                    }, 50);
                }
            }
        }

        // 當頁面載入完成後隱藏
        if (document.readyState === 'complete') {
            setTimeout(hideLoader, 300);
        } else {
            window.addEventListener('load', () => {
                setTimeout(hideLoader, 800);
            });
        }

        // 安全措施：最多 3 秒後強制隱藏
        setTimeout(() => {
            if (loader && loader.parentNode) {
                hideLoader();
            }
        }, 3000);
    }

    // ===================================
    // 粒子星空背景
    // ===================================

    function initParticles() {
        const canvas = document.getElementById('particles-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationId;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function createParticle() {
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.5 + 0.2,
                twinkle: Math.random() * 0.02 + 0.005
            };
        }

        function initParticleArray() {
            particles = [];
            const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
            for (let i = 0; i < particleCount; i++) {
                particles.push(createParticle());
            }
        }

        function drawParticle(p) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212, 168, 83, ${p.opacity})`;
            ctx.fill();
        }

        function updateParticle(p) {
            p.x += p.speedX;
            p.y += p.speedY;
            p.opacity += p.twinkle;

            if (p.opacity > 0.7 || p.opacity < 0.1) {
                p.twinkle *= -1;
            }

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                updateParticle(p);
                drawParticle(p);
            });

            // 使用 ResourceManager 管理動畫
            if (typeof ResourceManager !== 'undefined') {
                const id = requestAnimationFrame(animate);
                ResourceManager.animations.set('particle-animation', id);
            } else {
                animationId = requestAnimationFrame(animate);
            }
        }

        resize();
        initParticleArray();

        // 使用 ResourceManager 啟動動畫
        if (typeof ResourceManager !== 'undefined') {
            ResourceManager.createAnimation('particle-animation', animate);
        } else {
            animate();
        }

        // 使用 ResourceManager 管理 resize 事件（添加防抖）
        const resizeHandler = () => {
            resize();
            initParticleArray();
        };

        // 使用防抖優化 resize 事件（250ms）
        const debouncedResizeHandler = typeof Helpers !== 'undefined' && Helpers.debounce
            ? Helpers.debounce(resizeHandler, 250)
            : resizeHandler;

        if (typeof ResourceManager !== 'undefined') {
            ResourceManager.addEventListener('particle-resize', window, 'resize', debouncedResizeHandler);
        } else {
            window.addEventListener('resize', debouncedResizeHandler);
        }

        // 頁面隱藏時暫停動畫（使用 ResourceManager）
        const visibilityHandler = () => {
            if (document.hidden) {
                if (typeof ResourceManager !== 'undefined') {
                    ResourceManager.cancelAnimation('particle-animation');
                } else if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            } else {
                if (typeof ResourceManager !== 'undefined') {
                    ResourceManager.createAnimation('particle-animation', animate);
                } else {
                    animate();
                }
            }
        };

        if (typeof ResourceManager !== 'undefined') {
            ResourceManager.addEventListener('particle-visibility', document, 'visibilitychange', visibilityHandler);
        } else {
            document.addEventListener('visibilitychange', visibilityHandler);
        }
    }

    // ===================================
    // 主題切換
    // ===================================

    function initThemeToggle() {
        const themeBtn = document.getElementById('theme-toggle');
        if (!themeBtn) return;

        // 載入已存的主題
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }

        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }

    // ===================================
    // 全螢幕模式
    // ===================================

    function initFullscreen() {
        const fullscreenBtn = document.getElementById('fullscreen-toggle');
        if (!fullscreenBtn) return;

        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().then(() => {
                    document.body.classList.add('fullscreen');
                }).catch(err => {
                    Logger.debug('全螢幕模式失敗:', err);
                });
            } else {
                document.exitFullscreen().then(() => {
                    document.body.classList.remove('fullscreen');
                });
            }
        });

        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                document.body.classList.remove('fullscreen');
            }
        });
    }

    // ===================================
    // 社群分享
    // ===================================

    function initShareButtons() {
        const pageUrl = encodeURIComponent(window.location.href);
        const pageTitle = encodeURIComponent('2027 和平統一倒數');
        const pageDesc = encodeURIComponent('中國與台灣和平統一倒數計時');

        // Twitter
        const twitterBtn = document.getElementById('share-twitter');
        if (twitterBtn) {
            twitterBtn.addEventListener('click', () => {
                window.open(
                    `https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}`,
                    '_blank',
                    'width=600,height=400'
                );
            });
        }

        // Facebook
        const facebookBtn = document.getElementById('share-facebook');
        if (facebookBtn) {
            facebookBtn.addEventListener('click', () => {
                window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`,
                    '_blank',
                    'width=600,height=400'
                );
            });
        }

        // LINE
        const lineBtn = document.getElementById('share-line');
        if (lineBtn) {
            lineBtn.addEventListener('click', () => {
                window.open(
                    `https://social-plugins.line.me/lineit/share?url=${pageUrl}`,
                    '_blank',
                    'width=600,height=400'
                );
            });
        }

        // 複製連結
        const copyBtn = document.getElementById('share-copy');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                    }, 2000);
                });
            });
        }
    }

    // ===================================
    // 數字計數動畫
    // ===================================

    function initCountAnimation() {
        const statValues = document.querySelectorAll('.stat-card-value[data-count]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.count);
                    const duration = 2000;
                    const start = 0;
                    const startTime = performance.now();

                    function updateCount(currentTime) {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const easeProgress = 1 - Math.pow(1 - progress, 3);
                        const current = Math.floor(start + (target - start) * easeProgress);

                        // 格式化數字
                        if (el.textContent.includes('$')) {
                            el.textContent = '$' + current.toLocaleString();
                        } else if (el.textContent.includes(',')) {
                            el.textContent = current.toLocaleString();
                        } else {
                            el.textContent = current;
                        }

                        if (progress < 1) {
                            requestAnimationFrame(updateCount);
                        }
                    }

                    requestAnimationFrame(updateCount);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        statValues.forEach(el => observer.observe(el));
    }

    // ===================================
    // 倒數翻頁動畫增強
    // ===================================

    function initFlipAnimation() {
        // 覆寫原有的更新動畫
        const originalUpdateWithAnimation = window.updateWithAnimation;

        // 監聽倒數值變化
        const countdownValues = document.querySelectorAll('.countdown-value');
        countdownValues.forEach(el => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'characterData' || mutation.type === 'childList') {
                        el.classList.add('flip');
                        setTimeout(() => {
                            el.classList.remove('flip');
                        }, 600);
                    }
                });
            });

            observer.observe(el, {
                characterData: true,
                childList: true,
                subtree: true
            });
        });
    }

    // ===================================
    // 時間軸滾動動畫
    // ===================================

    function initTimelineAnimation() {
        const timelineItems = document.querySelectorAll('.timeline-item');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        }, { threshold: 0.2 });

        timelineItems.forEach(item => {
            item.style.animationPlayState = 'paused';
            observer.observe(item);
        });
    }

    // ===================================
    // 多時區時鐘
    // ===================================

    function initWorldClock() {
        const clocks = {
            taipei: { timeEl: document.getElementById('clock-taipei'), dateEl: document.getElementById('date-taipei'), tz: 'Asia/Taipei' },
            beijing: { timeEl: document.getElementById('clock-beijing'), dateEl: document.getElementById('date-beijing'), tz: 'Asia/Shanghai' },
            washington: { timeEl: document.getElementById('clock-washington'), dateEl: document.getElementById('date-washington'), tz: 'America/New_York' },
            tokyo: { timeEl: document.getElementById('clock-tokyo'), dateEl: document.getElementById('date-tokyo'), tz: 'Asia/Tokyo' }
        };

        function updateClocks() {
            const now = new Date();
            const lang = typeof I18nModule !== 'undefined' ? I18nModule.getLanguage() : 'zh-TW';
            const locale = lang === 'en' ? 'en-US' : (lang === 'zh-CN' ? 'zh-CN' : 'zh-TW');

            Object.values(clocks).forEach(clock => {
                if (!clock.timeEl) return;

                try {
                    // 格式化時間
                    const timeStr = now.toLocaleTimeString(locale, {
                        timeZone: clock.tz,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    });
                    clock.timeEl.textContent = timeStr;

                    // 格式化日期
                    if (clock.dateEl) {
                        const dateStr = now.toLocaleDateString(locale, {
                            timeZone: clock.tz,
                            month: 'short',
                            day: 'numeric',
                            weekday: 'short'
                        });
                        clock.dateEl.textContent = dateStr;
                    }
                } catch (e) {
                    Logger.warn('時鐘更新失敗:', clock.tz, e);
                }
            });
        }

        // 初始更新
        updateClocks();

        // 每秒更新（使用 ResourceManager）
        if (typeof ResourceManager !== 'undefined') {
            ResourceManager.createInterval('world-clock-update', updateClocks, 1000);
        } else {
            setInterval(updateClocks, 1000);
        }

        // 監聽語言變更（使用 ResourceManager）
        if (typeof ResourceManager !== 'undefined') {
            ResourceManager.addEventListener('world-clock-language', window, 'languageChanged', updateClocks);
        } else {
            window.addEventListener('languageChanged', updateClocks);
        }
    }

    // ===================================
    // 軍力對比條動畫
    // ===================================

    function initMilitaryBars() {
        const bars = document.querySelectorAll('.bar-fill');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    const width = bar.style.width;
                    bar.style.width = '0%';
                    setTimeout(() => {
                        bar.style.width = width;
                    }, 100);
                    observer.unobserve(bar);
                }
            });
        }, { threshold: 0.3 });

        bars.forEach(bar => observer.observe(bar));
    }

    // ===================================
    // 時間軸互動化
    // ===================================

    function initTimelineInteraction() {
        const timelineItems = document.querySelectorAll('.timeline-item[data-expandable]');

        timelineItems.forEach(item => {
            const content = item.querySelector('.timeline-content');
            if (!content) return;

            // 檢查是否已經有事件監聽器（由 TimelineView 添加）
            if (content.dataset.listenerAttached === 'true') return;

            content.addEventListener('click', (e) => {
                // 如果點擊的是圖片，不觸發展開
                if (e.target.closest('.timeline-image-container')) return;

                // 關閉其他展開的項目
                timelineItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('expanded')) {
                        otherItem.classList.remove('expanded');
                    }
                });

                // 切換當前項目
                item.classList.toggle('expanded');

                // 如果展開，滾動到可見區域
                if (item.classList.contains('expanded')) {
                    setTimeout(() => {
                        item.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest'
                        });
                    }, 100);
                }
            });

            content.dataset.listenerAttached = 'true';
        });
    }

    // ===================================
    // 慶祝特效
    // ===================================

    let milestoneShown = {};

    function checkMilestones() {
        const TARGET_DATE = new Date('2027-01-01T00:00:00+08:00');
        const now = new Date();
        const diffMs = TARGET_DATE.getTime() - now.getTime();
        const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // 里程碑檢查點
        const milestones = [365, 100, 50, 30, 7, 1, 0];

        milestones.forEach(days => {
            if (daysRemaining === days && !milestoneShown[days]) {
                milestoneShown[days] = true;
                showMilestoneNotification(days);

                if (days <= 100) {
                    triggerCelebration();
                }

                if (days === 0) {
                    triggerFinalCelebration();
                }
            }
        });
    }

    function showMilestoneNotification(days) {
        const notification = document.createElement('div');
        notification.className = 'milestone-notification';

        let message = '';
        let icon = '';

        if (days === 0) {
            icon = '&#127881;'; // 派對
            message = '目標日期已到達！';
        } else if (days === 1) {
            icon = '&#9200;'; // 時鐘
            message = '只剩最後 1 天！';
        } else if (days === 7) {
            icon = '&#128293;'; // 火
            message = '倒數最後一週！';
        } else if (days === 30) {
            icon = '&#127775;'; // 星星
            message = '倒數 30 天！';
        } else if (days === 100) {
            icon = '&#127942;'; // 獎杯
            message = '倒數 100 天！';
        } else if (days === 365) {
            icon = '&#128197;'; // 日曆
            message = '倒數一年！';
        }

        const notificationHTML = `
            <div class="milestone-icon">${icon}</div>
            <h2>${days === 0 ? '到達！' : days + ' 天'}</h2>
            <p>${message}</p>
        `;

        // 使用安全的 HTML 設置
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.safeSetHTML(notification, notificationHTML);
        } else {
            notification.innerHTML = notificationHTML; // 降級方案
        }

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    function triggerCelebration() {
        // 創建煙火效果
        const container = document.createElement('div');
        container.className = 'fireworks-container';
        document.body.appendChild(container);

        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                createFirework(container);
            }, i * 100);
        }

        setTimeout(() => container.remove(), 6000);
    }

    function createFirework(container) {
        const colors = ['#d4a853', '#f0d78c', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6'];
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.6;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'firework';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

            const angle = (i / 20) * Math.PI * 2;
            const velocity = 50 + Math.random() * 50;
            const dx = Math.cos(angle) * velocity;
            const dy = Math.sin(angle) * velocity;

            particle.style.transform = `translate(${dx}px, ${dy}px)`;
            container.appendChild(particle);

            setTimeout(() => particle.remove(), 1000);
        }
    }

    function triggerFinalCelebration() {
        // 添加慶祝類別
        document.querySelector('.countdown-section')?.classList.add('countdown-complete');

        // 創建彩帶效果
        const colors = ['#d4a853', '#f0d78c', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDuration = (2 + Math.random() * 3) + 's';
                confetti.style.width = (5 + Math.random() * 10) + 'px';
                confetti.style.height = (5 + Math.random() * 10) + 'px';
                confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';

                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 5000);
            }, i * 50);
        }
    }

    function initMilestoneChecker() {
        // 初始檢查
        checkMilestones();

        // 每分鐘檢查一次（使用 ResourceManager）
        if (typeof ResourceManager !== 'undefined') {
            ResourceManager.createInterval('milestone-check', checkMilestones, 60000);
        } else {
            setInterval(checkMilestones, 60000);
        }
    }

    // ===================================
    // 滾動觸發動畫系統
    // ===================================

    function initScrollAnimations() {
        // 配置選項
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        // 創建 Intersection Observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // 添加延遲以創建 stagger 效果
                    const delay = entry.target.dataset.stagger ?
                        parseInt(entry.target.dataset.stagger) * 100 : 0;

                    setTimeout(() => {
                        entry.target.classList.add('animated');

                        // 觸發自訂事件
                        entry.target.dispatchEvent(new CustomEvent('animateIn', {
                            detail: { element: entry.target }
                        }));
                    }, delay);

                    // 只觸發一次後取消觀察
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        // 觀察所有需要動畫的元素
        const animatedElements = document.querySelectorAll([
            '.animate-fade-up',
            '.animate-fade-down',
            '.animate-fade-left',
            '.animate-fade-right',
            '.animate-scale',
            '.animate-blur',
            '.animate-on-scroll'
        ].join(','));

        animatedElements.forEach((el, index) => {
            // 如果沒有設定 delay，使用索引自動設定
            if (!el.dataset.stagger) {
                el.dataset.stagger = (index % 8).toString();
            }
            observer.observe(el);
        });
    }

    // ===================================
    // 視差滾動效果
    // ===================================

    function initParallax() {
        const parallaxElements = document.querySelectorAll('.parallax-slow, .parallax-medium, .parallax-fast');

        if (parallaxElements.length === 0) return;

        let ticking = false;

        function updateParallax() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            parallaxElements.forEach(el => {
                const speed = el.classList.contains('parallax-slow') ? 0.5 :
                    el.classList.contains('parallax-fast') ? 0.8 : 0.3;

                const yPos = -(scrollTop * speed);
                el.style.transform = `translate3d(0, ${yPos}px, 0)`;
            });

            ticking = false;
        }

        function requestTick() {
            if (!ticking) {
                // 使用 ResourceManager 管理動畫
                if (typeof ResourceManager !== 'undefined') {
                    const id = window.requestAnimationFrame(updateParallax);
                    ResourceManager.animations.set('parallax-scroll', id);
                } else {
                    window.requestAnimationFrame(updateParallax);
                }
                ticking = true;
            }
        }

        // 使用 ResourceManager 管理 scroll 事件
        if (typeof ResourceManager !== 'undefined') {
            ResourceManager.addEventListener('parallax-scroll', window, 'scroll', requestTick, { passive: true });
        } else {
            window.addEventListener('scroll', requestTick, { passive: true });
        }
        updateParallax(); // 初始執行
    }

    // ===================================
    // 平滑滾動增強
    // ===================================

    function initSmoothScroll() {
        // 為所有內部連結添加平滑滾動
        const links = document.querySelectorAll('a[href^="#"]');

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#' || href === '#!') return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const offsetTop = target.offsetTop - 80; // 偏移量

                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ===================================
    // 初始化
    // ===================================

    function init() {
        initLoader();
        initParticles();
        initThemeToggle();
        initFullscreen();
        initShareButtons();
        initCountAnimation();
        initFlipAnimation();
        initTimelineAnimation();
        initWorldClock();
        initMilitaryBars();
        initTimelineInteraction();
        initMilestoneChecker();
        initScrollAnimations();
        initParallax();
        initSmoothScroll();

        if (typeof Logger !== 'undefined') {
            Logger.info('增強功能模組已啟動', 'EnhancementsModule');
        } else {
            Logger.debug('增強功能模組已啟動');
        }
    }

    /**
     * 清理所有資源
     */
    function cleanup() {
        if (typeof ResourceManager !== 'undefined') {
            // 清理所有 enhancements 相關資源
            ResourceManager.cancelAnimation('particle-animation');
            ResourceManager.removeEventListener('particle-resize');
            ResourceManager.removeEventListener('particle-visibility');
            ResourceManager.clearInterval('world-clock-update');
            ResourceManager.removeEventListener('world-clock-language');
            ResourceManager.clearInterval('milestone-check');
            ResourceManager.cancelAnimation('parallax-scroll');
            ResourceManager.removeEventListener('parallax-scroll');
        }

        // 清理動畫幀（降級方案）
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        if (parallaxAnimationId) {
            cancelAnimationFrame(parallaxAnimationId);
            parallaxAnimationId = null;
        }
    }

    // DOM 載入完成後初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 頁面卸載時清理資源
    window.addEventListener('beforeunload', cleanup);

    // 監聽路由切換事件，暫停粒子動畫以節省資源
    if (typeof window !== 'undefined') {
        window.addEventListener('routeChange', () => {
            // 路由切換時暫停粒子動畫（節省資源）
            if (typeof ResourceManager !== 'undefined') {
                ResourceManager.cancelAnimation('particle-animation');
            } else if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        });
    }

    // 公開 API
    return {
        toggleTheme: () => document.body.classList.toggle('light-theme'),
        toggleFullscreen: () => document.getElementById('fullscreen-toggle')?.click(),
        cleanup
    };
})();

