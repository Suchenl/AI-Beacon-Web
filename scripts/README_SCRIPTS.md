# 脚本说明 / Scripts Explanation

## 文件说明 / File Description

### Windows 版本 / Windows Version

### 1. `init-win.bat` - 初始化脚本
**功能 / Function:**
- 检查并安装 Node.js 依赖
- 循环配置多个 AI 模型的 API Key
- 支持更新已配置的 API Key
- 显示每个提供商是否已配置

**使用场景 / Use Cases:**
- 首次安装项目
- 需要添加新的 API Key
- 需要更新现有的 API Key

**运行方式 / How to Run:**
```cmd
scripts\init-win.bat
```

### 2. `run-win.bat` - 本地运行脚本
**功能 / Function:**
- 快速启动本地开发服务器
- 不询问任何问题
- 自动打开浏览器

**使用场景 / Use Cases:**
- 日常开发
- 快速启动应用
- 不需要修改配置时

**运行方式 / How to Run:**
```cmd
scripts\run-win.bat
```

**前提条件 / Prerequisites:**
- 必须先运行 `init-win.bat` 安装依赖和配置 API Key

### macOS/Linux 版本 / macOS/Linux Version

### 3. `init-os.command` - 初始化脚本
**功能 / Function:**
- 检查并安装 Node.js 依赖
- 循环配置多个 AI 模型的 API Key
- 支持更新已配置的 API Key
- 显示每个提供商是否已配置

**使用场景 / Use Cases:**
- 首次安装项目
- 需要添加新的 API Key
- 需要更新现有的 API Key

**运行方式 / How to Run:**
```bash
./scripts/init-os.command
```

### 4. `run-os.command` - 本地运行脚本
**功能 / Function:**
- 快速启动本地开发服务器
- 不询问任何问题
- 自动打开浏览器

**使用场景 / Use Cases:**
- 日常开发
- 快速启动应用
- 不需要修改配置时

**运行方式 / How to Run:**
```bash
./scripts/run-os.command
```

**前提条件 / Prerequisites:**
- 必须先运行 `init-os.command` 安装依赖和配置 API Key

## run_local vs run_net 的区别 / Difference between run_local and run_net

### `run-win.bat` / `run-os.command` (本地运行)
- **资源位置 / Resource Location:** 本地文件系统
- **服务器类型 / Server Type:** Vite 开发服务器 (`npm run dev`)
- **网络需求 / Network Required:** 仅用于 API 调用（调用 AI 服务）
- **适用场景 / Use Case:** 开发、测试、本地使用
- **速度 / Speed:** 快速（本地文件）
- **离线能力 / Offline Capability:** 可以离线运行（但无法调用 AI API）

### `run_net.bat` (网络运行) - 本项目不需要
- **资源位置 / Resource Location:** 从 CDN 或远程服务器加载
- **服务器类型 / Server Type:** 可能使用网络代理或 CDN
- **网络需求 / Network Required:** 需要持续网络连接
- **适用场景 / Use Case:** 生产环境、需要从网络加载资源
- **速度 / Speed:** 取决于网络速度
- **离线能力 / Offline Capability:** 无法离线运行

**注意 / Note:** 本项目使用 Vite 开发服务器，所有资源都在本地，因此只需要 `run_local.bat`。`run_net` 通常用于需要从 CDN 加载资源的场景，本项目不需要。

## 工作流程 / Workflow

### 首次使用 / First Time Use

**Windows:**
1. 运行 `scripts\init-win.bat` 安装依赖和配置 API Key
2. 运行 `scripts\run-win.bat` 启动应用

**macOS/Linux:**
1. 运行 `./scripts/init-os.command` 安装依赖和配置 API Key
2. 运行 `./scripts/run-os.command` 启动应用

### 日常使用 / Daily Use

**Windows:**
1. 直接运行 `scripts\run-win.bat` 启动应用

**macOS/Linux:**
1. 直接运行 `./scripts/run-os.command` 启动应用

### 更新配置 / Update Configuration

**Windows:**
1. 运行 `scripts\init-win.bat` 更新 API Key
2. 运行 `scripts\run-win.bat` 启动应用

**macOS/Linux:**
1. 运行 `./scripts/init-os.command` 更新 API Key
2. 运行 `./scripts/run-os.command` 启动应用

## 旧文件 / Old Files

- `start_win.bat` 已被拆分为 `init-win.bat` 和 `run-win.bat`
- `start_os.command` 已被拆分为 `init-os.command` 和 `run-os.command`

可以保留旧文件作为备用，但建议使用新的拆分版本。

