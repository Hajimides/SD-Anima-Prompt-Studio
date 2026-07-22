@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   Prompt Studio V2 启动脚本
echo ========================================
echo.

if not exist "node_modules\" (
  echo 检测到未安装依赖，正在执行 npm install...
  call npm install
  if errorlevel 1 (
    echo.
    echo 依赖安装失败，请检查 Node.js 是否已安装或网络是否正常。
    pause
    exit /b 1
  )
)

echo 正在启动开发服务器...
echo 打开浏览器访问终端显示的地址即可使用
echo 按 Ctrl + C 可停止服务器
echo.

call npm run dev

echo.
echo 服务器已停止。
pause
