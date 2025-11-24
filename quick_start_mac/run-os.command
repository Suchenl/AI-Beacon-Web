#!/bin/bash

# 1. 进入当前脚本所在的目录
cd "$(dirname "$0")/.."

echo "========================================"
echo "🚀 AI Beacon - Local Run"
echo "本地运行"
echo "========================================"
echo ""

# 2. 快速检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please run init-os.command first."
    echo "未找到 Node.js。请先运行 init-os.command。"
    exit 1
fi

# 3. 快速检查依赖
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not installed. Please run init-os.command first."
    echo "依赖未安装。请先运行 init-os.command。"
    exit 1
fi

# 4. 启动浏览器（后台）
echo "Starting browser..."
echo "正在启动浏览器..."
(sleep 1 && open -a "Google Chrome" "http://localhost:5173") &

# 5. 启动开发服务器
echo "========================================"
echo "Starting Server"
echo "启动服务器"
echo "========================================"
echo "🌐 Starting development server"
echo "正在启动开发服务器"
echo "Press Ctrl + C to stop"
echo "按 Ctrl + C 可停止"
echo ""

npm run dev