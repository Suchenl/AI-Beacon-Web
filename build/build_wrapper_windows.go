package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
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

	// 构建批处理脚本内容
	batchScript := `@echo off
REM 确保窗口保持打开 - 使用 cmd /k 方式
if not "%1"=="keep" (
    start "" cmd /k "%~f0" keep
    exit /b
)

chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

REM 显示启动信息
echo ========================================
echo 🚀 AI Beacon Startup Assistant
echo 启动助手
echo ========================================
echo.
echo Script started
echo 脚本已启动
echo.

REM 1. 进入当前脚本所在的目录
cd /d "%~dp0"
if errorlevel 1 (
    echo ❌ Failed to change directory
    echo 无法切换到目录
    echo Current location: %CD%
    pause
    exit /b 1
)
echo ✅ Current directory: %CD%
echo.

REM 2. 检查 Node.js - 简化版本
echo ========================================
echo Checking Node.js
echo 检查 Node.js
echo ========================================
echo.

REM 直接尝试运行 node
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found in PATH
    echo 在 PATH 中未找到 Node.js
    echo.
    echo Please make sure Node.js is installed and added to PATH
    echo 请确保 Node.js 已安装并添加到 PATH
    echo Download from: https://nodejs.org/
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM 显示版本
echo ✅ Node.js found
echo 找到 Node.js:
node --version
echo.

REM 检查 npm（简化版本，避免卡顿）
echo Checking npm
echo 检查 npm
where npm >nul 2>nul
if errorlevel 1 (
    echo ⚠️  npm not found in PATH, but continuing
    echo 在 PATH 中未找到 npm，但继续
    echo    (npm usually comes with Node.js)
    echo    (npm 通常随 Node.js 一起安装)
) else (
    echo ✅ npm found
    echo 找到 npm
)
echo.

REM 3. 检查并配置 API Key
echo ========================================
echo API Configuration
echo API 配置
echo ========================================
echo.

set "ENV_FILE=.env.local"

REM 检查文件是否存在（使用 goto 确保只执行一个分支）
if exist "%ENV_FILE%" (
    echo ✅ API configuration file found (.env.local)
    echo 检测到 API 配置文件 (.env.local)
    echo Skipping API Key input
    echo 跳过 API Key 输入
    echo.
    goto :api_config_done
)

REM 文件不存在，需要输入
echo ⚠️ Configuration file not found (.env.local)
echo 未检测到配置文件 (.env.local)
echo ----------------------------------------
echo To enable AI features, please paste your Google Gemini API Key.
echo 为了启用 AI 功能，请粘贴您的 Google Gemini API Key。
echo (Press Enter after input)
echo (输入后按回车确认)
echo ----------------------------------------
echo.

echo "🔑 Please enter Key (or 请输入 Key): "
set /p "api_key="

if "!api_key!"=="" (
    echo ❌ Key cannot be empty. Startup terminated.
    echo Key 不能为空，启动已终止。
    echo.
    pause
    exit /b 1
)

echo VITE_GEMINI_API_KEY=!api_key! > "%ENV_FILE%"

echo.
echo ✅ Configuration saved!
echo 配置已保存！
echo.

:api_config_done
echo.

REM 4. 检查并安装依赖
echo ========================================
echo Dependencies
echo 依赖检查
echo ========================================
echo.

REM 检查 node_modules 目录是否存在（使用 goto 确保只执行一个分支）
if exist "node_modules\" (
    echo ✅ Dependencies check passed
    echo 依赖库检查通过
    echo.
    goto :deps_done
)

REM 目录不存在，需要安装
echo 📦 First run detected
echo 检测到首次运行
echo Installing dependencies (npm install)
echo 正在安装依赖
echo.

call npm install
if errorlevel 1 (
    echo.
    echo ❌ Dependency installation failed
    echo 依赖安装失败
    echo Please check network or Node.js environment
    echo 请检查网络或 Node.js 环境
    echo.
    pause
    exit /b 1
)
echo.
echo ✅ Dependencies installed
echo 依赖安装完成
echo.

:deps_done

REM 5. 启动浏览器（后台）
echo ========================================
echo Starting Browser
echo 启动浏览器
echo ========================================
echo Browser will open in 3 seconds
echo 浏览器将在3秒后打开
echo.
start /b "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

REM 6. 启动开发服务器
echo ========================================
echo Starting Server
echo 启动服务器
echo ========================================
echo 🌐 Starting development server
echo 正在启动开发服务器
echo Press Ctrl + C to stop
echo 按 Ctrl + C 可停止
echo.
echo.

call npm run dev

REM 服务器退出后的处理
echo.
echo ========================================
echo Server Stopped
echo 服务器已停止
echo ========================================
echo.
echo Press any key to exit
echo 按任意键退出
pause >nul

endlocal
`

	// 创建临时批处理文件
	tmpBatchFile := filepath.Join(exeDir, "start_temp.bat")
	if err := os.WriteFile(tmpBatchFile, []byte(batchScript), 0644); err != nil {
		fmt.Fprintf(os.Stderr, "Error creating batch file: %v\n", err)
		os.Exit(1)
	}
	defer os.Remove(tmpBatchFile)

	// 执行批处理文件
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("cmd", "/c", tmpBatchFile)
	} else {
		// 在非 Windows 系统上，尝试使用 cmd.exe（如果可用）
		cmd = exec.Command("cmd.exe", "/c", tmpBatchFile)
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	if err := cmd.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error running batch script: %v\n", err)
		os.Exit(1)
	}
}

