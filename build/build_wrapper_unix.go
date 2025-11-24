package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func main() {
	// 获取可执行文件所在目录
	exePath, err := os.Executable()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error getting executable path: %v\n", err)
		os.Exit(1)
	}
	exeDir := filepath.Dir(exePath)

	// 切换到可执行文件所在目录
	if err := os.Chdir(exeDir); err != nil {
		fmt.Fprintf(os.Stderr, "Error changing directory: %v\n", err)
		os.Exit(1)
	}

	// 构建 shell 脚本内容
	shellScript := `#!/bin/bash

# 1. 进入当前脚本所在的目录
cd "$(dirname "$0")"

echo "========================================"
echo "🚀 AI Beacon Startup Assistant / 启动助手"
echo "========================================"

# --- 新增功能：自动检测并配置 API Key ---
ENV_FILE=".env.local"

# 检查 .env.local 是否存在
if [ ! -f "$ENV_FILE" ]; then
    echo ""
    echo "⚠️  Configuration file not found (.env.local) / 未检测到配置文件 (.env.local)"
    echo "----------------------------------------"
    echo "To enable AI features, please paste your Google Gemini API Key."
    echo "为了启用 AI 功能，请粘贴您的 Google Gemini API Key。"
    echo "(Press Enter after input / 输入后按回车确认)"
    echo "----------------------------------------"
    
    # 读取用户输入
    printf "🔑 Please enter Key / 请输入 Key: "
    read api_key

    # 简单的非空检查
    if [ -z "$api_key" ]; then
        echo "❌ Key cannot be empty. Startup terminated. / Key 不能为空，启动已终止。"
        exit 1
    fi

    # 将 Key 写入文件
    # 注意：这里会自动加上 GEMINI_API_KEY= 前缀
    echo "VITE_GEMINI_API_KEY=$api_key" > "$ENV_FILE"
    
    echo "✅ Configuration saved! Will auto-load on next startup. / 配置已保存！下次启动将自动加载。"
    echo ""
else
    echo "✅ API configuration detected, ready to go. / 检测到 API 配置，准备就绪。"
fi
# ----------------------------------------

# 2. 检查 node_modules 是否存在，不存在则安装
if [ ! -d "node_modules" ]; then
    echo "📦 First run detected, installing dependencies (npm install)..."
    echo "📦 检测到首次运行，正在安装依赖 (npm install)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Dependency installation failed. Please check network or Node.js environment."
        echo "❌ 依赖安装失败，请检查网络或 Node.js 环境。"
        exit 1
    fi
else
    echo "✅ Dependencies check passed. / 依赖库检查通过。"
fi

# 3. 在后台启动一个倒计时，3秒后打开浏览器
# 这里的 & 符号让它在后台运行，不会卡住后续步骤
(sleep 3 && open "http://localhost:5173") &

# 4. 启动开发服务器
echo "🌐 Starting server... / 正在启动服务..."
echo "Press Ctrl + C to stop the server / 按 Ctrl + C 可停止服务"
npm run dev
`

	// 创建临时 shell 脚本文件
	tmpShellFile := filepath.Join(exeDir, "start_temp.sh")
	if err := os.WriteFile(tmpShellFile, []byte(shellScript), 0755); err != nil {
		fmt.Fprintf(os.Stderr, "Error creating shell script: %v\n", err)
		os.Exit(1)
	}
	defer os.Remove(tmpShellFile)

	// 执行 shell 脚本
	cmd := exec.Command("/bin/bash", tmpShellFile)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	if err := cmd.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error running shell script: %v\n", err)
		os.Exit(1)
	}
}

