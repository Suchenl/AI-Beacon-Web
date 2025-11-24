@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo Verifying Icon Embedding
echo 验证图标嵌入
echo ========================================
echo.

REM 切换到项目根目录
cd /d "%~dp0\.."

if not exist "dist\AI-Beacon-Startup.exe" (
    echo ❌ Executable not found in dist folder
    echo ❌ 在 dist 文件夹中未找到可执行文件
    pause
    exit /b 1
)

echo Checking executable file...
echo 检查可执行文件...
echo.

REM 使用 PowerShell 检查文件属性
powershell -Command "$file = Get-Item 'dist\AI-Beacon-Startup.exe'; Write-Host 'File Name: ' $file.Name; Write-Host 'File Size: ' $file.Length 'bytes'; Write-Host 'Last Modified: ' $file.LastWriteTime"

echo.
echo ========================================
echo Icon Verification Methods
echo 图标验证方法
echo ========================================
echo.
echo Method 1: Check in File Explorer
echo 方法 1: 在文件资源管理器中查看
echo   - Open the dist folder
echo     打开 dist 文件夹
echo   - Switch to "Large Icons" or "Extra Large Icons" view
echo     切换到"大图标"或"超大图标"视图
echo   - The icon should appear on the .exe file
echo     图标应该显示在 .exe 文件上
echo.
echo Method 2: Check Properties Dialog
echo 方法 2: 检查属性对话框
echo   - Right-click AI-Beacon-Startup.exe
echo     右键点击 AI-Beacon-Startup.exe
echo   - Select "Properties"
echo     选择"属性"
echo   - The icon should appear in the Properties dialog
echo     图标应该显示在属性对话框中
echo.
echo Method 3: Use Resource Hacker (if installed)
echo 方法 3: 使用 Resource Hacker（如果已安装）
echo   - Open the .exe file with Resource Hacker
echo     使用 Resource Hacker 打开 .exe 文件
echo   - Check the "Icon" section
echo     检查"Icon"部分
echo.
echo ========================================
echo.
echo If the icon still doesn't show:
echo 如果图标仍未显示:
echo 1. The icon may be embedded but Windows cache needs refresh
echo    图标可能已嵌入，但 Windows 缓存需要刷新
echo 2. Try restarting your computer
echo    尝试重启计算机
echo 3. The icon.ico file format may need to be checked
echo    可能需要检查 icon.ico 文件格式
echo.
pause

