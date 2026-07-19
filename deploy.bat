@echo off
rem ====== UTF-8 强制: 避免中文乱码被 cmd 当成命令 ======
chcp 65001 >nul
set PYTHONIOENCODING=utf-8

rem ====== 切到 bat 所在目录 ======
cd /d "%~dp0"

"C:\Program Files\Git\bin\git.exe" init 2>nul
"C:\Program Files\Git\bin\git.exe" add index.html
"C:\Program Files\Git\bin\git.exe" commit -m "Update index.html - 自动部署"
"C:\Program Files\Git\bin\git.exe" remote remove origin 2>nul
"C:\Program Files\Git\bin\git.exe" remote add origin git@github.com:hehong5/chuan-west.git
"C:\Program Files\Git\bin\git.exe" push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo 部署成功！访问: https://hehong5.github.io/chuan-west/?v=16
) else (
    echo.
    echo 部署失败，请检查SSH密钥是否正确添加到GitHub
)
pause
