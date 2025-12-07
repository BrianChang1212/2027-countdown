# 🧪 單元測試快速指南

> **階段一：基礎單元測試（1-2 週）**  
> 本指南將協助您快速上手專案的單元測試環境

## ⚡ 超快速開始（3 步驟）

### 1️⃣ 安裝依賴

```powershell
npm install
```

### 2️⃣ 執行測試

```powershell
npm test
```

### 3️⃣ 查看覆蓋率

```powershell
npm run test:coverage
```

完成！您的測試環境已經準備就緒 ✅

---

## 📦 已安裝的測試工具

- **Vitest** v1.0.0 - 現代化測試框架（速度快、配置簡單）
- **Happy-DOM** v12.10.3 - 輕量 DOM 環境
- **@vitest/ui** - 視覺化測試介面
- **@vitest/coverage-v8** - 測試覆蓋率工具

---

## 🎯 目前的測試狀態

### ✅ 已完成測試的模組

| 模組 | 檔案 | 測試數 | 覆蓋率目標 |
|------|------|--------|-----------|
| 快取管理 | `cache-manager.js` | 27+ | 80% |
| DOM 安全 | `dom-utils.js` | 35+ | 80% |
| 工具函數 | `utilities.js` | 40+ | 80% |

**總測試數**: 102+ 個測試案例

### ⏳ 待測試的關鍵模組

- [ ] `timer-manager.js` - 計時器管理（防止記憶體洩漏）
- [ ] `logger.js` - 日誌系統
- [ ] `error-handler.js` - 統一錯誤處理
- [ ] `rss-parser-service.js` - RSS 解析服務
- [ ] `prediction-filter-service.js` - 資料過濾服務
- [ ] `news-filter-service.js` - 新聞過濾服務

---

## 🔧 常用測試指令

```powershell
# 執行所有測試
npm test

# 監控模式（檔案變更時自動重新執行）
npm run test:watch

# 產生測試覆蓋率報告（HTML + JSON）
npm run test:coverage

# 開啟測試 UI（瀏覽器視覺化介面）
npm run test:ui

# 只執行特定測試檔案
npm test cache-manager

# 只執行包含特定描述的測試
npm test -- -t "快取"
```

---

## 📂 測試檔案結構

```
tests/
├── setup/
│   └── test-setup.js           # 測試環境配置（已完成）
├── unit/
│   └── utils/
│       ├── cache-manager.test.js   ✅ 已完成
│       ├── dom-utils.test.js       ✅ 已完成
│       └── utilities.test.js       ✅ 已完成
└── README.md                   # 完整測試文檔
```

---

## 🎨 測試範例

### 簡單的測試案例

```javascript
import { describe, it, expect } from 'vitest';

describe('我的功能', () => {
  it('應該返回正確的結果', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### 異步測試

```javascript
it('應該處理異步操作', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### 測試 DOM 操作

```javascript
it('應該創建元素', () => {
  const element = document.createElement('div');
  element.textContent = 'Test';
  expect(element.textContent).toBe('Test');
});
```

---

## 📊 查看測試覆蓋率報告

執行測試覆蓋率後：

```powershell
npm run test:coverage
```

報告位置：
- **HTML 報告**: `coverage/index.html`（用瀏覽器開啟）
- **JSON 報告**: `coverage/coverage-final.json`

### 覆蓋率目標

| 模組類型 | 目標覆蓋率 |
|---------|-----------|
| Utils（工具函數） | 80%+ |
| Services（服務層） | 70%+ |
| Components（組件） | 60%+ |
| Views（視圖） | 50%+ |

---

## 🐛 常見問題與解決方法

### ❓ 測試失敗：找不到模組

**問題**: `Cannot find module '../../src/...'`

**解決方法**: 
- 檢查檔案路徑是否正確
- 確認模組檔案存在

### ❓ 測試超時

**問題**: `Test timed out in 10000ms`

**解決方法**:
```javascript
it('測試名稱', async () => {
  // 測試代碼
}, 20000); // 增加超時時間到 20 秒
```

### ❓ DOM 元素未找到

**問題**: `element is null`

**解決方法**:
```javascript
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});
```

---

## 🎯 下一步建議

### 本週任務
1. ✅ 熟悉測試環境（執行現有測試）
2. ⏳ 撰寫 `timer-manager.js` 的測試
3. ⏳ 撰寫 `logger.js` 的測試

### 下週任務
1. ⏳ 完成所有 Utils 模組的測試
2. ⏳ 開始服務層測試
3. ⏳ 設定 CI/CD 自動測試

---

## 📚 學習資源

- [Vitest 官方文檔](https://vitest.dev/)
- [測試完整指南](./README.md)（位於 `tests/README.md`）
- [JavaScript 測試最佳實踐](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## 💡 小技巧

### 1. 使用測試 UI 除錯

```powershell
npm run test:ui
```

在瀏覽器中視覺化查看測試結果，方便除錯。

### 2. 只執行失敗的測試

Vitest 會記住失敗的測試，再次執行時會優先執行。

### 3. 查看詳細輸出

```powershell
npm test -- --reporter=verbose
```

### 4. 產生測試快照

```javascript
expect(component).toMatchSnapshot();
```

---

## ✅ 檢查清單

在開始撰寫測試前，確認：

- [ ] 已執行 `npm install`
- [ ] 已成功執行 `npm test`
- [ ] 能夠看到 102+ 個測試通過
- [ ] 已查看過測試覆蓋率報告
- [ ] 閱讀過測試範例

---

**準備好了嗎？開始測試吧！** 🚀

有任何問題，請參考 [`tests/README.md`](./README.md) 完整文檔。
