#!/bin/bash

echo "========================================"
echo "Building Executable Files"
echo "构建可执行文件"
echo "========================================"
echo

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed or not in PATH"
    echo "Go 未安装或不在 PATH 中"
    echo
    echo "Please install Go from: https://golang.org/dl/"
    echo "请从以下地址安装 Go: https://golang.org/dl/"
    exit 1
fi

echo "✅ Go found"
echo "找到 Go:"
go version
echo

# 切换到项目根目录
cd "$(dirname "$0")/.."

# 创建输出目录
mkdir -p dist
echo

# 构建 Windows 版本（交叉编译）
echo "========================================"
echo "Building Windows executable (cross-compile)..."
echo "正在构建 Windows 可执行文件（交叉编译）..."
echo "========================================"
echo

GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o dist/AI-Beacon-Startup.exe build/build_wrapper_windows.go
if [ $? -eq 0 ]; then
    echo "✅ Windows executable built successfully!"
    echo "Windows 可执行文件构建成功！"
else
    echo "❌ Windows build failed"
    echo "Windows 构建失败"
fi
echo

# 构建 macOS 版本
echo "========================================"
echo "Building macOS executable..."
echo "正在构建 macOS 可执行文件..."
echo "========================================"
echo

GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o dist/AI-Beacon-Startup-macOS build/build_wrapper_unix.go
if [ $? -eq 0 ]; then
    chmod +x dist/AI-Beacon-Startup-macOS
    echo "✅ macOS executable built successfully!"
    echo "macOS 可执行文件构建成功！"
else
    echo "❌ macOS build failed"
    echo "macOS 构建失败"
fi
echo

# 构建 Linux 版本
echo "========================================"
echo "Building Linux executable..."
echo "正在构建 Linux 可执行文件..."
echo "========================================"
echo

GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o dist/AI-Beacon-Startup-Linux build/build_wrapper_unix.go
if [ $? -eq 0 ]; then
    chmod +x dist/AI-Beacon-Startup-Linux
    echo "✅ Linux executable built successfully!"
    echo "Linux 可执行文件构建成功！"
else
    echo "❌ Linux build failed"
    echo "Linux 构建失败"
fi
echo

echo "========================================"
echo "Build Complete!"
echo "构建完成！"
echo "========================================"
echo
echo "Executables are in the 'dist' folder"
echo "可执行文件位于 'dist' 文件夹中"
echo

