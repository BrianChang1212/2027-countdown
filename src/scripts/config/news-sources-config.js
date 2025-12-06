/**
 * 新聞來源配置模組
 * 集中管理所有新聞來源配置和備用資料
 */

const NewsSourcesConfig = (function() {
    'use strict';

    // 新聞來源配置（擴充更多國際媒體）
    const NEWS_SOURCES = {
        taiwan: [
            {
                name: '中央社政治',
                url: 'https://www.cna.com.tw/rss/politics.xml',
                category: 'taiwan',
                filterKeywords: false  // 台灣新聞不需要過濾
            },
            {
                name: '聯合報政治',
                url: 'https://udn.com/rssfeed/news/2/6638',
                category: 'taiwan',
                filterKeywords: false
            },
            {
                name: '自由時報政治',
                url: 'https://news.ltn.com.tw/rss/politics.xml',
                category: 'taiwan',
                filterKeywords: false
            },
            {
                name: '中時政治',
                url: 'https://www.chinatimes.com/rss/realtimenews.xml',
                category: 'taiwan',
                filterKeywords: false
            }
        ],
        international: [
            // 中文國際媒體
            {
                name: 'BBC中文',
                url: 'https://feeds.bbci.co.uk/zhongwen/trad/rss.xml',
                category: 'international',
                filterKeywords: true
            },
            {
                name: 'VOA中文',
                url: 'https://www.voachinese.com/api/zq_opemrivt',
                category: 'international',
                filterKeywords: true
            },
            {
                name: '德國之聲中文',
                url: 'https://www.dw.com/zh/rss/rss-top/rss.xml',
                category: 'international',
                filterKeywords: true
            },
            {
                name: '法國國際廣播電台',
                url: 'https://www.rfi.fr/tw/feed',
                category: 'international',
                filterKeywords: true
            },
            // 英文國際媒體
            {
                name: 'Reuters World',
                url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
                category: 'international',
                filterKeywords: true
            },
            {
                name: 'AP News',
                url: 'https://apnews.com/apf-topnews',
                category: 'international',
                filterKeywords: true
            },
            {
                name: 'CNN Top Stories',
                url: 'https://rss.cnn.com/rss/edition.rss',
                category: 'international',
                filterKeywords: true
            },
            {
                name: 'Bloomberg Asia',
                url: 'https://www.bloomberg.com/asia',
                category: 'international',
                filterKeywords: true
            },
            {
                name: 'The Guardian World',
                url: 'https://www.theguardian.com/world/rss',
                category: 'international',
                filterKeywords: true
            },
            {
                name: 'Financial Times Asia',
                url: 'https://www.ft.com/asia-pacific?format=rss',
                category: 'international',
                filterKeywords: true
            },
            {
                name: 'Washington Post World',
                url: 'https://www.washingtonpost.com/world/?outputType=rss',
                category: 'international',
                filterKeywords: true
            },
            {
                name: 'Nikkei Asia',
                url: 'https://asia.nikkei.com/rss/feed/all',
                category: 'international',
                filterKeywords: true
            },
            {
                name: 'South China Morning Post',
                url: 'https://www.scmp.com/rss/91/feed',
                category: 'international',
                filterKeywords: true
            }
        ],
        'cross-strait': [
            {
                name: '中央社兩岸',
                url: 'https://www.cna.com.tw/rss/acn.xml',
                category: 'cross-strait',
                filterKeywords: false
            },
            {
                name: '聯合報兩岸',
                url: 'https://udn.com/rssfeed/news/2/6643',
                category: 'cross-strait',
                filterKeywords: false
            }
        ]
    };

    // 備用新聞資料 (當 API 無法連接時使用)
    const FALLBACK_NEWS = {
        taiwan: [
            {
                title: '立法院審議重大法案 朝野協商持續進行',
                description: '立法院本會期審議多項重要法案，朝野各黨團就相關議題進行協商討論。',
                link: '#',
                pubDate: new Date().toISOString(),
                source: '政治新聞'
            },
            {
                title: '政府推動新政策 強化社會安全網',
                description: '行政院宣布新一波社會福利政策，預計惠及數百萬民眾。',
                link: '#',
                pubDate: new Date().toISOString(),
                source: '政治新聞'
            },
            {
                title: '地方選舉佈局 各黨積極籌備',
                description: '各政黨積極佈局下一屆地方選舉，候選人提名作業陸續展開。',
                link: '#',
                pubDate: new Date().toISOString(),
                source: '政治新聞'
            }
        ],
        international: [
            {
                title: '國際政經局勢變化 多國領袖會晤討論',
                description: '面對全球經濟挑戰，各國領袖舉行多邊會談尋求合作共識。',
                link: '#',
                pubDate: new Date().toISOString(),
                source: '國際新聞'
            },
            {
                title: '亞太區域安全議題受關注',
                description: '亞太地區安全形勢受到國際社會廣泛關注，各方持續對話。',
                link: '#',
                pubDate: new Date().toISOString(),
                source: '國際新聞'
            },
            {
                title: '全球氣候峰會 各國承諾減碳目標',
                description: '世界各國在氣候峰會上承諾加速減碳行動，共同應對氣候變遷。',
                link: '#',
                pubDate: new Date().toISOString(),
                source: '國際新聞'
            }
        ],
        'cross-strait': [
            {
                title: '兩岸經貿交流持續進行',
                description: '兩岸經貿往來穩定發展，雙方企業持續尋求合作機會。',
                link: '#',
                pubDate: new Date().toISOString(),
                source: '兩岸新聞'
            },
            {
                title: '兩岸文化交流活動舉行',
                description: '促進兩岸民間交流，多項文化藝術活動陸續展開。',
                link: '#',
                pubDate: new Date().toISOString(),
                source: '兩岸新聞'
            },
            {
                title: '專家分析兩岸關係發展趨勢',
                description: '兩岸關係專家就當前情勢發表分析，探討未來發展方向。',
                link: '#',
                pubDate: new Date().toISOString(),
                source: '兩岸新聞'
            }
        ]
    };

    /**
     * 取得指定分類的新聞來源
     * @param {string} category - 分類代碼
     * @returns {Array} 新聞來源配置陣列
     */
    function getSources(category) {
        return NEWS_SOURCES[category] || [];
    }

    /**
     * 取得指定分類的備用新聞
     * @param {string} category - 分類代碼
     * @returns {Array} 備用新聞陣列
     */
    function getFallbackNews(category) {
        return FALLBACK_NEWS[category] || [];
    }

    /**
     * 取得所有分類
     * @returns {Array<string>} 分類陣列
     */
    function getAllCategories() {
        return Object.keys(NEWS_SOURCES);
    }

    return {
        NEWS_SOURCES,
        FALLBACK_NEWS,
        getSources,
        getFallbackNews,
        getAllCategories
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.NewsSourcesConfig = NewsSourcesConfig;
}

