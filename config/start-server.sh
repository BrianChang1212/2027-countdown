#!/bin/bash

echo "正在啟動本地 HTTP 伺服器..."
echo ""
echo "請在瀏覽器中訪問: http://localhost:8000"
echo "按 Ctrl+C 可停止伺服器"
echo ""

# 檢查 Python 是否安裝
if command -v python3 &> /dev/null; then
    echo "使用 Python HTTP 伺服器..."
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "使用 Python HTTP 伺服器..."
    python -m http.server 8000
# 檢查 Node.js 是否安裝
elif command -v node &> /dev/null; then
    echo "使用 Node.js HTTP 伺服器..."
    npx --yes http-server -p 8000 -c-1
else
    echo "錯誤: 未找到 Python 或 Node.js"
    echo "請安裝其中一個:"
    echo "  - Python: https://www.python.org/downloads/"
    echo "  - Node.js: https://nodejs.org/"
    exit 1
fi

