@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo Building Executable Files
echo 构建可执行文件
echo ========================================
echo.

REM 检查 Go 是否安装
go version >nul 2>&1
if errorlevel 1 (
    echo ❌ Go is not installed or not in PATH
    echo Go 未安装或不在 PATH 中
    echo.
    echo Please install Go from: https://golang.org/dl/
    echo 请从以下地址安装 Go: https://golang.org/dl/
    echo.
    pause
    exit /b 1
)

echo ✅ Go found
echo 找到 Go:
go version
echo.

REM 切换到项目根目录
cd /d "%~dp0\.."

REM 创建输出目录
if not exist "dist" mkdir dist
echo.

REM 构建 Windows 版本
echo ========================================
echo Building Windows executable...
echo 正在构建 Windows 可执行文件...
echo ========================================
echo.

REM 检查是否有图标文件
if exist "assets\icon.ico" (
    echo ✅ Found icon.ico, will embed icon
    echo 找到 icon.ico，将嵌入图标
    REM 使用 rsrc 工具嵌入图标（需要先安装: go install github.com/akavel/rsrc@latest）
    rsrc -ico assets\icon.ico -o build\icon.syso 2>nul
    if not errorlevel 1 (
        echo ✅ Icon embedded successfully
        echo 图标嵌入成功
    ) else (
        echo ⚠️  rsrc tool not found, building without icon
        echo 未找到 rsrc 工具，将不嵌入图标
        echo Install with: go install github.com/akavel/rsrc@latest
        echo 安装命令: go install github.com/akavel/rsrc@latest
    )
    echo.
)

go build -ldflags="-s -w" -o dist\AI-Beacon-Startup.exe build\build_wrapper_windows.go
if errorlevel 1 (
    echo ❌ Build failed
    echo 构建失败
    pause
    exit /b 1
)

REM 清理临时文件
if exist "build\icon.syso" del build\icon.syso

echo.
echo ✅ Windows executable built successfully!
echo Windows 可执行文件构建成功！
echo Output: dist\AI-Beacon-Startup.exe
echo 输出文件: dist\AI-Beacon-Startup.exe
echo.

REM 构建 macOS/Linux 版本（在 Windows 上需要交叉编译）
echo ========================================
echo Building Unix executable (cross-compile)...
echo 正在构建 Unix 可执行文件（交叉编译）...
echo ========================================
echo.

REM macOS
echo Building for macOS...
echo 正在为 macOS 构建...
set GOOS=darwin
set GOARCH=amd64
go build -ldflags="-s -w" -o dist\AI-Beacon-Startup-macOS build\build_wrapper_unix.go
if errorlevel 1 (
    echo ⚠️  macOS build failed (this is normal if cross-compiling from Windows)
    echo macOS 构建失败（在 Windows 上交叉编译时这是正常的）
) else (
    echo ✅ macOS executable built successfully!
    echo macOS 可执行文件构建成功！
)

echo.

REM Linux
echo Building for Linux...
echo 正在为 Linux 构建...
set GOOS=linux
set GOARCH=amd64
go build -ldflags="-s -w" -o dist\AI-Beacon-Startup-Linux build\build_wrapper_unix.go
if errorlevel 1 (
    echo ⚠️  Linux build failed
    echo Linux 构建失败
) else (
    echo ✅ Linux executable built successfully!
    echo Linux 可执行文件构建成功！
)

echo.
echo ========================================
echo Build Complete!
echo 构建完成！
echo ========================================
echo.
echo Executables are in the 'dist' folder
echo 可执行文件位于 'dist' 文件夹中
echo.
echo To add a custom icon:
echo 要添加自定义图标:
echo 1. Place an icon.ico file in the assets directory
echo    在 assets 目录中放置 icon.ico 文件
echo 2. Install rsrc: go install github.com/akavel/rsrc@latest
echo    安装 rsrc: go install github.com/akavel/rsrc@latest
echo 3. Run this script again
echo    再次运行此脚本
echo.
pause

