# 測試文檔

## 📋 概述

本專案採用 **Vitest** 作為測試框架，配合 **Happy-DOM** 提供輕量的 DOM 環境。

## 🏗️ 測試架構

### 測試分層

```
tests/
├── setup/                    # 測試環境設定
│   └── test-setup.js        # 全域測試配置與模擬
├── unit/                    # 單元測試
│   ├── utils/               # 工具函數測試
│   │   ├── cache-manager.test.js
│   │   ├── dom-utils.test.js
│   │   └── utilities.test.js
│   ├── services/            # 服務層測試（待建立）
│   └── components/          # 組件測試（待建立）
└── e2e/                     # E2E 測試（待建立）
```

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 執行測試

```bash
# 執行所有測試
npm test

# 監控模式（自動重新執行）
npm run test:watch

# 產生測試覆蓋率報告
npm run test:coverage

# 開啟測試 UI（視覺化介面）
npm run test:ui
```

## 📊 目前測試狀態

### ✅ 已完成的測試

| 模組 | 測試檔案 | 測試案例數 | 狀態 |
|------|---------|-----------|------|
| CacheManager | `cache-manager.test.js` | 27+ | ✅ 完成 |
| DOMUtils | `dom-utils.test.js` | 35+ | ✅ 完成 |
| Helpers | `utilities.test.js` | 40+ | ✅ 完成 |

**總計**: 102+ 測試案例

### 🔄 測試覆蓋範圍

優先測試的關鍵模組：

1. **工具層（Utils）** ✅ 進行中
   - ✅ `cache-manager.js` - 快取管理
   - ✅ `dom-utils.js` - 安全的 DOM 操作（XSS 防護）
   - ✅ `utilities.js` - 通用工具函數
   - ✅ `timer-manager.js` - 計時器管理
   - ✅ `logger.js` - 日誌系統
   - ✅ `error-handler.js` - 錯誤處理

2. **服務層（Services）** ⏳ 待建立
   - ⏳ `rss-parser-service.js`
   - ⏳ `prediction-filter-service.js`
   - ⏳ `news-filter-service.js`

3. **組件層（Components）** ⏳ 待建立
   - ⏳ Chart 組件測試
   - ⏳ Card 組件測試

## 📝 撰寫測試指南

### 基本測試結構

```javascript
import { describe, it, expect, beforeEach } from 'vitest';

describe('模組名稱', () => {
  let ModuleName;

  beforeEach(async () => {
    // 動態載入模組
    const module = await import('../../src/scripts/path/to/module.js');
    ModuleName = module.default || window.ModuleName;
  });

  describe('功能分組', () => {
    it('應該做某件事', () => {
      // Arrange（準備）
      const input = 'test';
      
      // Act（執行）
      const result = ModuleName.someFunction(input);
      
      // Assert（驗證）
      expect(result).toBe('expected');
    });
  });
});
```

### 測試命名規範

- **describe**: 使用模組名稱或功能群組
- **it**: 使用「應該...」句型描述預期行為
- **中文命名**: 允許使用繁體中文描述測試案例

### 常用斷言（Assertions）

```javascript
// 相等性
expect(value).toBe(expected);           // 嚴格相等（===）
expect(value).toEqual(expected);        // 深度相等（物件/陣列）
expect(value).not.toBe(expected);       // 不相等

// 真值
expect(value).toBeTruthy();             // 真值
expect(value).toBeFalsy();              // 假值
expect(value).toBeNull();               // null
expect(value).toBeUndefined();          // undefined

// 數字
expect(value).toBeGreaterThan(n);       // 大於
expect(value).toBeLessThan(n);          // 小於
expect(value).toBeCloseTo(n, digits);   // 近似（浮點數）

// 字串
expect(string).toContain(substring);    // 包含子字串
expect(string).toMatch(/regex/);        // 符合正則

// 陣列/物件
expect(array).toContain(item);          // 包含元素
expect(array).toHaveLength(n);          // 長度
expect(obj).toHaveProperty('key');      // 有屬性

// 函數
expect(fn).toHaveBeenCalled();          // 被調用
expect(fn).toHaveBeenCalledWith(args);  // 以特定參數調用
expect(fn).toHaveBeenCalledTimes(n);    // 調用次數

// 錯誤
expect(() => fn()).toThrow();           // 拋出錯誤
expect(async () => fn()).rejects.toThrow(); // 異步拋出錯誤
```

