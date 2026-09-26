@echo off
rem ============================================================
rem  启动 Dream 的博客 · 本地预览
rem  双击运行即可；关掉窗口或按 Ctrl + C 即停止
rem ============================================================
cd /d "%~dp0"
title Dream 的博客 - 本地预览

call "%~dp0tools\find-node.bat"

if not defined NODE_EXE (
  echo.
  echo   [X] 没有找到 Node.js。
  echo       请先安装：https://nodejs.org  （装 LTS 版即可）
  echo.
  pause
  exit /b 1
)

rem ---- 已经在跑就直接开浏览器，避免重复启动报端口占用 ----
netstat -ano | findstr ":4321" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo.
  echo   预览服务已经在运行了，直接打开浏览器 ...
  start "" "http://localhost:4321/index.html"
  ping -n 4 127.0.0.1 >nul
  exit /b 0
)

echo.
echo   Dream 的博客 · 本地预览
echo   ----------------------------------------
echo   地址：  http://localhost:4321
echo   停止：  在这个窗口按 Ctrl + C
echo           或双击 stop-blog.bat
echo   ----------------------------------------
echo.

rem ---- 延迟 2 秒再开浏览器，等服务起来 ----
if not defined BLOG_NO_BROWSER start "" /min cmd /c "ping -n 3 127.0.0.1 >nul & start http://localhost:4321/index.html"

"%NODE_EXE%" "tools\serve.js" 4321

echo.
echo   预览服务已停止，窗口可以关掉了。
pause
