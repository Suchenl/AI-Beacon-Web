@echo off
REM 确保窗口保持打开
if not "%1"=="keep" (
    start "" cmd /k "%~f0" keep
    exit /b
)

chcp 65001 >nul 2>&1
echo ========================================
echo 🔍 Diagnostic Test / 诊断测试
echo ========================================
echo.
echo Script started / 脚本已启动
echo.

echo [1] Checking current directory / 检查当前目录...
cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo [2] Checking Node.js / 检查 Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js NOT found / 未找到 Node.js
) else (
    node --version
    echo ✅ Node.js found / 找到 Node.js
)
echo.

echo [3] Checking npm / 检查 npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ npm NOT found / 未找到 npm
) else (
    npm --version
    echo ✅ npm found / 找到 npm
)
echo.

echo [4] Checking package.json / 检查 package.json...
if exist "package.json" (
    echo ✅ package.json found / 找到 package.json
) else (
    echo ❌ package.json NOT found / 未找到 package.json
)
echo.

echo [5] Checking node_modules / 检查 node_modules...
if exist "node_modules" (
    echo ✅ node_modules found / 找到 node_modules
) else (
    echo ⚠️  node_modules NOT found / 未找到 node_modules
    echo    (This is normal on first run / 首次运行时这是正常的)
)
echo.

echo [6] Checking .env.local / 检查 .env.local...
if exist ".env.local" (
    echo ✅ .env.local found / 找到 .env.local
) else (
    echo ⚠️  .env.local NOT found / 未找到 .env.local
    echo    (Will prompt for API key / 将提示输入 API 密钥)
)
echo.

echo ========================================
echo.
echo Diagnostic complete / 诊断完成
echo.
echo Press any key to exit / 按任意键退出...
pause >nul

