/**
 * 預測市場數據配置模組
 * 集中管理所有預測市場的數據和配置
 */

const PredictionMarketsConfig = (function() {
    'use strict';

    /**
     * 問題文字到翻譯鍵的映射
     */
    const QUESTION_TRANSLATION_MAP = {
        '中國是否會在2025年對台灣發動軍事行動？': 'prediction.q1',
        '2027年前中國會封鎖台灣嗎？': 'prediction.q2',
        '2030年前兩岸會和平統一嗎？': 'prediction.q3',
        '台海衝突時美國會軍事介入嗎？': 'prediction.q4',
        '2025年台海會發生重大軍事衝突嗎？': 'prediction.q5',
        '中國會在2026年前對台灣進行軍事演習嗎？': 'prediction.q6',
        '台灣會在2025年宣布獨立嗎？': 'prediction.q7',
        '中國會在2026年前對台灣實施經濟制裁嗎？': 'prediction.q8',
        '兩岸會恢復正式對話嗎？': 'prediction.q9',
        '台灣會加入更多國際組織嗎？': 'prediction.q10',
        '台海緊張會導致全球半導體供應鏈中斷嗎？': 'prediction.q11',
        '兩岸貿易額會在2025年下降超過20%嗎？': 'prediction.q12',
        '台灣會與更多國家簽署自由貿易協定嗎？': 'prediction.q13',
        '台積電會擴大在台灣以外的投資嗎？': 'prediction.q14',
        '更多國家會與台灣建立正式外交關係嗎？': 'prediction.q15',
        '美國會通過新的對台軍售案嗎？': 'prediction.q16',
        '日本會更明確支持台灣嗎？': 'prediction.q17',
        '歐盟會通過支持台灣的決議嗎？': 'prediction.q18',
        '台灣民眾對統一的支持度會上升嗎？': 'prediction.q19',
        '兩岸民間交流會增加嗎？': 'prediction.q20'
    };

    /**
     * 預測市場備用數據（當 API 無法連接時使用）
     */
    const FALLBACK_MARKETS_DATA = [
        // 軍事類
        {
            id: 1,
            question: '中國是否會在2025年對台灣發動軍事行動？',
            category: 'military',
            yesPercentage: 9,
            noPercentage: 91,
            volume: '$612,000',
            participants: 1234,
            endDate: '2025-12-31',
            source: 'Polymarket',
            trend: 'down',
            lastUpdate: '2024-12-15'
        },
        {
            id: 2,
            question: '2027年前中國會封鎖台灣嗎？',
            category: 'military',
            yesPercentage: 15,
            noPercentage: 85,
            volume: '$450,000',
            participants: 890,
            endDate: '2027-01-01',
            source: 'Polymarket',
            trend: 'stable',
            lastUpdate: '2024-12-14'
        },
        {
            id: 3,
            question: '台海衝突時美國會軍事介入嗎？',
            category: 'military',
            yesPercentage: 72,
            noPercentage: 28,
            volume: '$890,000',
            participants: 2345,
            endDate: '2027-12-31',
            source: 'Polymarket',
            trend: 'up',
            lastUpdate: '2024-12-15'
        },
        {
            id: 4,
            question: '2025年台海會發生重大軍事衝突嗎？',
            category: 'military',
            yesPercentage: 12,
            noPercentage: 88,
            volume: '$380,000',
            participants: 756,
            endDate: '2025-12-31',
            source: 'Polymarket',
            trend: 'down',
            lastUpdate: '2024-12-13'
        },
        {
            id: 5,
            question: '中國會在2026年前對台灣進行軍事演習嗎？',
            category: 'military',
            yesPercentage: 85,
            noPercentage: 15,
            volume: '$520,000',
            participants: 1123,
            endDate: '2026-12-31',
            source: 'Polymarket',
            trend: 'stable',
            lastUpdate: '2024-12-15'
        },
        // 政治類
        {
            id: 6,
            question: '2030年前兩岸會和平統一嗎？',
            category: 'politics',
            yesPercentage: 3,
            noPercentage: 97,
            volume: '$280,000',
            participants: 567,
            endDate: '2030-12-31',
            source: 'Polymarket',
            trend: 'down',
            lastUpdate: '2024-12-12'
        },
        {
            id: 7,
            question: '台灣會在2025年宣布獨立嗎？',
            category: 'politics',
            yesPercentage: 5,
            noPercentage: 95,
            volume: '$195,000',
            participants: 432,
            endDate: '2025-12-31',
            source: 'Polymarket',
            trend: 'down',
            lastUpdate: '2024-12-11'
        },
        {
            id: 8,
            question: '中國會在2026年前對台灣實施經濟制裁嗎？',
            category: 'politics',
            yesPercentage: 28,
            noPercentage: 72,
            volume: '$340,000',
            participants: 678,
            endDate: '2026-12-31',
            source: 'Polymarket',
            trend: 'up',
            lastUpdate: '2024-12-14'
        },
        {
            id: 9,
            question: '兩岸會恢復正式對話嗎？',
            category: 'politics',
            yesPercentage: 35,
            noPercentage: 65,
            volume: '$225,000',
            participants: 445,
            endDate: '2026-06-30',
            source: 'Polymarket',
            trend: 'stable',
            lastUpdate: '2024-12-13'
        },
        {
            id: 10,
            question: '台灣會加入更多國際組織嗎？',
            category: 'politics',
            yesPercentage: 42,
            noPercentage: 58,
            volume: '$180,000',
            participants: 389,
            endDate: '2026-12-31',
            source: 'Polymarket',
            trend: 'up',
            lastUpdate: '2024-12-12'
        },
        // 經濟類
        {
            id: 11,
            question: '台海緊張會導致全球半導體供應鏈中斷嗎？',
            category: 'economy',
            yesPercentage: 18,
            noPercentage: 82,
            volume: '$750,000',
            participants: 1890,
            endDate: '2026-12-31',
            source: 'Polymarket',
            trend: 'down',
            lastUpdate: '2024-12-15'
        },
        {
            id: 12,
            question: '兩岸貿易額會在2025年下降超過20%嗎？',
            category: 'economy',
            yesPercentage: 25,
            noPercentage: 75,
            volume: '$420,000',
            participants: 923,
            endDate: '2025-12-31',
            source: 'Polymarket',
            trend: 'stable',
            lastUpdate: '2024-12-14'
        },
        {
            id: 13,
            question: '台灣會與更多國家簽署自由貿易協定嗎？',
            category: 'economy',
            yesPercentage: 55,
            noPercentage: 45,
            volume: '$310,000',
            participants: 712,
            endDate: '2027-12-31',
            source: 'Polymarket',
            trend: 'up',
            lastUpdate: '2024-12-13'
        },
        {
            id: 14,
            question: '台積電會擴大在台灣以外的投資嗎？',
            category: 'economy',
            yesPercentage: 78,
            noPercentage: 22,
            volume: '$680,000',
            participants: 1456,
            endDate: '2026-12-31',
            source: 'Polymarket',
            trend: 'up',
            lastUpdate: '2024-12-15'
        },
        // 外交類
        {
            id: 15,
            question: '更多國家會與台灣建立正式外交關係嗎？',
            category: 'diplomacy',
            yesPercentage: 22,
            noPercentage: 78,
            volume: '$265,000',
            participants: 534,
            endDate: '2027-12-31',
            source: 'Polymarket',
            trend: 'stable',
            lastUpdate: '2024-12-12'
        },
        {
            id: 16,
            question: '美國會通過新的對台軍售案嗎？',
            category: 'diplomacy',
            yesPercentage: 88,
            noPercentage: 12,
            volume: '$540,000',
            participants: 1234,
            endDate: '2025-12-31',
            source: 'Polymarket',
            trend: 'up',
            lastUpdate: '2024-12-15'
        },
        {
            id: 17,
            question: '日本會更明確支持台灣嗎？',
            category: 'diplomacy',
            yesPercentage: 65,
            noPercentage: 35,
            volume: '$390,000',
            participants: 867,
            endDate: '2026-12-31',
            source: 'Polymarket',
            trend: 'up',
            lastUpdate: '2024-12-14'
        },
        {
            id: 18,
            question: '歐盟會通過支持台灣的決議嗎？',
            category: 'diplomacy',
            yesPercentage: 48,
            noPercentage: 52,
            volume: '$295,000',
            participants: 623,
            endDate: '2026-06-30',
            source: 'Polymarket',
            trend: 'stable',
            lastUpdate: '2024-12-13'
        },
        // 社會類
        {
            id: 19,
            question: '台灣民眾對統一的支持度會上升嗎？',
            category: 'society',
            yesPercentage: 8,
            noPercentage: 92,
            volume: '$175,000',
            participants: 412,
            endDate: '2027-12-31',
            source: 'Polymarket',
            trend: 'down',
            lastUpdate: '2024-12-11'
        },
        {
            id: 20,
            question: '兩岸民間交流會增加嗎？',
            category: 'society',
            yesPercentage: 38,
            noPercentage: 62,
            volume: '$210,000',
            participants: 489,
            endDate: '2026-12-31',
            source: 'Polymarket',
            trend: 'stable',
            lastUpdate: '2024-12-12'
        }
    ];

    /**
     * 獲取問題的翻譯鍵
     * @param {string} questionText - 問題文字
     * @returns {string|null} 翻譯鍵，如果不存在則返回 null
     */
    function getTranslationKey(questionText) {
        return QUESTION_TRANSLATION_MAP[questionText] || null;
    }

    /**
     * 獲取備用市場數據
     * @returns {Array} 市場數據陣列
     */
    function getFallbackMarkets() {
        return [...FALLBACK_MARKETS_DATA];
    }

    /**
     * 獲取翻譯映射表
     * @returns {Object} 翻譯映射物件
     */
    function getTranslationMap() {
        return { ...QUESTION_TRANSLATION_MAP };
    }

    return {
        FALLBACK_MARKETS_DATA,
        QUESTION_TRANSLATION_MAP,
        getFallbackMarkets,
        getTranslationKey,
        getTranslationMap
    };
})();

// 暴露到全域
if (typeof window !== 'undefined') {
    window.PredictionMarketsConfig = PredictionMarketsConfig;
}

