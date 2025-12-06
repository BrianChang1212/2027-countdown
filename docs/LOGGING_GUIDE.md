# 日誌系統使用指南

> **版本**: 1.0  
> **最後更新**: 2024-12-04

---

## 📖 概述

本專案使用統一的 `Logger` 模組管理所有日誌輸出，並根據 `CONFIG.DEBUG` 自動控制日誌級別。

---

## 🎯 DEBUG 模式啟用方式

### 方式 1：URL 參數（推薦用於測試）

在 URL 後面加上 `?debug=true`：

```
https://your-site.com/?debug=true
http://localhost:8080/?debug=true
```

### 方式 2：localStorage（推薦用於持久開發）

在瀏覽器控制台執行：

```javascript
localStorage.setItem('debug', 'true');
// 重新載入頁面即可生效

// 關閉 DEBUG 模式
localStorage.removeItem('debug');
```

### 方式 3：本地開發環境（自動）

以下環境會自動啟用 DEBUG 模式：
- `localhost`
- `127.0.0.1`
- `192.168.*.*` (區域網路)
- `10.*.*.*` (私有網路)
- `*.local` (本地域名)

---

## 📝 Logger 模組使用方法

### 基本用法

```javascript
// 引入（通常已全域可用）
// Logger 已在 window.Logger

// Debug 訊息（僅 DEBUG 模式顯示）
Logger.debug('這是除錯訊息', 'ModuleName');

// Info 訊息（INFO 級別以上顯示）
Logger.info('這是資訊訊息', 'ModuleName');

// Warning 訊息（WARN 級別以上顯示）
Logger.warn('這是警告訊息', 'ModuleName');

// Error 訊息（永遠顯示）
Logger.error('這是錯誤訊息', 'ModuleName');

// Success 訊息（等同於 info，但有 ✅ 圖示）
Logger.success('操作成功', 'ModuleName');
```

### 日誌級別

| 級別 | 方法 | DEBUG 模式 | 生產環境 | 用途 |
|------|------|-----------|---------|------|
| DEBUG | `Logger.debug()` | ✅ 顯示 | ❌ 隱藏 | 詳細除錯資訊 |
| INFO | `Logger.info()` | ✅ 顯示 | ❌ 隱藏 | 一般資訊 |
| WARN | `Logger.warn()` | ✅ 顯示 | ✅ 顯示 | 警告訊息 |
| ERROR | `Logger.error()` | ✅ 顯示 | ✅ 顯示 | 錯誤訊息 |

### 進階用法

```javascript
// 帶額外參數
Logger.debug('用戶資料', 'UserModule', { id: 123, name: 'John' });

// 多個參數
Logger.info('處理完成', 'ProcessModule', result, metadata);

// 檢查當前日誌級別
const currentLevel = Logger.getLevel();
console.log('當前級別:', currentLevel);
```

---

## 🔄 從 console.log 遷移

### 替換規則

| 原始 | 替換為 | 說明 |
|------|--------|------|
| `console.log(...)` | `Logger.debug(..., 'ModuleName')` | 一般除錯 |
| `console.info(...)` | `Logger.info(..., 'ModuleName')` | 資訊訊息 |
| `console.warn(...)` | `Logger.warn(..., 'ModuleName')` | 警告訊息 |
| `console.error(...)` | `Logger.error(..., 'ModuleName')` | 錯誤訊息 |

### 範例

#### ❌ 修改前

```javascript
console.log('[NewsView] 開始載入新聞...');
console.log('[NewsView] 獲取到', news.length, '則新聞');
console.warn('[NewsView] API 回應緩慢');
console.error('[NewsView] 載入失敗:', error);
```

#### ✅ 修改後

```javascript
Logger.debug('開始載入新聞...', 'NewsView');
Logger.debug(`獲取到 ${news.length} 則新聞`, 'NewsView');
Logger.warn('API 回應緩慢', 'NewsView');
Logger.error('載入失敗:', 'NewsView', error);
```