### 模擬（Mocking）

```javascript
import { vi } from 'vitest';

// 模擬函數
const mockFn = vi.fn();
const mockFn = vi.fn(() => 'return value');

// 模擬模組
vi.mock('module-name', () => ({
  default: {
    method: vi.fn()
  }
}));

// 模擬計時器
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.runAllTimers();
vi.useRealTimers();

// 重置模擬
vi.clearAllMocks();     // 清除調用記錄
vi.resetAllMocks();     // 重置實現
vi.restoreAllMocks();   // 還原原始實現
```

## 🔍 測試策略

### 1. 單元測試重點

- **輸入驗證**: 測試各種輸入（有效、無效、邊界）
- **輸出驗證**: 驗證返回值正確
- **副作用**: 檢查 DOM 變更、API 調用等
- **錯誤處理**: 測試錯誤情況
- **邊界情況**: 空值、極端值、特殊字元

### 2. 測試覆蓋目標

| 類型 | 目標覆蓋率 |
|------|-----------|
| 工具函數（Utils） | 80%+ |
| 服務層（Services） | 70%+ |
| 組件層（Components） | 60%+ |
| 視圖層（Views） | 50%+ |

### 3. 優先順序

1. ✅ **關鍵業務邏輯** - 快取、DOM 安全、工具函數
2. ⏳ **資料處理** - 過濾、解析、轉換
3. ⏳ **UI 組件** - 圖表、卡片、統計
4. ⏳ **視圖層** - 頁面渲染與互動

## 🐛 偵錯技巧

### 查看詳細輸出

```bash
# 設定除錯模式
VITEST_DEBUG=1 npm test

# 只執行特定測試
npm test -- cache-manager

# 執行特定的 describe 或 it
npm test -- -t "應該能夠設定與取得快取"
```

### 使用 console.log 除錯

```javascript
it('測試案例', () => {
  const result = someFunction();
  console.log('Result:', result); // 會在測試輸出中顯示
  expect(result).toBe(expected);
});
```

### 使用測試 UI

```bash
npm run test:ui
```

在瀏覽器中打開 `http://localhost:51204/__vitest__/` 查看視覺化測試結果。

## 📈 查看測試覆蓋率

```bash
npm run test:coverage
```

報告將生成在 `coverage/` 目錄：

- `coverage/index.html` - HTML 報告（用瀏覽器開啟）
- `coverage/coverage-final.json` - JSON 報告

## ⚠️ 常見問題

### 問題 1: 模組載入失敗

**錯誤**: `Cannot find module`

**解決方法**: 確認檔案路徑正確，使用絕對路徑或配置別名。

### 問題 2: DOM 元素未找到

**錯誤**: `element is null`

**解決方法**: 
```javascript
beforeEach(() => {
  document.body.innerHTML = '<div id="test"></div>';
});
```

### 問題 3: 異步測試超時

**錯誤**: `Test timeout`

**解決方法**: 增加超時時間或使用 `await`
```javascript
it('異步測試', async () => {
  await someAsyncFunction();
}, 10000); // 10 秒超時
```

### 問題 4: IIFE 模組測試

由於專案使用 IIFE 模式，模組會自動暴露到 `window` 物件。測試時可以：

```javascript
// 方法 1: 從 window 取得
const ModuleName = window.ModuleName;

// 方法 2: 動態 import（如果模組有 export）
const module = await import('path/to/module.js');
const ModuleName = module.default;
```

## 📚 參考資源

- [Vitest 官方文檔](https://vitest.dev/)
- [Happy-DOM GitHub](https://github.com/capricorn86/happy-dom)
- [測試最佳實踐](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🎯 下一步

- [x] 完成 `timer-manager.js` 測試
- [x] 完成 `logger.js` 測試
- [x] 完成 `error-handler.js` 測試
- [ ] 建立服務層測試
- [ ] 建立組件層測試
- [ ] 整合 CI/CD 自動測試
- [ ] 設定測試覆蓋率門檻

---

**最後更新**: 2025-12-08  
**負責人**: Brian Chang  
**測試框架**: Vitest v1.0.0
