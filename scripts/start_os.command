#!/bin/bash

# 1. 进入当前脚本所在的目录
cd "$(dirname "$0")"

echo "========================================"
echo "🚀 AI Beacon Startup Assistant / 启动助手"
echo "========================================"

# --- 新增功能：自动检测并配置 API Key ---
ENV_FILE=".env.local"

# 检查 .env.local 是否存在
if [ -f "$ENV_FILE" ]; then
    echo "✅ API configuration file found (.env.local) / 检测到 API 配置文件 (.env.local)"
    echo ""
    echo "Current configuration / 当前配置:"
    cat "$ENV_FILE"
    echo ""
    echo "Do you want to add/update API keys? (y/n) / 是否要添加/更新 API 密钥？(y/n)"
    read -r update_keys
    if [ "$update_keys" != "y" ] && [ "$update_keys" != "Y" ]; then
        echo "Skipping API Key configuration / 跳过 API Key 配置"
        echo ""
    else
        # 继续配置流程
        CONFIGURE_KEYS=true
    fi
else
    CONFIGURE_KEYS=true
fi

if [ "$CONFIGURE_KEYS" = "true" ]; then
    echo ""
    echo "========================================"
    echo "Model Selection / 模型选择"
    echo "========================================"
    echo ""
    echo "Available Models / 可用模型:"
    echo "1. Gemini 2.5 Flash (Default / 默认)"
    echo "2. Gemini 2.0 Flash"
    echo "3. GPT-4"
    echo "4. GPT-4 Turbo"
    echo "5. GPT-3.5 Turbo"
    echo "6. Claude 3.5 Sonnet"
    echo "7. Claude 3 Opus"
    echo "8. Qwen3 Max (通义千问)"
    echo "9. Qwen3 Omni (通义千问 - 多模态)"
    echo "10. Grok Beta"
    echo "11. Grok 2"
    echo ""
    printf "Please select a model (1-11, default: 1) / 请选择模型 (1-11, 默认: 1): "
    read -r model_choice
    
    if [ -z "$model_choice" ]; then
        model_choice=1
    fi
    
    # 根据选择设置模型和对应的 API Key 变量名
    case "$model_choice" in
        1)
            MODEL_NAME="Gemini 2.5 Flash"
            API_KEY_VAR="VITE_GEMINI_API_KEY"
            API_KEY_DESC="Google Gemini API Key"
            ;;
        2)
            MODEL_NAME="Gemini 2.0 Flash"
            API_KEY_VAR="VITE_GEMINI_API_KEY"
            API_KEY_DESC="Google Gemini API Key"
            ;;
        3)
            MODEL_NAME="GPT-4"
            API_KEY_VAR="VITE_OPENAI_API_KEY"
            API_KEY_DESC="OpenAI API Key"
            ;;
        4)
            MODEL_NAME="GPT-4 Turbo"
            API_KEY_VAR="VITE_OPENAI_API_KEY"
            API_KEY_DESC="OpenAI API Key"
            ;;
        5)
            MODEL_NAME="GPT-3.5 Turbo"
            API_KEY_VAR="VITE_OPENAI_API_KEY"
            API_KEY_DESC="OpenAI API Key"
            ;;
        6)
            MODEL_NAME="Claude 3.5 Sonnet"
            API_KEY_VAR="VITE_ANTHROPIC_API_KEY"
            API_KEY_DESC="Anthropic API Key"
            ;;
        7)
            MODEL_NAME="Claude 3 Opus"
            API_KEY_VAR="VITE_ANTHROPIC_API_KEY"
            API_KEY_DESC="Anthropic API Key"
            ;;
        8)
            MODEL_NAME="Qwen3 Max"
            API_KEY_VAR="VITE_QWEN_API_KEY"
            API_KEY_DESC="Qwen (DashScope) API Key"
            ;;
        9)
            MODEL_NAME="Qwen3 Omni"
            API_KEY_VAR="VITE_QWEN_API_KEY"
            API_KEY_DESC="Qwen (DashScope) API Key"
            ;;
        10)
            MODEL_NAME="Grok Beta"
            API_KEY_VAR="VITE_GROK_API_KEY"
            API_KEY_DESC="xAI Grok API Key"
            ;;
        11)
            MODEL_NAME="Grok 2"
            API_KEY_VAR="VITE_GROK_API_KEY"
            API_KEY_DESC="xAI Grok API Key"
            ;;
        *)
            MODEL_NAME="Gemini 2.5 Flash"
            API_KEY_VAR="VITE_GEMINI_API_KEY"
            API_KEY_DESC="Google Gemini API Key"
            ;;
    esac
    
    echo ""
    echo "Selected Model: $MODEL_NAME / 已选择模型: $MODEL_NAME"
    echo ""
    echo "----------------------------------------"
    echo "To enable AI features, please paste your $API_KEY_DESC."
    echo "为了启用 AI 功能，请粘贴您的 $API_KEY_DESC。"
    echo "(Press Enter after input / 输入后按回车确认)"
    echo "----------------------------------------"
    echo ""
    
    printf "🔑 Please enter API Key / 请输入 API Key: "
    read -r api_key
    
    if [ -z "$api_key" ]; then
        echo "❌ Key cannot be empty. Startup terminated. / Key 不能为空，启动已终止。"
        exit 1
    fi
    
    # 读取现有文件并更新或添加新的 API Key
    if [ -f "$ENV_FILE" ]; then
        # 移除旧的对应键，添加新的
        grep -v "^${API_KEY_VAR}=" "$ENV_FILE" > "${ENV_FILE}.tmp" 2>/dev/null || true
        echo "${API_KEY_VAR}=${api_key}" >> "${ENV_FILE}.tmp"
        mv "${ENV_FILE}.tmp" "$ENV_FILE"
    else
        echo "${API_KEY_VAR}=${api_key}" > "$ENV_FILE"
    fi
    
    echo ""
    echo "✅ Configuration saved! / 配置已保存！"
    echo ""
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

# 3. 在后台启动一个倒计时，1秒后打开浏览器
# 这里的 & 符号让它在后台运行，不会卡住后续步骤
(sleep 1 && open "http://localhost:5173") &

# 4. 启动开发服务器
echo "🌐 Starting server... / 正在启动服务..."
echo "Press Ctrl + C to stop the server / 按 Ctrl + C 可停止服务"
npm run dev