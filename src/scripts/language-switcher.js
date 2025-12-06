/**
 * 國際化 (i18n) 模組 - 重寫版本
 * 支援繁體中文、簡體中文、英文、日文、韓文
 */

(function () {
    'use strict';

    // 支援的語言
    const SUPPORTED_LANGS = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko'];

    // 語言資訊
    const LANG_INFO = {
        'zh-TW': { flag: '繁', name: '繁體中文' },
        'zh-CN': { flag: '简', name: '简体中文' },
        'en': { flag: 'EN', name: 'English' },
        'ja': { flag: '日', name: '日本語' },
        'ko': { flag: '한', name: '한국어' }
    };

    // 預設語言
    const DEFAULT_LANG = 'zh-TW';

    // 當前語言
    let currentLang = DEFAULT_LANG;

    // 翻譯資料快取
    const translationsCache = {};

    // 內嵌翻譯資料（作為 file:// 協議的備用方案）
    // 從 scripts/i18n/embedded-translations.js 載入
    let embeddedTranslations = {};

    // 嘗試載入內嵌翻譯模組
    if (typeof window !== 'undefined' && window.EmbeddedTranslations) {
        embeddedTranslations = window.EmbeddedTranslations.data || {};
    }

    // 如果內嵌翻譯模組未載入，使用以下備用資料
    // 注意：完整的翻譯資料應從 scripts/i18n/embedded-translations.js 載入
    // 如果 embeddedTranslations 為空，則使用備用資料
    if (!embeddedTranslations || Object.keys(embeddedTranslations).length === 0) {
        embeddedTranslations = {};
    }

    // 從外部檔案載入內嵌翻譯資料 (src/scripts/i18n/embedded-translations.js)
    const fallbackEmbeddedTranslations = window.fallbackEmbeddedTranslations || {};

    // 如果內嵌翻譯為空，使用備用資料
    if (!embeddedTranslations || Object.keys(embeddedTranslations).length === 0) {
        embeddedTranslations = fallbackEmbeddedTranslations;
    } else {
        // 合併備用資料，確保所有語言都有完整的翻譯
        for (const lang in fallbackEmbeddedTranslations) {
            if (!embeddedTranslations[lang] || !embeddedTranslations[lang].stats?.detail) {
                if (!embeddedTranslations[lang]) {
                    embeddedTranslations[lang] = fallbackEmbeddedTranslations[lang];
                } else {
                    // 合併 stats.detail
                    if (!embeddedTranslations[lang].stats) {
                        embeddedTranslations[lang].stats = {};
                    }
                    if (!embeddedTranslations[lang].stats.detail && fallbackEmbeddedTranslations[lang].stats?.detail) {
                        embeddedTranslations[lang].stats.detail = fallbackEmbeddedTranslations[lang].stats.detail;
                    }
                }
            }
        }
    }

    // 是否已初始化
    let initialized = false;

    // ===================================
    // Debug 功能（僅輸出到控制台）
    // ===================================

    /**
     * 添加 debug 日誌（僅輸出到控制台）
     */
    function addDebugLog(message, type = 'info') {
        const consoleMethod = type === 'error' ? 'error' :
            type === 'warning' ? 'warn' :
                type === 'success' ? 'log' : 'log';
        console[consoleMethod](`[I18n ${type.toUpperCase()}] ${message}`);
    }


    // 鍵值映射
    const keyMappings = {
        'taiwan': 'header.taiwan',
        'china': 'header.china',
        'titleText': 'header.titleText',
        'subtitle': 'header.subtitle',
        'days': 'countdown.days',
        'hours': 'countdown.hours',
        'minutes': 'countdown.minutes',
        'seconds': 'countdown.seconds',
        'targetDate': 'targetDate.label',
        'predictionTitle': 'prediction.title',
        'predictionBadge': 'prediction.badge',
        'predictionQuestion': 'prediction.question',
        'statNo': 'prediction.statNo',
        'statYes': 'prediction.statYes',
        'realTimeData': 'prediction.realTimeData',
        'blockchainVerified': 'prediction.blockchainVerified',
        'viewMarketData': 'prediction.viewMarketData',
        'infoTitle': 'prediction.infoTitle',
        'infoText': 'prediction.infoText',
        'infoItem1': 'prediction.infoItem1',
        'infoItem2': 'prediction.infoItem2',
        'infoItem3': 'prediction.infoItem3',
        'infoDisclaimer': 'prediction.disclaimer',
        'regionNotice': 'prediction.regionNotice',
        'pred.military': 'prediction.military',
        'pred.blockade': 'prediction.blockade',
        'pred.peace': 'prediction.peace',
        'pred.usIntervene': 'prediction.usIntervene',
        'pred.q1': 'prediction.q1',
        'pred.q2': 'prediction.q2',
        'pred.q3': 'prediction.q3',
        'pred.q4': 'prediction.q4',
        'newsTitle': 'news.title',
        'taiwanNews': 'news.taiwanNews',
        'intlNews': 'news.intlNews',
        'crossStraitNews': 'news.crossStraitNews',
        'loadingNews': 'news.loading',
        'newsError': 'news.error',
        'retryBtn': 'news.retry',
        'newsSource': 'news.source',
        'refreshBtn': 'news.refresh',
        'readMore': 'news.readMore',
        'liveNews': 'ticker.live',
        'disclaimer': 'footer.disclaimer'
    };

    /**
     * 取得語言檔案路徑
     */
    function getLanguagePath(lang) {
        // 取得當前 HTML 文件的目錄
        const currentUrl = window.location.href;
        const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);

        // 構建完整路徑
        const fullPath = `${baseUrl}src/i18n/${lang}.json`;

        return fullPath;
    }

    /**
     * 載入語言檔案（使用 XMLHttpRequest，更可靠）
     * 如果 file:// 協議或載入失敗，使用內嵌翻譯資料
     */
    function loadLanguage(lang, forceReload = false) {
        return new Promise((resolve, reject) => {
            // 如果強制重新載入，清除緩存
            if (forceReload && translationsCache[lang]) {
                addDebugLog(`強制重新載入，清除緩存: ${lang}`, 'info');
                delete translationsCache[lang];
            }
            
            if (translationsCache[lang]) {
                resolve(translationsCache[lang]);
                return;
            }

            // 檢查是否為 file:// 協議，如果是，直接使用內嵌資料
            if (window.location.protocol === 'file:') {
                addDebugLog(`檢測到 file:// 協議，使用內嵌翻譯資料: ${lang}`, 'info');
                if (embeddedTranslations[lang]) {
                    translationsCache[lang] = embeddedTranslations[lang];
                    addDebugLog(`✅ 內嵌翻譯載入成功: ${lang}`, 'success');
                    resolve(embeddedTranslations[lang]);
                    return;
                } else {
                    addDebugLog(`❌ 找不到內嵌翻譯: ${lang}`, 'error');
                    reject(new Error(`找不到內嵌翻譯: ${lang}`));
                    return;
                }
            }

            // 計算正確的路徑
            const url = getLanguagePath(lang);
            addDebugLog(`開始載入語言: ${lang}`, 'info');
            addDebugLog(`檔案路徑: ${url}`, 'info');
            addDebugLog(`當前頁面: ${window.location.href}`, 'info');
            addDebugLog(`協議: ${window.location.protocol}`, 'info');

            // 使用 XMLHttpRequest 而不是 fetch，因為它對 file:// 協議更友好
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);

            addDebugLog(`發送 XHR 請求: GET ${url}`, 'info');

            xhr.onload = function () {
                addDebugLog(`XHR 回應: status=${xhr.status}, readyState=${xhr.readyState}`, 'info');
                addDebugLog(`回應長度: ${xhr.responseText?.length || 0} bytes`, 'info');

                if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
                    // 0 表示 file:// 協議，但需要檢查是否有回應內容
                    try {
                        if (!xhr.responseText) {
                            throw new Error('回應為空');
                        }
                        const data = JSON.parse(xhr.responseText);
                        translationsCache[lang] = data;
                        addDebugLog(`✅ 語言載入成功: ${lang}`, 'success');
                        addDebugLog(`已載入的鍵: ${Object.keys(data).join(', ')}`, 'info');
                        // 檢查 language 鍵是否存在
                        if (data.language) {
                            addDebugLog(`✅ language 鍵存在，包含: ${Object.keys(data.language).join(', ')}`, 'success');
                            if (data.language.switchSuccess) {
                                addDebugLog(`✅ language.switchSuccess = "${data.language.switchSuccess}"`, 'success');
                            } else {
                                addDebugLog(`❌ language.switchSuccess 不存在`, 'error');
                            }
                        } else {
                            addDebugLog(`❌ language 鍵不存在`, 'error');
                        }
                        resolve(data);
                    } catch (e) {
                        addDebugLog(`❌ JSON 解析失敗: ${e.message}`, 'error');
                        addDebugLog(`回應內容預覽: ${xhr.responseText.substring(0, 200)}`, 'error');
                        // 嘗試使用內嵌資料作為備用
                        if (embeddedTranslations[lang]) {
                            addDebugLog(`使用內嵌翻譯作為備用: ${lang}`, 'warning');
                            translationsCache[lang] = embeddedTranslations[lang];
                            resolve(embeddedTranslations[lang]);
                        } else {
                            reject(new Error(`JSON 解析失敗: ${e.message}`));
                        }
                    }
                } else {
                    addDebugLog(`❌ HTTP 錯誤: status=${xhr.status}, readyState=${xhr.readyState}`, 'error');
                    // 嘗試使用內嵌資料作為備用
                    if (embeddedTranslations[lang]) {
                        addDebugLog(`使用內嵌翻譯作為備用: ${lang}`, 'warning');
                        translationsCache[lang] = embeddedTranslations[lang];
                        resolve(embeddedTranslations[lang]);
                    } else {
                        reject(new Error(`HTTP ${xhr.status}`));
                    }
                }
            };

            xhr.onerror = function (e) {
                addDebugLog(`❌ 網路錯誤: 無法載入 ${url}`, 'error');
                addDebugLog(`錯誤詳情: ${e.type || 'unknown'}`, 'error');
                // 嘗試使用內嵌資料作為備用
                if (embeddedTranslations[lang]) {
                    addDebugLog(`使用內嵌翻譯作為備用: ${lang}`, 'warning');
                    translationsCache[lang] = embeddedTranslations[lang];
                    resolve(embeddedTranslations[lang]);
                } else {
                    reject(new Error(`網路錯誤，無法載入 ${url}`));
                }
            };

            xhr.ontimeout = function () {
                addDebugLog(`❌ 載入超時: ${url}`, 'error');
                // 嘗試使用內嵌資料作為備用
                if (embeddedTranslations[lang]) {
                    addDebugLog(`使用內嵌翻譯作為備用: ${lang}`, 'warning');
                    translationsCache[lang] = embeddedTranslations[lang];
                    resolve(embeddedTranslations[lang]);
                } else {
                    reject(new Error('載入超時'));
                }
            };

            xhr.timeout = 10000; // 10 秒超時
            xhr.send();
        });
    }

    /**
     * 從巢狀物件取得值
     */
    function getValue(obj, path) {
        if (!obj || !path) return undefined;
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * 獲取翻譯
     */
    function translate(key, lang = currentLang) {
        // 如果沒有指定語言，使用當前語言
        const targetLang = lang || currentLang;
        
        // 獲取目標語言的翻譯資料
        let langData = translationsCache[targetLang];
        
        // 如果目標語言沒有資料，嘗試使用預設語言
        if (!langData) {
            langData = translationsCache[DEFAULT_LANG];
            if (!langData) {
                addDebugLog(`翻譯資料不存在: 目標語言=${targetLang}, 預設語言=${DEFAULT_LANG}`, 'warning');
                return null;
            }
        }

        // 檢查鍵值映射（用於向後兼容）
        const mappedKey = keyMappings[key] || key;
        
        // 嘗試從目標語言獲取翻譯
        let value = getValue(langData, mappedKey);
        
        // 調試：如果找不到值，檢查數據結構
        if (typeof value !== 'string' && key === 'language.switchSuccess') {
            addDebugLog(`調試: 查找鍵 "${mappedKey}" 在語言 ${targetLang}`, 'info');
            addDebugLog(`調試: langData 存在: ${!!langData}`, 'info');
            addDebugLog(`調試: langData.language 存在: ${!!langData?.language}`, 'info');
            addDebugLog(`調試: langData.language.switchSuccess 存在: ${!!langData?.language?.switchSuccess}`, 'info');
            if (langData?.language) {
                addDebugLog(`調試: language 鍵的內容: ${JSON.stringify(Object.keys(langData.language))}`, 'info');
            }
        }
        
        if (typeof value === 'string') {
            addDebugLog(`翻譯成功: ${key} -> ${mappedKey} = "${value}" (語言: ${targetLang})`, 'info');
            return value;
        }

        // 如果目標語言找不到，嘗試預設語言
        if (targetLang !== DEFAULT_LANG) {
            const defaultData = translationsCache[DEFAULT_LANG];
            if (defaultData) {
                const defaultValue = getValue(defaultData, mappedKey);
                if (typeof defaultValue === 'string') {
                    addDebugLog(`使用預設語言翻譯: ${key} -> ${mappedKey} = "${defaultValue}"`, 'info');
                    return defaultValue;
                }
            }
        }

        addDebugLog(`翻譯失敗: 找不到鍵 "${key}" (映射為 "${mappedKey}") 在語言 ${targetLang}`, 'warning');
        return null;
    }

    /**
     * 更新頁面翻譯
     */
    function updateTranslations() {
        const langData = translationsCache[currentLang];
        if (!langData) {
            addDebugLog(`❌ 語言資料不存在: ${currentLang}`, 'error');
            return;
        }

        addDebugLog(`開始更新頁面翻譯，語言: ${currentLang}`, 'info');

        let count = 0;
        let failed = 0;
        const failedKeys = [];

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (!key) return;

            const text = translate(key);
            if (text) {
                el.textContent = text;
                count++;
            } else {
                failed++;
                failedKeys.push(key);
            }
        });

        // 處理 placeholder 屬性
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (!key) return;

            const text = translate(key);
            if (text) {
                el.setAttribute('placeholder', text);
                count++;
            } else {
                failed++;
                failedKeys.push(key);
            }
        });

        // 更新頁面標題
        if (langData.page?.title) {
            document.title = langData.page.title;
            addDebugLog(`頁面標題已更新: ${langData.page.title}`, 'success');
        }

        // 更新 meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && langData.page?.description) {
            metaDesc.setAttribute('content', langData.page.description);
        }

        // 更新 html lang
        document.documentElement.lang = currentLang;

        addDebugLog(`✅ 翻譯更新完成: 成功 ${count} 個，失敗 ${failed} 個`, failed > 0 ? 'warning' : 'success');
        if (failed > 0 && failedKeys.length > 0) {
            addDebugLog(`失敗的鍵: ${failedKeys.slice(0, 10).join(', ')}${failedKeys.length > 10 ? '...' : ''}`, 'warning');
        }
    }

    /**
     * 更新下拉選單顯示
     */
    function updateDropdown() {
        const info = LANG_INFO[currentLang];
        if (!info) return;

        const flagEl = document.getElementById('current-lang-flag');
        const nameEl = document.getElementById('current-lang-name');

        if (flagEl) flagEl.textContent = info.flag;
        if (nameEl) nameEl.textContent = info.name;

        // 更新選項狀態
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === currentLang);
        });
    }

    /**
     * 切換語言
     */
    async function switchLanguage(lang) {
        addDebugLog('========== 開始切換語言 ==========', 'info');
        addDebugLog(`目標語言: ${lang}`, 'info');
        addDebugLog(`當前語言: ${currentLang}`, 'info');

        if (!SUPPORTED_LANGS.includes(lang)) {
            addDebugLog(`❌ 不支援的語言: ${lang}`, 'error');
            addDebugLog(`支援的語言: ${SUPPORTED_LANGS.join(', ')}`, 'info');
            return;
        }

        if (lang === currentLang) {
            addDebugLog('已是當前語言，關閉選單', 'info');
            closeDropdown();
            return;
        }

        try {
            // 載入語言資料
            if (!translationsCache[lang]) {
                addDebugLog('語言資料未快取，開始載入...', 'info');
                await loadLanguage(lang);
            } else {
                addDebugLog('使用快取的語言資料', 'info');
                // 驗證緩存數據是否完整
                if (translationsCache[lang] && !translationsCache[lang].language) {
                    addDebugLog(`警告: 緩存數據缺少 language 鍵，強制重新載入`, 'warning');
                    // 強制重新載入
                    await loadLanguage(lang, true);
                }
            }

            if (!translationsCache[lang]) {
                addDebugLog(`❌ 無法載入語言: ${lang}`, 'error');
                // 嘗試使用預設語言
                if (translationsCache[DEFAULT_LANG]) {
                    addDebugLog(`使用預設語言 ${DEFAULT_LANG} 作為備用`, 'warning');
                    currentLang = DEFAULT_LANG;
                    updateDropdown();
                    closeDropdown();
                    return;
                }
                addDebugLog('預設語言也無法載入，請檢查檔案是否存在', 'error');
                closeDropdown();
                return;
            }

            addDebugLog('✅ 語言資料載入成功', 'success');

            // 更新語言
            const oldLang = currentLang;
            currentLang = lang;
            localStorage.setItem('preferredLanguage', lang);
            addDebugLog(`語言變更: ${oldLang} → ${currentLang}`, 'success');

            // 更新 UI
            addDebugLog('更新下拉選單顯示...', 'info');
            updateDropdown();

            addDebugLog('更新頁面翻譯...', 'info');
            updateTranslations();

            closeDropdown();

            // 觸發事件
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: lang }
            }));

            addDebugLog(`✅ 語言切換完成: ${lang}`, 'success');
            addDebugLog('========== 切換完成 ==========', 'success');

            // 關閉下拉選單，避免被 toast 通知覆蓋
            closeDropdown();
            
            // 顯示成功通知
            // 使用 setTimeout 確保 DOM 和 Helpers 都已準備好
            setTimeout(() => {
                try {
                    // 檢查 Helpers 是否可用
                    if (typeof Helpers === 'undefined' || !Helpers.showToast) {
                        addDebugLog('Helpers.showToast 不可用，跳過 toast 通知', 'warning');
                        return;
                    }

                    // 獲取語言名稱
                    const langName = LANG_INFO[lang]?.name || lang;
                    
                    // 嘗試獲取翻譯
                    let successMessage = null;
                    const translationKey = 'language.switchSuccess';
                    
                    // 檢查翻譯緩存
                    if (translationsCache[lang]) {
                        addDebugLog(`嘗試從緩存獲取翻譯: ${translationKey} (語言: ${lang})`, 'info');
                        successMessage = translate(translationKey, lang);
                        addDebugLog(`翻譯結果: ${successMessage || 'null'}`, successMessage ? 'success' : 'warning');
                    } else {
                        addDebugLog(`翻譯緩存中沒有語言: ${lang}`, 'warning');
                    }
                    
                    // 如果翻譯失敗，使用備用訊息
                    if (!successMessage) {
                        // 根據語言生成備用訊息
                        const fallbackMessages = {
                            'zh-TW': `語言已切換為 ${langName}`,
                            'zh-CN': `语言已切换为 ${langName}`,
                            'en': `Language switched to ${langName}`,
                            'ja': `言語が ${langName} に切り替わりました`,
                            'ko': `언어가 ${langName}(으)로 전환되었습니다`
                        };
                        successMessage = fallbackMessages[lang] || fallbackMessages['zh-TW'];
                        addDebugLog(`使用備用訊息: ${successMessage}`, 'info');
                    }
                    
                    // 顯示 toast
                    Helpers.showToast(successMessage, 'success', 3000);
                    addDebugLog(`✅ Toast 通知已顯示: ${successMessage}`, 'success');
                } catch (error) {
                    addDebugLog(`❌ 顯示 toast 時發生錯誤: ${error.message}`, 'error');
                    if (typeof DebugUtils !== 'undefined') {
                        DebugUtils.error('Toast error:', 'I18nModule', error);
                    } else {
                        Logger.error('[I18nModule] Toast error:', error);
                    }
                }
            }, 100);
        } catch (error) {
            addDebugLog(`❌ 切換語言失敗: ${error.message}`, 'error');
            addDebugLog(`錯誤堆疊: ${error.stack || 'N/A'}`, 'error');
            closeDropdown();
        }
    }

    /**
     * 下拉選單控制
     */
    let dropdownOpen = false;

    function toggleDropdown() {
        const dropdown = document.getElementById('language-dropdown');
        if (!dropdown) return;

        dropdownOpen = !dropdownOpen;
        dropdown.classList.toggle('open', dropdownOpen);
    }

    function closeDropdown() {
        const dropdown = document.getElementById('language-dropdown');
        if (!dropdown) return;

        dropdownOpen = false;
        dropdown.classList.remove('open');
    }

    /**
     * 顯示語言選單
     */
    function showDropdown() {
        const dropdown = document.getElementById('language-dropdown');
        if (dropdown) {
            dropdown.style.display = 'block';
            requestAnimationFrame(() => {
                dropdown.classList.add('visible');
            });
        }
    }

    /**
     * 綁定事件
     */
    function setupEvents() {
        // 使用事件委派，確保動態元素也能響應
        document.addEventListener('click', function (e) {
            const dropdown = document.getElementById('language-dropdown');
            if (!dropdown) {
                addDebugLog('❌ 找不到語言下拉選單元素', 'error');
                return;
            }

            // 點擊切換按鈕
            const toggle = e.target.closest('#lang-toggle');
            if (toggle) {
                e.preventDefault();
                e.stopPropagation();
                addDebugLog('點擊切換按鈕', 'info');
                toggleDropdown();
                return;
            }

            // 點擊語言選項（包括按鈕內部的 span 元素）
            const option = e.target.closest('.lang-option');
            if (option) {
                e.preventDefault();
                e.stopPropagation();
                const lang = option.getAttribute('data-lang') || option.dataset.lang;
                addDebugLog(`點擊語言選項，data-lang: ${lang}`, 'info');
                addDebugLog(`選項元素類別: ${option.className}`, 'info');

                if (!lang) {
                    addDebugLog('❌ 無法取得語言代碼', 'error');
                    return;
                }

                if (!SUPPORTED_LANGS.includes(lang)) {
                    addDebugLog(`❌ 無效的語言代碼: ${lang}`, 'error');
                    addDebugLog(`支援的語言: ${SUPPORTED_LANGS.join(', ')}`, 'info');
                    return;
                }

                addDebugLog(`調用 switchLanguage(${lang})`, 'info');
                switchLanguage(lang);
                return;
            }

            // 點擊外部關閉
            if (!dropdown.contains(e.target)) {
                closeDropdown();
            }
        }, true); // 使用捕獲階段，確保優先處理

        // ESC 關閉
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeDropdown();
            }
        });

        addDebugLog('事件已綁定（使用事件委派，捕獲階段）', 'success');
    }

    /**
     * 檢測偏好語言
     */
    function detectLanguage() {
        const saved = localStorage.getItem('preferredLanguage');
        if (saved && SUPPORTED_LANGS.includes(saved)) {
            return saved;
        }

        const browserLang = navigator.language || navigator.userLanguage;

        if (browserLang.startsWith('zh')) {
            return browserLang.includes('TW') || browserLang.includes('HK') || browserLang.includes('MO')
                ? 'zh-TW' : 'zh-CN';
        }

        if (browserLang.startsWith('en')) return 'en';
        if (browserLang.startsWith('ja')) return 'ja';
        if (browserLang.startsWith('ko')) return 'ko';

        return DEFAULT_LANG;
    }

    /**
     * 初始化
     */
    async function init() {
        if (initialized) return;
        initialized = true;

        addDebugLog('i18n 模組開始初始化...', 'info');

        // 綁定事件
        setupEvents();

        try {
            // 檢測語言
            const preferredLang = detectLanguage();
            addDebugLog(`檢測到的偏好語言: ${preferredLang}`, 'info');

            // 載入預設語言（必須成功）
            try {
                await loadLanguage(DEFAULT_LANG);
            } catch (error) {
                addDebugLog(`❌ 無法載入預設語言 ${DEFAULT_LANG}: ${error.message}`, 'error');
                addDebugLog('將使用 HTML 中的預設文字', 'warning');
            }

            // 載入偏好語言（如果不同且預設語言已載入）
            if (preferredLang !== DEFAULT_LANG && translationsCache[DEFAULT_LANG]) {
                try {
                    await loadLanguage(preferredLang);
                } catch (error) {
                    addDebugLog(`無法載入偏好語言 ${preferredLang}，使用預設語言`, 'warning');
                }
            }

            // 設定當前語言（確保至少有一個語言可用）
            if (translationsCache[preferredLang]) {
                currentLang = preferredLang;
            } else if (translationsCache[DEFAULT_LANG]) {
                currentLang = DEFAULT_LANG;
            } else {
                addDebugLog('❌ 無法載入任何語言檔案！', 'error');
                currentLang = DEFAULT_LANG; // 至少設定變數
            }

            // 更新 UI
            addDebugLog('更新下拉選單顯示...', 'info');
            updateDropdown();

            // 如果有翻譯資料且不是預設語言，更新翻譯
            if (currentLang !== 'zh-TW' && translationsCache[currentLang]) {
                updateTranslations();
            }

            addDebugLog(`✅ 初始化完成，當前語言: ${currentLang}`, 'success');
            addDebugLog(`已載入的語言: ${Object.keys(translationsCache).join(', ')}`, 'info');

            // 背景預載其他語言（不阻塞）
            SUPPORTED_LANGS.forEach(lang => {
                if (!translationsCache[lang]) {
                    loadLanguage(lang).catch(err => {
                        if (typeof DebugUtils !== 'undefined') {
                            DebugUtils.warning(`背景載入失敗 ${lang}:`, 'I18nModule', err.message);
                        }
                    });
                }
            });

        } catch (error) {
            addDebugLog(`❌ 初始化過程發生錯誤: ${error.message}`, 'error');
            addDebugLog(`錯誤堆疊: ${error.stack || 'N/A'}`, 'error');
            // 即使出錯也嘗試更新 UI
            updateDropdown();
        }
    }

    // 公開 API
    window.I18nModule = {
        t: translate,
        setLanguage: switchLanguage,
        getLanguage: () => currentLang,
        updateTranslations,
        showLanguageDropdown: showDropdown,
        loadLanguage,
        isReady: () => Object.keys(translationsCache).length > 0
    };

    // 全域快捷方式
    window.t = function (key) {
        const result = translate(key);
        return result !== null ? result : key;
    };

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 0);
    }

})();
