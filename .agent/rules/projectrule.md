---
trigger: always_on
---

Title: README generation and update for this project

When the user要求你為此 Workspace 產生或更新專案說明文件時，請遵守以下規則：

1. 掃描專案結構
- 掃描目前 Workspace 的實際檔案與資料夾，理解：
  - 主要模組與子模組
  - 目錄結構與重要檔案（例如 main、入口點、build / run script）
  - 設定檔與相依套件

2. 處理 README.md
- 若專案根目錄沒有 README.md：
  - 建立一份新的 README.md。
- 若專案根目錄已存在 README.md：
  - 優先保留原本重要內容（例如：專案名稱、簡介、已存在的使用說明）。
  - 在此基礎上整合、更新你根據實際程式碼推導出的新資訊，而不是整份覆寫。

3. README.md 必須包含的區塊（Markdown）
- 以清楚、專業的 Markdown 輸出，至少包含以下章節：
  1. 專案簡介（Project Overview）
  2. 安裝與執行方式（Installation & Run）
  3. 目錄結構（Directory Structure）
     - 以樹狀圖或類似格式，根據實際資料夾與檔案生成。
  4. 系統架構圖（System Architecture）
     - 依原始碼與設定推導，清楚描述模組關係、資料流或關鍵元件。
     - 可以用條列、簡單 ASCII/Markdown 圖示來呈現。
  5. 技術棧（Tech Stack）
     - 列出實際使用的語言、框架、函式庫與工具。
  6. 如何貢獻（How to Contribute），若專案適用。
  7. 授權條款（License），若可從檔案或資料推斷。

4. 無法推斷的資訊
- 若某些資訊無法從專案中合理推斷（例如授權條款、部署環境細節）：
  - 使用 `<!-- TODO -->` 在 README 中明確標示待補內容，而不是猜測或捏造。
  - 不要發明不存在的 License、部署架構或外部服務。

5. 實際寫入檔案
- 如使用者同意寫入檔案：
  - 將產生的 README 內容寫入或更新根目錄的 README.md。
- 若使用者只想看草稿：
  - 在回覆中顯示完整 README 內容，讓使用者確認後再決定是否寫入檔案。
