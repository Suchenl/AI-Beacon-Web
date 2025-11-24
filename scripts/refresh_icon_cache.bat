@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo Refreshing Windows Icon Cache
echo 刷新 Windows 图标缓存
echo ========================================
echo.

echo Step 1: Stopping explorer.exe...
echo 步骤 1: 停止 explorer.exe...
taskkill /F /IM explorer.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Step 2: Clearing icon cache...
echo 步骤 2: 清除图标缓存...
if exist "%LOCALAPPDATA%\IconCache.db" (
    del /F /Q "%LOCALAPPDATA%\IconCache.db" >nul 2>&1
    echo ✅ IconCache.db deleted
    echo ✅ IconCache.db 已删除
)

if exist "%LOCALAPPDATA%\Microsoft\Windows\Explorer\iconcache*.db" (
    del /F /Q "%LOCALAPPDATA%\Microsoft\Windows\Explorer\iconcache*.db" >nul 2>&1
    echo ✅ Explorer icon cache deleted
    echo ✅ Explorer 图标缓存已删除
)

echo.
echo Step 3: Restarting explorer.exe...
echo 步骤 3: 重启 explorer.exe...
start explorer.exe
timeout /t 2 /nobreak >nul

echo.
echo Step 4: Refreshing icon cache...
echo 步骤 4: 刷新图标缓存...
ie4uinit.exe -show >nul 2>&1

echo.
echo ========================================
echo ✅ Icon cache refreshed!
echo ✅ 图标缓存已刷新！
echo ========================================
echo.
REM 切换到项目根目录
cd /d "%~dp0\.."

echo Please check the executable file in the dist folder.
echo 请检查 dist 文件夹中的可执行文件。
echo If the icon still doesn't show, try:
echo 如果图标仍未显示，请尝试:
echo 1. Restart your computer
echo    重启计算机
echo 2. Right-click the .exe file and select Properties
echo    右键点击 .exe 文件并选择属性
echo 3. Check if the icon appears in the Properties dialog
echo    检查属性对话框中是否显示图标
echo.
pause

