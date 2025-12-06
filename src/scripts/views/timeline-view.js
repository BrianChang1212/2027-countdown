/**
 * 歷史時間軸視圖模組
 * 完全獨立運作，不依賴首頁內容
 */

const TimelineView = (function() {
    'use strict';

    // 歷史事件年份列表（按時間順序）
    const EVENT_YEARS = [
        '1949',  // 兩岸分治開始
        '1979',  // 告台灣同胞書
        '1987',  // 開放探親
        '1992',  // 九二共識
        '1993',  // 汪辜會談
        '2005',  // 連胡會
        '2008',  // 三通直航
        '2014',  // 太陽花學運
        '2015',  // 馬習會
        '2019',  // 習近平對台講話
        '2027'   // 和平統一？
    ];

    // 圖片請求快取（避免重複請求）
    const imageCache = {};

    /**
     * 從網路抓取歷史事件圖片
     * 使用 Wikipedia API 和 Wikimedia Commons 獲取相關圖片
     * 帶有請求快取機制，避免重複請求
     */
    async function fetchEventImage(year, eventTitle, lang = 'zh') {
        // 檢查快取
        const cacheKey = `${year}_${lang}`;
        if (imageCache[cacheKey] !== undefined) {
            return imageCache[cacheKey];
        }
        
        try {
            // 根據年份和事件構建 Wikipedia 頁面標題（使用更準確的條目名稱）
            const pageTitles = {
                'zh': {
                    '1949': '中華民國政府遷台',
                    '1979': '告台灣同胞書',
                    '1987': '兩岸關係#開放探親',
                    '1992': '九二共識',
                    '1993': '汪辜會談',
                    '2005': '連胡會',
                    '2008': '兩岸三通',
                    '2014': '太陽花學運',
                    '2015': '馬習會',
                    '2019': '習近平#對台政策',
                    '2027': '台灣海峽'
                },
                'en': {
                    '1949': 'Government of the Republic of China',
                    '1979': 'Message to Compatriots in Taiwan',
                    '1987': 'Cross-Strait relations',
                    '1992': '1992 Consensus',
                    '1993': 'Wang-Koo talks',
                    '2005': '2005 Pan-Blue visits to mainland China',
                    '2008': 'Three Links',
                    '2014': 'Sunflower Student Movement',
                    '2015': '2015 Ma-Xi meeting',
                    '2019': 'Cross-Strait relations',
                    '2027': 'Taiwan Strait'
                },
                'ja': {
                    '1949': '中華民国政府',
                    '1979': '台湾同胞への書簡',
                    '1987': '両岸関係',
                    '1992': '92年コンセンサス',
                    '1993': '汪辜会談',
                    '2005': '連胡会',
                    '2008': '三通直航',
                    '2014': 'ひまわり学生運動',
                    '2015': '馬習会談',
                    '2019': '両岸関係',
                    '2027': '台湾海峡'
                },
                'ko': {
                    '1949': '중화민국 정부',
                    '1979': '대만 동포에게 보내는 편지',
                    '1987': '양안 관계',
                    '1992': '92 합의',
                    '1993': '왕고 회담',
                    '2005': '연호 회담',
                    '2008': '삼통 직항',
                    '2014': '해바라기 학생 운동',
                    '2015': '마-시 회담',
                    '2019': '양안 관계',
                    '2027': '대만 해협'
                }
            };
            
            // 使用備用標題列表（如果主要標題失敗）
            const fallbackTitles = {
                'zh': {
                    '1987': ['兩岸關係', '台灣', '中華民國'],
                    '2008': ['兩岸直航', '台灣海峽'],
                    '2019': ['習近平', '兩岸關係', '台灣問題']
                },
                'en': {
                    '1987': ['Cross-Strait relations', 'Taiwan', 'Republic of China'],
                    '2008': ['Cross-Strait relations', 'Taiwan Strait'],
                    '2019': ['Cross-Strait relations', 'Taiwan', 'Xi Jinping']
                }
            };
            
            const wikiLang = lang === 'zh' ? 'zh' : lang === 'ja' ? 'ja' : lang === 'ko' ? 'ko' : 'en';
            let pageTitle = pageTitles[lang]?.[year] || pageTitles['en'][year] || eventTitle;
            
            // 移除可能的章節標記（#後面的部分）
            pageTitle = pageTitle.split('#')[0].trim();
            
            // 方法1：使用 Wikipedia REST API 獲取頁面摘要（包含縮圖）
            const summaryUrl = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
            
            try {
                // 創建超時控制器（減少超時時間以加快載入）
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                const response = await fetch(summaryUrl, {
                    headers: {
                        'Accept': 'application/json'
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.thumbnail && data.thumbnail.source) {
                        // 獲取更高解析度的圖片（800px）
                        let imageUrl = data.thumbnail.source;
                        imageUrl = imageUrl.replace(/\/\d+px-/, '/800px-');
                        // 快取結果
                        imageCache[cacheKey] = imageUrl;
                        return imageUrl;
                    }
                } else if (response.status === 404 && fallbackTitles[lang]?.[year]) {
                    // 如果主要標題失敗，嘗試備用標題
                    for (const fallbackTitle of fallbackTitles[lang][year]) {
                        try {
                            const fallbackController = new AbortController();
                            const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 3000);
                            
                            const fallbackUrl = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(fallbackTitle)}`;
                            const fallbackResponse = await fetch(fallbackUrl, {
                                headers: { 'Accept': 'application/json' },
                                signal: fallbackController.signal
                            });
                            
                            clearTimeout(fallbackTimeoutId);
                            if (fallbackResponse.ok) {
                                const fallbackData = await fallbackResponse.json();
                                if (fallbackData.thumbnail && fallbackData.thumbnail.source) {
                                    let imageUrl = fallbackData.thumbnail.source;
                                    imageUrl = imageUrl.replace(/\/\d+px-/, '/800px-');
                                    imageCache[cacheKey] = imageUrl;
                                    return imageUrl;
                                }
                            }
                        } catch (e) {
                            // 繼續嘗試下一個備用標題
                            continue;
                        }
                    }
                }
            } catch (e) {
                // 靜默處理，繼續嘗試其他方法
            }
            
            // 方法2：使用 Wikipedia Query API
            const searchUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=800&origin=*`;
            
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                const response = await fetch(searchUrl, {
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                if (response.ok) {
                    const data = await response.json();
                    if (data.query && data.query.pages) {
                        const pageId = Object.keys(data.query.pages)[0];
                        const page = data.query.pages[pageId];
                        if (page.thumbnail && page.thumbnail.source && pageId !== '-1') {
                            imageCache[cacheKey] = page.thumbnail.source;
                            return page.thumbnail.source;
                        }
                    }
                }
            } catch (e) {
                // 靜默處理
            }
            
            // 方法3：使用 Wikimedia Commons 搜尋（僅作為最後手段，因為可能較慢）
            const commonsSearchTerms = {
                '1949': 'Taiwan 1949',
                '1979': 'Taiwan 1979',
                '1987': 'Taiwan 1987',
                '1992': 'Taiwan 1992',
                '1993': 'Wang Koo talks',
                '2005': 'Lien Hu meeting',
                '2008': 'Taiwan Strait',
                '2014': 'Sunflower Movement Taiwan',
                '2015': 'Ma Xi meeting',
                '2019': 'Taiwan Strait',
                '2027': 'Taiwan Strait'
            };
            
            const commonsTerm = commonsSearchTerms[year] || 'Taiwan';
            const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(commonsTerm)}&srnamespace=6&srlimit=1&origin=*`;
            
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                const response = await fetch(commonsUrl, {
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                if (response.ok) {
                    const data = await response.json();
                    if (data.query && data.query.search && data.query.search.length > 0) {
                        const fileName = data.query.search[0].title.replace('File:', '');
                        const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=800`;
                        imageCache[cacheKey] = imageUrl;
                        return imageUrl;
                    }
                }
            } catch (e) {
                // 靜默處理
            }
            
            // 如果都失敗，快取 null 並返回
            imageCache[cacheKey] = null;
            return null;
        } catch (error) {
            // 快取失敗結果，避免重複請求
            imageCache[cacheKey] = null;
            return null;
        }
    }

    /**
     * 獲取翻譯資料
     * 使用 I18nModule 的 API，支援 file:// 協議
     */
    async function getTranslationData() {
        // 嘗試從 I18nModule 獲取當前語言
        const currentLang = (window.I18nModule && window.I18nModule.getLanguage()) || 'zh-TW';
        
        // 如果已經有快取的資料，直接使用
        if (window._timelineTranslationCache && window._timelineTranslationCache[currentLang]) {
            return window._timelineTranslationCache[currentLang];
        }
        
        // 使用 I18nModule 載入翻譯資料（會自動處理 file:// 協議）
        if (window.I18nModule && typeof window.I18nModule.loadLanguage === 'function') {
            try {
                const data = await window.I18nModule.loadLanguage(currentLang);
                if (data) {
                    // 快取資料
                    if (!window._timelineTranslationCache) {
                        window._timelineTranslationCache = {};
                    }
                    window._timelineTranslationCache[currentLang] = data;
                    return data;
                }
            } catch (error) {
                Logger.warn('[TimelineView] 使用 I18nModule 載入失敗:', error);
            }
        }
        
        // 如果 I18nModule 不可用，嘗試直接載入 JSON（僅在 HTTP/HTTPS 協議下）
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            return new Promise((resolve) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', `src/i18n/${currentLang}.json`, true);
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            // 快取資料
                            if (!window._timelineTranslationCache) {
                                window._timelineTranslationCache = {};
                            }
                            window._timelineTranslationCache[currentLang] = data;
                            resolve(data);
                        } catch (e) {
                            Logger.error('[TimelineView] 解析翻譯資料失敗:', e);
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                };
                xhr.onerror = function() {
                    resolve(null);
                };
                xhr.send();
            });
        }
        
        // 如果都失敗，返回 null
        Logger.error('[TimelineView] 無法載入翻譯資料');
        return null;
    }

    /**
     * 創建單個 timeline 項目
     */
    async function createTimelineItem(year, data) {
        const isFuture = year === '2027';
        const itemClass = isFuture ? 'timeline-item timeline-future' : 'timeline-item';
        
        const eventKey = `event${year}`;
        const descKey = `event${year}Desc`;
        const detailKey = `event${year}Detail`;
        const extendedDetailKey = `event${year}ExtendedDetail`;
        const linksKey = `event${year}Links`;
        const linkTitlesKey = `event${year}LinkTitles`;
        const imageKey = `event${year}Image`;
        
        const eventTitle = data.timeline[eventKey] || '';
        const eventDesc = data.timeline[descKey] || '';
        const eventDetail = data.timeline[detailKey] || '';
        const eventExtendedDetail = data.timeline[extendedDetailKey] || '';
        const eventLinks = data.timeline[linksKey] || '';
        const eventLinkTitles = data.timeline[linkTitlesKey] || '';
        let imageUrl = data.timeline[imageKey] || '';
        
        // 調試日誌：確認連結資料是否正確讀取
        if (eventLinks) {
            Logger.debug(`[TimelineView] ${year} 找到連結資料:`, eventLinks.substring(0, 50) + '...');
        } else {
            Logger.warn(`[TimelineView] ${year} 沒有找到連結資料 (key: ${linksKey})`);
        }
        
        // 預設圖片來源（如果網路抓取失敗時使用）
        const defaultImages = {
            '1949': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&h=600&fit=crop',
            '1979': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
            '1987': 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=600&fit=crop',
            '1992': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
            '1993': 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=600&fit=crop',
            '2005': 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=600&fit=crop',
            '2008': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop',
            '2014': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
            '2015': 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=600&fit=crop',
            '2019': 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=600&fit=crop',
            '2027': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop'
        };
        
        // 如果沒有配置圖片，先使用預設圖片，然後異步載入網路圖片
        let shouldFetchImage = false;
        if (!imageUrl) {
            // 先使用預設圖片，讓 DOM 可以立即渲染
                imageUrl = defaultImages[year] || '';
            shouldFetchImage = true; // 標記需要異步載入網路圖片
        }
        
        // 創建 timeline item
        const item = document.createElement('div');
        item.className = itemClass;
        item.setAttribute('data-expandable', '');
        
        // Timeline dot
        const dot = document.createElement('div');
        dot.className = 'timeline-dot';
        item.appendChild(dot);
        
        // Timeline content
        const content = document.createElement('div');
        content.className = 'timeline-content';
        
        // Header row (year + expand icon)
        const headerRow = document.createElement('div');
        headerRow.className = 'timeline-header-row';
        
        const yearSpan = document.createElement('span');
        yearSpan.className = 'timeline-year';
        yearSpan.textContent = year;
        headerRow.appendChild(yearSpan);
        
        const expandIcon = document.createElement('span');
        expandIcon.className = 'timeline-expand-icon';
        expandIcon.textContent = '+';
        headerRow.appendChild(expandIcon);
        
        content.appendChild(headerRow);
        
        // Event title
        const eventTitleEl = document.createElement('h3');
        eventTitleEl.className = 'timeline-event';
        eventTitleEl.textContent = eventTitle;
        content.appendChild(eventTitleEl);
        
        // Event description
        const descEl = document.createElement('p');
        descEl.className = 'timeline-desc';
        descEl.textContent = eventDesc;
        content.appendChild(descEl);
        
        // Image container (if image URL exists)
        let img = null; // 將 img 變數提升到外部，以便異步更新
        if (imageUrl) {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'timeline-image-container';
            
            img = document.createElement('img');
            img.className = 'timeline-image';
            img.alt = eventTitle;
            img.loading = 'lazy';
            img.src = imageUrl;
            
            // 圖片載入錯誤處理
            img.onerror = function() {
                // 圖片載入失敗時，隱藏圖片容器
                Logger.warn(`[TimelineView] 圖片載入失敗 (${year}): ${imageUrl}`);
                this.style.display = 'none';
                imageContainer.style.display = 'none';
            };
            
            // 圖片載入成功處理
            img.onload = function() {
                // 確保圖片正確顯示
                this.style.opacity = '1';
            };
            
            imageContainer.appendChild(img);
            content.appendChild(imageContainer);
            
            // 如果需要，在背景異步載入網路圖片（不阻塞 DOM 創建）
            if (shouldFetchImage && img) {
                const currentLang = (window.I18nModule && window.I18nModule.getLanguage()) || 'zh-TW';
                const langCode = currentLang === 'zh-TW' || currentLang === 'zh-CN' ? 'zh' : 
                               currentLang === 'ja' ? 'ja' : 
                               currentLang === 'ko' ? 'ko' : 'en';
                
                // 在背景載入圖片，載入成功後更新
                fetchEventImage(year, eventTitle, langCode).then(fetchedImage => {
                    if (fetchedImage && img && img.parentElement) {
                        img.src = fetchedImage;
                    }
                }).catch(() => {
                    // 靜默處理錯誤，保持使用預設圖片
                });
            }
        }
        
        // Details section
        const details = document.createElement('div');
        details.className = 'timeline-details';
        
        // 基本描述
        if (eventDetail && eventDetail.trim()) {
            const detailP = document.createElement('p');
            detailP.textContent = eventDetail;
            details.appendChild(detailP);
        }
        
        // 如果有更詳細的資訊，添加額外段落
        if (eventExtendedDetail && eventExtendedDetail.trim()) {
            const extendedP = document.createElement('p');
            extendedP.className = 'timeline-extended-detail';
            extendedP.textContent = eventExtendedDetail;
            details.appendChild(extendedP);
        }
        
        // 如果沒有描述內容，至少顯示一個提示
        if (!eventDetail && !eventExtendedDetail) {
            const noDetailP = document.createElement('p');
            noDetailP.className = 'timeline-no-detail';
            noDetailP.textContent = '暫無詳細資訊';
            noDetailP.style.color = 'var(--color-text-muted)';
            noDetailP.style.fontStyle = 'italic';
            details.appendChild(noDetailP);
        }
        
        // 如果有參考連結，添加參考連結區塊
        if (eventLinks && eventLinks.trim()) {
            const linksContainer = document.createElement('div');
            linksContainer.className = 'timeline-references';
            
            const linksTitle = document.createElement('div');
            linksTitle.className = 'timeline-references-title';
            linksTitle.setAttribute('data-i18n', 'timeline.referencesTitle');
            linksTitle.textContent = data.timeline.referencesTitle || '參考資料';
            linksContainer.appendChild(linksTitle);
            
            const linksList = document.createElement('div');
            linksList.className = 'timeline-references-list';
            
            // 解析連結字串（以逗號分隔）
            const linksArray = eventLinks.split(',').map(link => link.trim()).filter(link => link && link.length > 0);
            
            // 解析標題字串（如果存在）
            let titlesArray = [];
            if (eventLinkTitles && eventLinkTitles.trim()) {
                titlesArray = eventLinkTitles.split(',').map(title => title.trim()).filter(title => title && title.length > 0);
            }
            
            // 確保連結和標題數量一致
            if (linksArray.length > 0) {
                linksArray.forEach((linkUrl, index) => {
                    // 確保連結是有效的 URL
                    if (!linkUrl || linkUrl.trim().length === 0) {
                        return;
                    }
                    
                    const linkItem = document.createElement('a');
                    linkItem.href = linkUrl;
                    linkItem.target = '_blank';
                    linkItem.rel = 'noopener noreferrer';
                    linkItem.className = 'timeline-reference-link';
                    
                    // 優先使用提供的標題，否則從 URL 提取
                    let linkText = '';
                    if (titlesArray[index] && titlesArray[index].trim()) {
                        // 使用提供的標題
                        linkText = titlesArray[index];
                    } else {
                        // 嘗試從 URL 提取有意義的標題
                        try {
                            const url = new URL(linkUrl);
                            if (url.hostname.includes('wikipedia.org')) {
                                const pathParts = url.pathname.split('/');
                                const pageName = pathParts[pathParts.length - 1];
                                if (pageName) {
                                    linkText = decodeURIComponent(pageName.replace(/_/g, ' '));
                                }
                            } else {
                                linkText = url.hostname.replace('www.', '');
                            }
                        } catch (e) {
                            // 如果 URL 解析失敗，使用原始 URL
                            linkText = linkUrl;
                        }
                    }
                    
                    // 如果還是沒有標題，使用 URL
                    if (!linkText || !linkText.trim()) {
                        linkText = linkUrl;
                    }
                    
                    linkItem.textContent = linkText;
                    linkItem.title = linkUrl;
                    
                    // 添加圖標
                    const linkIcon = document.createElement('span');
                    linkIcon.className = 'timeline-reference-icon';
                    linkIcon.textContent = '↗';
                    linkItem.appendChild(linkIcon);
                    
                    linksList.appendChild(linkItem);
                });
                
                // 只有當有連結項目時才添加容器
                if (linksList.children.length > 0) {
                    linksContainer.appendChild(linksList);
                    details.appendChild(linksContainer);
                }
            }
        }
        
        content.appendChild(details);
        item.appendChild(content);
        
        return item;
    }

    /**
     * 渲染完整的 timeline
     */
    async function renderTimeline() {
        const timelineView = document.getElementById('view-timeline');
        if (!timelineView) {
            Logger.error('[TimelineView] 找不到 timeline 視圖容器');
            return false;
        }
        
        const container = timelineView.querySelector('.container');
        if (!container) {
            Logger.error('[TimelineView] 找不到 container');
            return false;
        }
        
        // 等待 I18nModule 準備好（如果可用）
        if (window.I18nModule && typeof window.I18nModule.isReady === 'function') {
            let retries = 10;
            while (!window.I18nModule.isReady() && retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries--;
            }
        }
        
        // 獲取翻譯資料
        const langData = await getTranslationData();
        if (!langData || !langData.timeline) {
            Logger.error('[TimelineView] 無法載入翻譯資料');
            return false;
        }
        
        // 創建 timeline section
        const section = document.createElement('section');
        section.className = 'timeline-section';
        
        // Header
        const header = document.createElement('div');
        header.className = 'timeline-header';
        
        const headerLine1 = document.createElement('div');
        headerLine1.className = 'timeline-header-line';
        header.appendChild(headerLine1);
        
        const title = document.createElement('h2');
        title.className = 'timeline-title';
        
        const icon = document.createElement('span');
        icon.className = 'timeline-icon';
        const iconHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
        `;
        // 使用安全的 HTML 設置
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.safeSetHTML(icon, iconHTML);
        } else {
            icon.innerHTML = iconHTML; // 降級方案
        }
        title.appendChild(icon);
        
        const titleText = document.createElement('span');
        titleText.setAttribute('data-i18n', 'timeline.title');
        titleText.textContent = langData.timeline.title || '重要歷史事件';
        title.appendChild(titleText);
        
        header.appendChild(title);
        
        const headerLine2 = document.createElement('div');
        headerLine2.className = 'timeline-header-line';
        header.appendChild(headerLine2);
        
        section.appendChild(header);
        
        // Timeline container
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'timeline-container';
        
        const timelineLine = document.createElement('div');
        timelineLine.className = 'timeline-line';
        timelineContainer.appendChild(timelineLine);
        
        // 先創建所有 timeline items 的 DOM 結構（不等待圖片）
        const itemPromises = EVENT_YEARS.map(async (year) => {
            return await createTimelineItem(year, langData);
        });
        
        // 並行載入所有 items
        const items = await Promise.all(itemPromises);
        items.forEach(item => {
            timelineContainer.appendChild(item);
        });
        
        section.appendChild(timelineContainer);
        
        // Hint text
        const hint = document.createElement('p');
        hint.className = 'timeline-hint';
        hint.setAttribute('data-i18n', 'timeline.clickToExpand');
        hint.textContent = langData.timeline.clickToExpand || '點擊事件卡片展開詳細說明';
        section.appendChild(hint);
        
        // 清空並插入新內容
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        container.appendChild(section);
        
        // 觸發翻譯更新（更新 data-i18n 屬性）
        if (window.I18nModule && typeof window.I18nModule.updateTranslations === 'function') {
            window.I18nModule.updateTranslations();
        }
        
        return true;
    }

    /**
     * 初始化詳細資訊展開功能
     */
    function initTimelineDetails() {
        const timelineView = document.getElementById('view-timeline');
        if (!timelineView) return;
        
        const timelineItems = timelineView.querySelectorAll('.timeline-item[data-expandable]');
        
        timelineItems.forEach(item => {
            const content = item.querySelector('.timeline-content');
            if (!content) return;
            
            // 檢查是否已經有事件監聽器
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

    /**
     * 載入視圖
     */
    async function load() {
        // 獨立渲染 timeline 內容
        const rendered = await renderTimeline();
        if (!rendered) {
            Logger.error('[TimelineView] 無法渲染 timeline 內容');
            return;
        }
        
        // 等待 DOM 更新
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 初始化詳細資訊展開功能
        initTimelineDetails();
        
        // 滾動到頂部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 卸載視圖
     */
    function unload() {
        // 清理工作（可選：清除事件監聽器）
        const timelineView = document.getElementById('view-timeline');
        if (timelineView) {
            const timelineItems = timelineView.querySelectorAll('.timeline-item[data-expandable]');
            timelineItems.forEach(item => {
                const content = item.querySelector('.timeline-content');
                if (content) {
                    content.dataset.listenerAttached = 'false';
                }
            });
        }
    }

    /**
     * 當語言切換時重新渲染
     */
    async function onLanguageChange() {
        // 檢查 timeline 視圖是否當前顯示
        const timelineView = document.getElementById('view-timeline');
        if (!timelineView || timelineView.style.display === 'none') {
            return;
        }
        
        Logger.debug('[TimelineView] 語言切換，開始重新渲染');
        
        // 獲取當前語言
        const currentLang = (window.I18nModule && window.I18nModule.getLanguage()) || 'zh-TW';
        Logger.debug(`[TimelineView] 當前語言: ${currentLang}`);
        
        // 清除所有翻譯快取（確保重新載入）
        if (window._timelineTranslationCache) {
            // 只清除當前語言的快取，強制重新載入
            if (window._timelineTranslationCache[currentLang]) {
                delete window._timelineTranslationCache[currentLang];
                Logger.debug(`[TimelineView] 已清除語言 ${currentLang} 的快取`);
            }
            // 也清除整個快取物件，確保完全重新載入
            delete window._timelineTranslationCache;
            window._timelineTranslationCache = {};
        }
        
        // 清除圖片快取（因為語言改變，需要重新抓取對應語言的圖片）
        Object.keys(imageCache).forEach(key => {
            delete imageCache[key];
        });
        Logger.debug('[TimelineView] 已清除圖片快取');
        
        // 等待一小段時間，確保 I18nModule 已更新
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 重新渲染整個 timeline
        Logger.debug('[TimelineView] 開始重新渲染 timeline');
        await load();
        Logger.debug('[TimelineView] Timeline 重新渲染完成');
    }

    // 監聽語言切換事件
    if (typeof window !== 'undefined') {
        window.addEventListener('languageChanged', onLanguageChange);
    }

    return {
        load,
        unload,
        onLanguageChange
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.TimelineView = TimelineView;
}

