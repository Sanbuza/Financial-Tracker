@echo off
cd /d "%~dp0"
set PATH=C:\Users\santi\AppData\Local\Python\bin;%PATH%
echo Iniciando Finance Tracker Backend...
echo.
python app.py
pause
