#!/bin/bash

# 1. 进入当前脚本所在的目录
cd "$(dirname "$0")/.."

echo "========================================"
echo "🔧 AI Beacon Initialization"
echo "初始化工具"
echo "========================================"
echo ""

# 2. 检查 Node.js
echo "========================================"
echo "Checking Node.js"
echo "检查 Node.js"
echo "========================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found in PATH"
    echo "在 PATH 中未找到 Node.js"
    echo ""
    echo "Please make sure Node.js is installed and added to PATH"
    echo "请确保 Node.js 已安装并添加到 PATH"
    echo "Download from: https://nodejs.org/"
    echo "下载地址: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "✅ Node.js found"
echo "找到 Node.js:"
node --version
echo ""

# 3. 检查并安装依赖
echo "========================================"
echo "Dependencies"
echo "依赖检查"
echo "========================================"
echo ""

if [ -d "node_modules" ]; then
    echo "✅ Dependencies check passed"
    echo "依赖库检查通过"
    echo ""
else
    echo "📦 First run detected"
    echo "检测到首次运行"
    echo "Installing dependencies (npm install)"
    echo "正在安装依赖"
    echo ""
    
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Dependency installation failed"
        echo "依赖安装失败"
        echo "Please check network or Node.js environment"
        echo "请检查网络或 Node.js 环境"
        echo ""
        exit 1
    fi
    echo ""
    echo "✅ Dependencies installed"
    echo "依赖安装完成"
    echo ""
fi

# 4. API Key 配置循环
echo "========================================"
echo "API Key Configuration"
echo "API 密钥配置"
echo "========================================"
echo ""

ENV_FILE=".env.local"

