---
trigger: always_on
---

Title: Project initialization (rules and ignore files)

Trigger
- 當使用者明確表示這是新專案，並要求你「初始化專案」、「建立標準 rule 設定」或類似描述時，執行以下流程。
- 執行前，請先用繁體中文向使用者說明你即將進行的操作，並取得同意。

1. 回覆語言
- 所有解說與互動一律使用繁體中文。

2. 複製共用 rule 資料夾到專案根目錄
- 說明你將從下列路徑複製檔案：
  - 來源：`D:\Brian\file\cursor\rule`
  - 目標：目前 Workspace 的專案根目錄。
- 使用適合的指令（例如在 PowerShell / CMD 中的 `xcopy` 或 `robocopy`）複製整個資料夾與所有子資料夾。
- 若目標路徑已有同名檔案或資料夾：
  - 提醒使用者可能被覆蓋的項目，詢問是否覆蓋或改用其他目標資料夾名稱。

3. 產生專案專用 rule 設定檔
- 掃描此專案的：
  - 語言與技術棧（例如 C/C++、Rust、Python、Android、Linux Kernel…）
  - 目錄與模組結構
  - 既有命名慣例與程式風格
- 根據以上分析，自動生成一份專案專用的 rule 設定檔（格式可以是 `.md` 或 `.json`），內容應描述：
  - 本專案偏好的 coding style、命名規則與檔案結構約定。
  - 重要模組與其責任分工。
  - 特殊限制（效能、記憶體、平台相依行為等）。
- 將產生的 rule 檔儲存在：
  - `D:\Brian\file\cursor_rule\rule\`
  - 檔名應能清楚辨識此專案，如：`<project-name>-rules.md` 或 `<project-name>.json`。
- 完成後，向使用者簡要說明該檔案的位置與主要內容。

4. 建立類似 .cursorignore 的忽略檔
- 在專案根目錄建立或更新一份 `.cursorignore` 檔案，用途類似 `.gitignore`，用來排除不需要被深入分析的檔案。
- 實際內容必須根據當前專案結構推導，而不是套用完全無關的預設模板。
  - 典型需要排除的類別：
    - build 輸出（例如：`build/`, `out/`, `dist/`, `bin/`, `obj/`, `.next/` 等實際存在的目錄）
    - 相依套件資料夾（例如：`node_modules/`, `.venv/`, `vendor/`, `target/`… 視專案實際情況而定）
    - 暫存檔、log 檔以及大型二進位檔（例如：`*.log`, `*.tmp`, `*.bak`, `*.mp4`, `*.zip` 等）
- 在產生 `.cursorignore` 前，先列出你預計加入的主要規則，讓使用者確認是否需要調整。
- 實際寫入 `.cursorignore` 後，簡要說明關鍵條目與目的。

5. 完成後總結
- 初始化流程結束後，向使用者用條列方式總結：
  - 已複製哪些路徑與檔案到專案根目錄。
  - 在 `D:\Brian\file\cursor_rule\rule\` 新增了哪一個 rule 設定檔（檔名為何）。
  - `.cursorignore` 的主要排除項目有哪些，未來若要調整可直接手動編輯此檔案。
