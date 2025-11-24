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

REM 检查文件是否存在
if exist "%ENV_FILE%" (
    echo ✅ API configuration file found (.env.local)
    echo 检测到 API 配置文件 (.env.local)
    echo.
    echo Current configuration:
    echo 当前配置:
    type "%ENV_FILE%" 2>nul
    echo.
    echo Do you want to add/update API keys? (Y/N)
    echo 是否要添加/更新 API 密钥？(Y/N)
    set /p "update_keys="
    if /i not "!update_keys!"=="Y" (
        echo Skipping API Key configuration
        echo 跳过 API Key 配置
        echo.
        goto :api_config_done
    )
)

REM 模型选择
echo.
echo ========================================
echo Model Selection
echo 模型选择
echo ========================================
echo.
echo Available Models / 可用模型:
echo 1. Gemini 2.5 Flash (Default / 默认)
echo 2. Gemini 2.0 Flash
echo 3. GPT-4
echo 4. GPT-4 Turbo
echo 5. GPT-3.5 Turbo
echo 6. Claude 3.5 Sonnet
echo 7. Claude 3 Opus
echo 8. Qwen3 Max (通义千问)
echo 9. Qwen3 Omni (通义千问 - 多模态)
echo 10. Grok Beta
echo 11. Grok 2
echo.
echo Please select a model (1-11, default: 1)
echo 请选择模型 (1-11, 默认: 1)
set /p "model_choice="

if "!model_choice!"=="" set "model_choice=1"

REM 根据选择设置模型和对应的 API Key 变量名
if "!model_choice!"=="1" (
    set "MODEL_NAME=Gemini 2.5 Flash"
    set "API_KEY_VAR=VITE_GEMINI_API_KEY"
    set "API_KEY_DESC=Google Gemini API Key"
) else if "!model_choice!"=="2" (
    set "MODEL_NAME=Gemini 2.0 Flash"
    set "API_KEY_VAR=VITE_GEMINI_API_KEY"
    set "API_KEY_DESC=Google Gemini API Key"
) else if "!model_choice!"=="3" (
    set "MODEL_NAME=GPT-4"
    set "API_KEY_VAR=VITE_OPENAI_API_KEY"
    set "API_KEY_DESC=OpenAI API Key"
) else if "!model_choice!"=="4" (
    set "MODEL_NAME=GPT-4 Turbo"
    set "API_KEY_VAR=VITE_OPENAI_API_KEY"
    set "API_KEY_DESC=OpenAI API Key"
) else if "!model_choice!"=="5" (
    set "MODEL_NAME=GPT-3.5 Turbo"
    set "API_KEY_VAR=VITE_OPENAI_API_KEY"
    set "API_KEY_DESC=OpenAI API Key"
) else if "!model_choice!"=="6" (
    set "MODEL_NAME=Claude 3.5 Sonnet"
    set "API_KEY_VAR=VITE_ANTHROPIC_API_KEY"
    set "API_KEY_DESC=Anthropic API Key"
) else if "!model_choice!"=="7" (
    set "MODEL_NAME=Claude 3 Opus"
    set "API_KEY_VAR=VITE_ANTHROPIC_API_KEY"
    set "API_KEY_DESC=Anthropic API Key"
) else if "!model_choice!"=="8" (
    set "MODEL_NAME=Qwen3 Max"
    set "API_KEY_VAR=VITE_QWEN_API_KEY"
    set "API_KEY_DESC=Qwen (DashScope) API Key"
) else if "!model_choice!"=="9" (
    set "MODEL_NAME=Qwen3 Omni"
    set "API_KEY_VAR=VITE_QWEN_API_KEY"
    set "API_KEY_DESC=Qwen (DashScope) API Key"
) else if "!model_choice!"=="10" (
    set "MODEL_NAME=Grok Beta"
    set "API_KEY_VAR=VITE_GROK_API_KEY"
    set "API_KEY_DESC=xAI Grok API Key"
) else if "!model_choice!"=="11" (
    set "MODEL_NAME=Grok 2"
    set "API_KEY_VAR=VITE_GROK_API_KEY"
    set "API_KEY_DESC=xAI Grok API Key"
) else (
    set "MODEL_NAME=Gemini 2.5 Flash"
    set "API_KEY_VAR=VITE_GEMINI_API_KEY"
    set "API_KEY_DESC=Google Gemini API Key"
)

echo.
echo Selected Model: !MODEL_NAME!
echo 已选择模型: !MODEL_NAME!
echo.
echo ----------------------------------------
echo To enable AI features, please paste your !API_KEY_DESC!.
echo 为了启用 AI 功能，请粘贴您的 !API_KEY_DESC!。
echo (Press Enter after input)
echo (输入后按回车确认)
echo ----------------------------------------
echo.

echo "🔑 Please enter API Key (or 请输入 API Key): "
set /p "api_key="

if "!api_key!"=="" (
    echo ❌ Key cannot be empty. Startup terminated.
    echo Key 不能为空，启动已终止。
    echo.
    pause
    exit /b 1
)

REM 读取现有文件并更新或添加新的 API Key
if exist "%ENV_FILE%" (
    REM 读取现有内容，移除旧的对应键，添加新的
    setlocal enabledelayedexpansion
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
    endlocal
) else (
    echo !API_KEY_VAR!=!api_key! > "%ENV_FILE%"
)

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
echo Browser will open in 1 seconds
echo 浏览器将在1秒后打开
echo.
start /b "" cmd /c "timeout /t 1 /nobreak >nul && start http://localhost:5173"

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
