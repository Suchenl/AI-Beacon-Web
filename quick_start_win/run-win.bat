@echo off
REM 确保窗口保持打开 - 使用 cmd /k 方式
if not "%1"=="keep" (
    start "" cmd /k "%~f0" keep
    exit /b
)

chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

REM 显示启动信息
echo ========================================
echo 🚀 AI Beacon - Local Run
echo 本地运行
echo ========================================
echo.

REM 1. 进入当前脚本所在的目录
cd /d "%~dp0\.."
if errorlevel 1 (
    echo ❌ Failed to change directory
    echo 无法切换到目录
    pause
    exit /b 1
)

REM 2. 快速检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please run init.bat first.
    echo 未找到 Node.js。请先运行 init.bat。
    pause
    exit /b 1
)

REM 3. 快速检查依赖
if not exist "node_modules\" (
    echo ❌ Dependencies not installed. Please run init.bat first.
    echo 依赖未安装。请先运行 init.bat。
    pause
    exit /b 1
)

REM 4. 启动浏览器（后台）
echo Starting browser...
echo 正在启动浏览器...
start /b "" cmd /c "timeout /t 1 /nobreak >nul && start http://localhost:5173"

REM 5. 启动开发服务器
echo ========================================
echo Starting Server
echo 启动服务器
echo ========================================
echo 🌐 Starting development server
echo 正在启动开发服务器
echo Press Ctrl + C to stop
echo 按 Ctrl + C 可停止
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

