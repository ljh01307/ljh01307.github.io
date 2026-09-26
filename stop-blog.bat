@echo off
rem ============================================================
rem  停止 Dream 的博客 · 本地预览
rem  双击运行即可（等价于在预览窗口按 Ctrl + C）
rem ============================================================
cd /d "%~dp0"
title 停止 Dream 的博客 - 本地预览

set "KILLED="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":4321" ^| findstr "LISTENING"') do (
  taskkill /PID %%p /F >nul 2>nul
  if not errorlevel 1 set "KILLED=1"
)

echo.
if defined KILLED (
  echo   [OK] 预览服务已停止，4321 端口已释放。
) else (
  echo   [--] 当前没有在运行的预览服务（4321 端口是空闲的）。
)
echo.
ping -n 5 127.0.0.1 >nul
