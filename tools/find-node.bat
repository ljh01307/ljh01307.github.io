@echo off
rem ============================================================
rem  供其他 .bat 调用：定位 Node.js，把结果写到 NODE_EXE
rem  用法：  call "%~dp0tools\find-node.bat"
rem ============================================================
set "NODE_EXE="

rem 1) 系统 PATH
for %%c in (node.exe) do if not defined NODE_EXE if not "%%~$PATH:c"=="" set "NODE_EXE=%%~$PATH:c"

rem 2) Node.js 官方安装位置
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles(x86)%\nodejs\node.exe"
if not defined NODE_EXE if exist "E:\Node.JS\node.exe" set "NODE_EXE=E:\Node.JS\node.exe"

rem 3) WorkBuddy 自带的运行时（取版本号最大的一份）
if not defined NODE_EXE (
  for /f "delims=" %%d in ('dir /b /ad /o-n "%USERPROFILE%\.workbuddy\binaries\node\versions" 2^>nul') do (
    if not defined NODE_EXE if exist "%USERPROFILE%\.workbuddy\binaries\node\versions\%%d\node.exe" set "NODE_EXE=%USERPROFILE%\.workbuddy\binaries\node\versions\%%d\node.exe"
  )
)
exit /b 0
