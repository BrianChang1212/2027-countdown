/**
 * 測試環境設定檔
 * 此檔案在所有測試執行前載入，用於設定全域測試環境
 */

import { vi } from 'vitest';

// ==================== 全域模擬物件 ====================

// 模擬 Logger（因為大部分模組都依賴它）
global.Logger = {
    debug: vi.fn((...args) => {
        if (process.env.VITEST_DEBUG) {
            console.log('[DEBUG]', ...args);
        }
    }),
    info: vi.fn((...args) => {
        if (process.env.VITEST_DEBUG) {
            console.info('[INFO]', ...args);
        }
    }),
    warn: vi.fn((...args) => {
        if (process.env.VITEST_DEBUG) {
            console.warn('[WARN]', ...args);
        }
    }),
    error: vi.fn((...args) => {
        if (process.env.VITEST_DEBUG) {
            console.error('[ERROR]', ...args);
        }
    })
};

// 模擬 CONFIG（應用程式配置）
global.CONFIG = {
    DEBUG: false,
    API_TIMEOUT: 5000,
    CACHE_DURATION: 5 * 60 * 1000
};

// ==================== 瀏覽器 API 模擬 ====================

// 模擬 localStorage
const localStorageMock = (() => {
    let store = {};

    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index) => {
            const keys = Object.keys(store);
            return keys[index] || null;
        })
    };
})();

global.localStorage = localStorageMock;

// 模擬 sessionStorage
const sessionStorageMock = (() => {
    let store = {};

    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index) => {
            const keys = Object.keys(store);
            return keys[index] || null;
        })
    };
})();

global.sessionStorage = sessionStorageMock;

// 模擬 DOMParser（Happy-DOM 應該已經提供，但加強一下）
if (!global.DOMParser) {
    global.DOMParser = class DOMParser {
        parseFromString(str, type) {
            const parser = new (require('happy-dom').DOMParser)();
            return parser.parseFromString(str, type);
        }
    };
}

// 模擬 requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(callback, 16); // ~60fps
});

global.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id);
});

// ==================== 測試工具函數 ====================

/**
 * 建立模擬的 HTML 元素
 */
global.createMockElement = (tag = 'div', attrs = {}) => {
    const element = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'class') {
            element.className = value;
        } else if (key === 'style') {
            Object.assign(element.style, value);
        } else {
            element.setAttribute(key, value);
        }
    });
    return element;
};

/**
 * 等待 Promise 完成
 */
global.flushPromises = () => {
    return new Promise(resolve => setImmediate(resolve));
};

/**
 * 重置所有模擬
 */
global.resetAllMocks = () => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
};

// ==================== 測試生命週期 ====================

// 每個測試前重置模擬
beforeEach(() => {
    // 重置所有 mock 函數的調用記錄
    vi.clearAllMocks();

    // 清空 storage
    localStorage.clear();
    sessionStorage.clear();

    // 清空 DOM
    document.body.innerHTML = '';
});

// 每個測試後清理
afterEach(() => {
    // 清理所有計時器
    vi.clearAllTimers();
});

// ==================== 匯出測試工具 ====================

export { vi };
