/**
 * 專案配置檔
 * 集中管理所有常數、API 端點和設定
 */

const CONFIG = {
    // 目標日期設定
    TARGET_DATE: '2027-01-01T00:00:00+08:00',

    // 時區
    TIMEZONE: 'Asia/Taipei',

    // API 端點（統一管理）
    API: {
        // RSS 轉換服務
        RSS2JSON: 'https://api.rss2json.com/v1/api.json',

        // 預測市場 API
        POLYMARKET: 'https://gamma-api.polymarket.com',
        POLYMARKET_MARKETS: 'https://gamma-api.polymarket.com/markets',
        POLYMARKET_EVENTS: 'https://gamma-api.polymarket.com/events',

        // 訪客計數 API
        COUNT_API: 'https://api.countapi.xyz',

        // IP 地理位置 API（主要）
        IP_GEO: 'https://ipapi.co/json/',
        // IP 地理位置 API（備用）
        IP_GEO_FALLBACK: 'https://ip-api.com/json/',

        // CORS 代理服務（用於跨域請求）
        CORS_PROXY: 'https://api.allorigins.win/get?url=',
        CORS_PROXY_ALTERNATIVE: 'https://cors-anywhere.herokuapp.com/'
    },

    // 新聞來源 RSS
    NEWS_SOURCES: {
        taiwan: [
            {
                name: '中央社政治',
                url: 'https://www.cna.com.tw/rss/politics.xml',
                category: 'taiwan'
            },
            {
                name: '聯合報政治',
                url: 'https://udn.com/rssfeed/news/2/6638',
                category: 'taiwan'
            }
        ],
        international: [
            {
                name: 'BBC中文',
                url: 'https://feeds.bbci.co.uk/zhongwen/trad/rss.xml',
                category: 'international'
            },
            {
                name: 'VOA中文',
                url: 'https://www.voachinese.com/api/zq_opemrivt',
                category: 'international'
            }
        ],
        'cross-strait': [
            {
                name: '中央社兩岸',
                url: 'https://www.cna.com.tw/rss/acn.xml',
                category: 'cross-strait'
            }
        ]
    },

    // 更新間隔 (毫秒)
    INTERVALS: {
        COUNTDOWN: 1000,           // 倒數計時: 1秒
        NEWS_REFRESH: 5 * 60 * 1000,   // 新聞刷新: 5分鐘
        POLYMARKET_REFRESH: 10 * 60 * 1000,  // 預測市場: 10分鐘
        VISITOR_ANALYTICS: 60 * 60 * 1000  // 訪客分析: 1小時
    },

    // 快取設定
    CACHE: {
        NEWS_DURATION: 5 * 60 * 1000,  // 新聞快取: 5分鐘
        POLYMARKET_DURATION: 5 * 60 * 1000  // 預測市場快取: 5分鐘
    },

    // 顯示設定
    DISPLAY: {
        NEWS_MAX_ITEMS: 6,         // 新聞最多顯示數量
        TICKER_MAX_ITEMS: 15,      // 跑馬燈最多新聞數量
        TITLE_MAX_LENGTH: 60,      // 標題最大長度
        DESC_MAX_LENGTH: 80        // 描述最大長度
    },

    // 支援的語言
    LANGUAGES: {
        SUPPORTED: ['zh-TW', 'zh-CN', 'en'],
        DEFAULT: 'zh-TW',
        STORAGE_KEY: 'preferredLanguage'
    },

    // 外部連結
    EXTERNAL_LINKS: {
        POLYMARKET_TAIWAN: 'https://polymarket.com/event/will-china-invade-taiwan'
    },

    // 開發模式 - 智能檢測
    // 支援多種方式啟用：URL 參數、localStorage、本地開發環境
    DEBUG: (() => {
        // 1. 檢查 URL 參數 ?debug=true
        if (typeof window !== 'undefined') {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('debug') === 'true') {
                    Logger.debug('[CONFIG] DEBUG 模式已啟用（URL 參數）');
                    return true;
                }
            } catch (e) {
                // URL 解析失敗，繼續檢查其他方式
            }
        }

        // 2. 檢查 localStorage
        if (typeof localStorage !== 'undefined') {
            try {
                if (localStorage.getItem('debug') === 'true') {
                    Logger.debug('[CONFIG] DEBUG 模式已啟用（localStorage）');
                    return true;
                }
            } catch (e) {
                // localStorage 不可用，繼續檢查其他方式
            }
        }

        // 3. 檢查 hostname（本地開發環境）
        if (typeof window !== 'undefined') {
            try {
                const hostname = window.location.hostname;
                if (hostname === 'localhost' ||
                    hostname === '127.0.0.1' ||
                    hostname.startsWith('192.168.') ||
                    hostname.startsWith('10.') ||
                    hostname.endsWith('.local')) {
                    Logger.debug('[CONFIG] DEBUG 模式已啟用（本地開發環境）');
                    return true;
                }
            } catch (e) {
                // hostname 檢查失敗
            }
        }

        // 4. 預設關閉（生產環境）
        return false;
    })()
};

// 凍結配置物件，防止意外修改
Object.freeze(CONFIG);
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.NEWS_SOURCES);
Object.freeze(CONFIG.INTERVALS);
Object.freeze(CONFIG.CACHE);
Object.freeze(CONFIG.DISPLAY);
Object.freeze(CONFIG.LANGUAGES);
Object.freeze(CONFIG.EXTERNAL_LINKS);

// 匯出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