### 批量替換（VS Code）

使用正則表達式批量替換：

**步驟 1**: 開啟搜尋替換（Ctrl+H）

**步驟 2**: 啟用正則表達式模式

**步驟 3**: 使用以下模式

```
搜尋: console\.log\(['"`](.*?)['"`]\);
替換: Logger.debug('$1', 'ModuleName');
```

**注意**: 需要手動調整 `ModuleName` 為實際模組名稱

---

## 🎨 最佳實踐

### 1. 使用有意義的模組名稱

```javascript
// ✅ 好
Logger.debug('初始化完成', 'NewsView');
Logger.debug('路由切換', 'Router');

// ❌ 不好
Logger.debug('初始化完成', 'Module');
Logger.debug('路由切換', '');
```

### 2. 使用適當的日誌級別

```javascript
// ✅ 好
Logger.debug('進入函數', 'Utils');        // 詳細除錯
Logger.info('模組已載入', 'Main');         // 重要資訊
Logger.warn('使用備用數據', 'API');        // 警告
Logger.error('無法連接', 'Network');       // 錯誤

// ❌ 不好
Logger.error('進入函數', 'Utils');        // 不是錯誤
Logger.debug('無法連接', 'Network');      // 應該是錯誤
```

### 3. 提供有用的上下文

```javascript
// ✅ 好
Logger.debug(`載入 ${count} 筆資料，耗時 ${time}ms`, 'DataLoader');
Logger.error('API 請求失敗', 'NewsService', { url, status, error });

// ❌ 不好
Logger.debug('完成', 'Module');
Logger.error('錯誤', 'Service');
```

### 4. 避免敏感資訊

```javascript
// ❌ 危險 - 可能洩漏敏感資訊
Logger.debug('用戶登入', 'Auth', { password: '123456' });
Logger.info('API 金鑰', 'Config', apiKey);

// ✅ 安全
Logger.debug('用戶登入', 'Auth', { userId: user.id });
Logger.info('API 已配置', 'Config');
```

---

## 🛠️ 開發工具

### 在控制台啟用/禁用 DEBUG

```javascript
// 啟用 DEBUG（需重新載入頁面）
localStorage.setItem('debug', 'true');
location.reload();

// 禁用 DEBUG
localStorage.removeItem('debug');
location.reload();

// 檢查當前狀態
console.log('DEBUG 模式:', CONFIG.DEBUG);
console.log('日誌級別:', Logger.getLevel());
```

### 清除控制台

```javascript
Logger.clear();  // 僅在 DEBUG 模式有效
```

---

## 📊 效能影響

### DEBUG 模式關閉時

- ✅ DEBUG 和 INFO 日誌完全不執行
- ✅ 零效能開銷
- ✅ 不會洩漏資訊

### DEBUG 模式開啟時

- ⚠️ 所有日誌都會執行
- ⚠️ 可能影響效能（約 5-10%）
- ⚠️ 僅用於開發和除錯

---

## 🔍 常見問題

### Q: 為什麼我的 console.log 沒有顯示？

A: 檢查是否啟用 DEBUG 模式。在生產環境中，DEBUG 和 INFO 級別的日誌會被自動隱藏。

### Q: 如何在生產環境臨時啟用 DEBUG？

A: 在 URL 加上 `?debug=true` 參數即可。

### Q: Logger 和 console 有什麼區別？

A: Logger 提供：
- 統一的日誌格式
- 自動的級別控制
- 生產環境保護
- 更好的可維護性

### Q: 我應該完全移除 console.log 嗎？

A: 建議替換為 Logger，但保留關鍵的 console.error。

---

## 📚 相關文件

- [app-config.js](../src/scripts/config/app-config.js) - 配置檔案
- [logger.js](../src/scripts/utils/logger.js) - Logger 模組
- [README.md](../README.md) - 專案主要說明文件

---

**最後更新**: 2025-12-04  
**維護者**: 開發團隊

