@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

REM 显示启动信息
echo ========================================
echo 🔧 AI Beacon Initialization
echo 初始化工具
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
echo ✅ Current directory: %CD%
echo.

REM 2. 检查 Node.js
echo ========================================
echo Checking Node.js
echo 检查 Node.js
echo ========================================
echo.

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

echo ✅ Node.js found
echo 找到 Node.js:
node --version
echo.

REM 3. 检查并安装依赖
echo ========================================
echo Dependencies
echo 依赖检查
echo ========================================
echo.

if exist "node_modules\" (
    echo ✅ Dependencies check passed
    echo 依赖库检查通过
    echo.
) else (
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
)

REM 4. API Key 配置循环
echo ========================================
echo API Key Configuration
echo API 密钥配置
echo ========================================
echo.

set "ENV_FILE=.env.local"

:api_config_loop
echo.
echo ========================================
echo Model Selection
echo 模型选择
echo ========================================
echo.

REM 读取现有配置
set "has_gemini="
set "has_openai="
set "has_anthropic="
set "has_qwen="
set "has_grok="

if exist "%ENV_FILE%" (
    findstr /c:"VITE_GEMINI_API_KEY=" "%ENV_FILE%" >nul 2>&1
    if !errorlevel! equ 0 set "has_gemini=1"
    findstr /c:"VITE_OPENAI_API_KEY=" "%ENV_FILE%" >nul 2>&1
    if !errorlevel! equ 0 set "has_openai=1"
    findstr /c:"VITE_ANTHROPIC_API_KEY=" "%ENV_FILE%" >nul 2>&1
    if !errorlevel! equ 0 set "has_anthropic=1"
    findstr /c:"VITE_QWEN_API_KEY=" "%ENV_FILE%" >nul 2>&1
    if !errorlevel! equ 0 set "has_qwen=1"
    findstr /c:"VITE_GROK_API_KEY=" "%ENV_FILE%" >nul 2>&1
    if !errorlevel! equ 0 set "has_grok=1"
)

echo Available Models / 可用模型:
echo.
if defined has_gemini (
    echo 1. Gemini 2.5 Flash / Gemini 2.0 Flash [已配置 / Configured]
) else (
    echo 1. Gemini 2.5 Flash / Gemini 2.0 Flash
)
if defined has_openai (
    echo 2. GPT-4 / GPT-4 Turbo / GPT-3.5 Turbo [已配置 / Configured]
) else (
    echo 2. GPT-4 / GPT-4 Turbo / GPT-3.5 Turbo
)
if defined has_anthropic (
    echo 3. Claude 3.5 Sonnet / Claude 3 Opus [已配置 / Configured]
) else (
    echo 3. Claude 3.5 Sonnet / Claude 3 Opus
)
if defined has_qwen (
    echo 4. Qwen3 Max / Qwen3 Omni [已配置 / Configured]
) else (
    echo 4. Qwen3 Max / Qwen3 Omni
)
if defined has_grok (
    echo 5. Grok Beta / Grok 2 [已配置 / Configured]
) else (
    echo 5. Grok Beta / Grok 2
)
echo.
echo 0. Exit / 退出配置
echo.

echo Please select a provider (0-5)
echo 请选择提供商 (0-5)
set /p "provider_choice="

if "!provider_choice!"=="0" (
    echo.
    echo ✅ Configuration complete!
    echo 配置完成！
    echo.
    goto :end
)

if "!provider_choice!"=="1" (
    set "PROVIDER_NAME=Gemini"
    set "API_KEY_VAR=VITE_GEMINI_API_KEY"
    set "API_KEY_DESC=Google Gemini API Key"
    if defined has_gemini (
        set "ACTION=Update / 更新"
    ) else (
        set "ACTION=Initialize / 初始化"
    )
) else if "!provider_choice!"=="2" (
    set "PROVIDER_NAME=OpenAI"
    set "API_KEY_VAR=VITE_OPENAI_API_KEY"
    set "API_KEY_DESC=OpenAI API Key"
    if defined has_openai (
        set "ACTION=Update / 更新"
    ) else (
        set "ACTION=Initialize / 初始化"
    )
) else if "!provider_choice!"=="3" (
    set "PROVIDER_NAME=Anthropic"
    set "API_KEY_VAR=VITE_ANTHROPIC_API_KEY"
    set "API_KEY_DESC=Anthropic API Key"
    if defined has_anthropic (
        set "ACTION=Update / 更新"
    ) else (
        set "ACTION=Initialize / 初始化"
    )
) else if "!provider_choice!"=="4" (
    set "PROVIDER_NAME=Qwen"
    set "API_KEY_VAR=VITE_QWEN_API_KEY"
    set "API_KEY_DESC=Qwen (DashScope) API Key"
    if defined has_qwen (
        set "ACTION=Update / 更新"
    ) else (
        set "ACTION=Initialize / 初始化"
    )
) else if "!provider_choice!"=="5" (
    set "PROVIDER_NAME=Grok"
    set "API_KEY_VAR=VITE_GROK_API_KEY"
    set "API_KEY_DESC=xAI Grok API Key"
    if defined has_grok (
        set "ACTION=Update / 更新"
    ) else (
        set "ACTION=Initialize / 初始化"
    )
) else (
    echo ❌ Invalid choice. Please try again.
    echo 无效选择，请重试。
    goto :api_config_loop
)

echo.
echo Selected Provider: !PROVIDER_NAME!
echo 已选择提供商: !PROVIDER_NAME!
echo Action: !ACTION!
echo 操作: !ACTION!
echo.
echo ----------------------------------------
echo Please paste your !API_KEY_DESC!.
echo 请粘贴您的 !API_KEY_DESC!。
echo (Press Enter after input)
echo (输入后按回车确认)
echo ----------------------------------------
echo.

echo "🔑 Please enter API Key (or 请输入 API Key): "
set /p "api_key="

if "!api_key!"=="" (
    echo ❌ Key cannot be empty. Skipping...
    echo Key 不能为空，跳过...
    goto :api_config_loop
)

REM 更新或创建 .env.local 文件
if exist "%ENV_FILE%" (
    REM 读取现有内容，移除旧的对应键，添加新的
    set "temp_file=%TEMP%\env_temp_%RANDOM%.txt"
    (
        for /f "usebackq delims=" %%a in ("%ENV_FILE%") do (
            set "line=%%a"
            set "line=!line: =!"
            if "!line!"=="" (
                echo.
            ) else (
                echo !line! | findstr /b /c:"!API_KEY_VAR!=" >nul
                if errorlevel 1 (
                    echo %%a
                )
            )
        )
        echo !API_KEY_VAR!=!api_key!
    ) > "!temp_file!"
    move /y "!temp_file!" "%ENV_FILE%" >nul
) else (
    echo !API_KEY_VAR!=!api_key! > "%ENV_FILE%"
)

echo.
echo ✅ Configuration saved for !PROVIDER_NAME!
echo !PROVIDER_NAME! 配置已保存！
echo.

REM 询问是否继续配置
echo Do you want to configure another provider? (Y/N)
echo 是否要配置其他提供商？(Y/N)
set /p "continue_config="
if /i "!continue_config!"=="Y" (
    goto :api_config_loop
)

:end
echo.
echo ========================================
echo Initialization Complete
echo 初始化完成
echo ========================================
echo.
echo You can now run run_local.bat to start the app
echo 现在可以运行 run_local.bat 来启动应用
echo.
pause

endlocal

