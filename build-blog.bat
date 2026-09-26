@echo off
rem ============================================================
rem  重新构建 Dream 的博客
rem  写完 / 改完文章后双击运行一次，预览就能看到新内容
rem ============================================================
cd /d "%~dp0"
title 重新构建 Dream 的博客

call "%~dp0tools\find-node.bat"

if not defined NODE_EXE (
  echo.
  echo   [X] 没有找到 Node.js。
  echo       请先安装：https://nodejs.org  （装 LTS 版即可）
  echo.
  pause
  exit /b 1
)

echo.
"%NODE_EXE%" "tools\build.js"

echo.
if errorlevel 1 (
  echo   [X] 构建失败，请把上面的报错内容发给我。
) else (
  echo   [OK] 构建完成。如果预览服务开着，刷新浏览器即可看到新内容。
)
echo.
pause