while true; do
    echo ""
    echo "========================================"
    echo "Model Selection"
    echo "模型选择"
    echo "========================================"
    echo ""
    
    # 读取现有配置
    has_gemini=""
    has_openai=""
    has_anthropic=""
    has_qwen=""
    has_grok=""
    
    if [ -f "$ENV_FILE" ]; then
        grep -q "^VITE_GEMINI_API_KEY=" "$ENV_FILE" 2>/dev/null && has_gemini="1"
        grep -q "^VITE_OPENAI_API_KEY=" "$ENV_FILE" 2>/dev/null && has_openai="1"
        grep -q "^VITE_ANTHROPIC_API_KEY=" "$ENV_FILE" 2>/dev/null && has_anthropic="1"
        grep -q "^VITE_QWEN_API_KEY=" "$ENV_FILE" 2>/dev/null && has_qwen="1"
        grep -q "^VITE_GROK_API_KEY=" "$ENV_FILE" 2>/dev/null && has_grok="1"
    fi
    
    echo "Available Models / 可用模型:"
    echo ""
    if [ -n "$has_gemini" ]; then
        echo "1. Gemini 2.5 Flash / Gemini 2.0 Flash [已配置 / Configured]"
    else
        echo "1. Gemini 2.5 Flash / Gemini 2.0 Flash"
    fi
    if [ -n "$has_openai" ]; then
        echo "2. GPT-4 / GPT-4 Turbo / GPT-3.5 Turbo [已配置 / Configured]"
    else
        echo "2. GPT-4 / GPT-4 Turbo / GPT-3.5 Turbo"
    fi
    if [ -n "$has_anthropic" ]; then
        echo "3. Claude 3.5 Sonnet / Claude 3 Opus [已配置 / Configured]"
    else
        echo "3. Claude 3.5 Sonnet / Claude 3 Opus"
    fi
    if [ -n "$has_qwen" ]; then
        echo "4. Qwen3 Max / Qwen3 Omni [已配置 / Configured]"
    else
        echo "4. Qwen3 Max / Qwen3 Omni"
    fi
    if [ -n "$has_grok" ]; then
        echo "5. Grok Beta / Grok 2 [已配置 / Configured]"
    else
        echo "5. Grok Beta / Grok 2"
    fi
    echo ""
    echo "0. Exit / 退出配置"
    echo ""
    
    printf "Please select a provider (0-5) / 请选择提供商 (0-5): "
    read -r provider_choice
    
    if [ "$provider_choice" = "0" ]; then
        echo ""
        echo "✅ Configuration complete!"
        echo "配置完成！"
        echo ""
        break
    fi
    
    # 根据选择设置提供商和对应的 API Key 变量名
    case "$provider_choice" in
        1)
            PROVIDER_NAME="Gemini"
            API_KEY_VAR="VITE_GEMINI_API_KEY"
            API_KEY_DESC="Google Gemini API Key"
            if [ -n "$has_gemini" ]; then
                ACTION="Update / 更新"
            else
                ACTION="Initialize / 初始化"
            fi
            ;;
        2)
            PROVIDER_NAME="OpenAI"
            API_KEY_VAR="VITE_OPENAI_API_KEY"
            API_KEY_DESC="OpenAI API Key"
            if [ -n "$has_openai" ]; then
                ACTION="Update / 更新"
            else
                ACTION="Initialize / 初始化"
            fi
            ;;
        3)
            PROVIDER_NAME="Anthropic"
            API_KEY_VAR="VITE_ANTHROPIC_API_KEY"
            API_KEY_DESC="Anthropic API Key"
            if [ -n "$has_anthropic" ]; then
                ACTION="Update / 更新"
            else
                ACTION="Initialize / 初始化"
            fi
            ;;
        4)
            PROVIDER_NAME="Qwen"
            API_KEY_VAR="VITE_QWEN_API_KEY"
            API_KEY_DESC="Qwen (DashScope) API Key"
            if [ -n "$has_qwen" ]; then
                ACTION="Update / 更新"
            else
                ACTION="Initialize / 初始化"
            fi
            ;;
        5)
            PROVIDER_NAME="Grok"
            API_KEY_VAR="VITE_GROK_API_KEY"
            API_KEY_DESC="xAI Grok API Key"
            if [ -n "$has_grok" ]; then
                ACTION="Update / 更新"
            else
                ACTION="Initialize / 初始化"
            fi
            ;;
        *)
            echo "❌ Invalid choice. Please try again."
            echo "无效选择，请重试。"
            continue
            ;;
    esac
    
    echo ""
    echo "Selected Provider: $PROVIDER_NAME / 已选择提供商: $PROVIDER_NAME"
    echo "Action: $ACTION / 操作: $ACTION"
    echo ""
    echo "----------------------------------------"
    echo "Please paste your $API_KEY_DESC."
    echo "请粘贴您的 $API_KEY_DESC。"
    echo "(Press Enter after input / 输入后按回车确认)"
    echo "----------------------------------------"
    echo ""
    
    printf "🔑 Please enter API Key / 请输入 API Key: "
    read -r api_key
    
    if [ -z "$api_key" ]; then
        echo "❌ Key cannot be empty. Skipping..."
        echo "Key 不能为空，跳过..."
        continue
    fi
    
    # 更新或创建 .env.local 文件
    if [ -f "$ENV_FILE" ]; then
        # 移除旧的对应键，添加新的
        grep -v "^${API_KEY_VAR}=" "$ENV_FILE" > "${ENV_FILE}.tmp" 2>/dev/null || true
        echo "${API_KEY_VAR}=${api_key}" >> "${ENV_FILE}.tmp"
        mv "${ENV_FILE}.tmp" "$ENV_FILE"
    else
        echo "${API_KEY_VAR}=${api_key}" > "$ENV_FILE"
    fi
    
    echo ""
    echo "✅ Configuration saved for $PROVIDER_NAME!"
    echo "$PROVIDER_NAME 配置已保存！"
    echo ""
    
    # 询问是否继续配置
    printf "Do you want to configure another provider? (y/n) / 是否要配置其他提供商？(y/n): "
    read -r continue_config
    if [ "$continue_config" != "y" ] && [ "$continue_config" != "Y" ]; then
        break
    fi
done

echo ""
echo "========================================"
echo "Initialization Complete"
echo "初始化完成"
echo "========================================"
echo ""
echo "You can now run run-os.command to start the app"
echo "现在可以运行 run-os.command 来启动应用"
echo ""
read -p "Press Enter to exit / 按回车键退出..."

