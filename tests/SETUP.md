# 🔧 測試環境安裝指南

## ⚠️ 前置需求

要執行測試，您需要先安裝 **Node.js**（包含 npm 套件管理器）。

## 📦 安裝 Node.js

### Windows 安裝步驟

#### 方法一：使用官方安裝程式（推薦）

1. **下載 Node.js**
   - 前往 [https://nodejs.org/](https://nodejs.org/)
   - 下載 **LTS（長期支援版）**（例如：20.x.x）
   - 建議下載 `.msi` 安裝檔

2. **執行安裝程式**
   - 雙擊下載的 `.msi` 檔案
   - 勾選「Automatically install the necessary tools」
   - 跟隨安裝精靈完成安裝

3. **驗證安裝**
   - 開啟新的 PowerShell 視窗
   - 執行以下指令：
   ```powershell
   node --version
   npm --version
   ```
   - 應該會顯示版本號（例如：v20.10.0）

#### 方法二：使用 Chocolatey（進階）

如果您已安裝 Chocolatey 套件管理器：

```powershell
choco install nodejs-lts
```

#### 方法三：使用 Scoop（進階）

如果您已安裝 Scoop：

```powershell
scoop install nodejs-lts
```

---

## 🚀 安裝完成後的步驟

### 1. 驗證 Node.js 已安裝

開啟 PowerShell 並執行：

```powershell
node --version
npm --version
```

應該看到：
```
v20.10.0  (版本號可能不同)
10.2.3    (版本號可能不同)
```

### 2. 安裝測試依賴

進入專案目錄並執行：

```powershell
cd "d:\Brian\project\20251129_2027_Countdown_Website_for_Peaceful_Reunification"
npm install
```

這將安裝：
- `vitest` - 測試框架
- `happy-dom` - DOM 環境
- `@vitest/ui` - 測試 UI
- `@vitest/coverage-v8` - 測試覆蓋率工具

### 3. 執行測試

安裝完成後：

```powershell
npm test
```

您應該會看到 102+ 個測試通過 ✅

---

## 🔍 安裝問題排除

### ❓ PowerShell 顯示「無法執行 npm」

**問題**: 安裝後仍然顯示找不到 npm

**解決方法**:
1. 關閉所有 PowerShell 視窗
2. 重新開啟 PowerShell（以系統管理員身分執行）
3. 再次執行 `npm --version`

### ❓ npm install 失敗

**問題**: 執行 `npm install` 時出現錯誤

**解決方法一**: 清除 npm 快取
```powershell
npm cache clean --force
npm install
```

**解決方法二**: 使用國內鏡像（如果網路連線緩慢）
```powershell
npm config set registry https://registry.npmmirror.com
npm install
```

**解決方法三**: 刪除 node_modules 重新安裝
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### ❓ 權限錯誤

**問題**: 出現 EPERM 或 EACCES 錯誤

**解決方法**: 以系統管理員身分執行 PowerShell
1. 在 Windows 搜尋列輸入「PowerShell」
2. 右鍵點擊「Windows PowerShell」
3. 選擇「以系統管理員身分執行」
4. 再次執行 `npm install`

---

## 📊 期望的安裝結果

成功安裝後，您的專案結構應該包含：

```
專案目錄/
├── node_modules/          # ✅ npm 依賴（約 120MB）
├── package.json           # ✅ 專案配置
├── package-lock.json      # ✅ 依賴鎖定檔（自動生成）
├── vitest.config.js       # ✅ 測試配置
├── tests/                 # ✅ 測試檔案
│   ├── setup/
│   ├── unit/
│   ├── README.md
│   └── QUICKSTART.md
└── ... 其他檔案
```

---

## ✅ 快速驗證測試環境

執行以下指令確認環境正常：

```powershell
# 1. 檢查 Node.js
node --version

# 2. 檢查 npm
npm --version

# 3. 進入專案目錄
cd "d:\Brian\project\20251129_2027_Countdown_Website_for_Peaceful_Reunification"

# 4. 安裝依賴
npm install

# 5. 執行測試
npm test

# 6. 查看測試覆蓋率
npm run test:coverage
```

---

## 🎯 預期的測試結果

成功執行測試後，您會看到類似以下的輸出：

```
 ✓ tests/unit/utils/cache-manager.test.js (27 tests) 234ms
 ✓ tests/unit/utils/dom-utils.test.js (35 tests) 189ms
 ✓ tests/unit/utils/utilities.test.js (40 tests) 156ms

 Test Files  3 passed (3)
      Tests  102 passed (102)
   Start at  02:51:57
   Duration  1.23s
```

---

## 📚 其他資源

- [Node.js 官方網站](https://nodejs.org/)
- [npm 官方文檔](https://docs.npmjs.com/)
- [Vitest 官方文檔](https://vitest.dev/)

---

## 💡 小提示

- **使用 LTS 版本**: 長期支援版更穩定
- **定期更新**: 執行 `npm update` 更新依賴
- **清除快取**: 遇到問題時先嘗試 `npm cache clean --force`

---

**遇到問題？**

1. 先檢查 Node.js 是否正確安裝（`node --version`）
2. 確認 PowerShell 已重新開啟
3. 嘗試以系統管理員身分執行
4. 參考上方的「安裝問題排除」章節

**準備好開始測試了嗎？** 🚀
