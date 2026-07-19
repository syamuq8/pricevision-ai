@echo off
title PriceVision AI Unified Launcher
echo ===================================================
echo   PRICEVISION AI - UNIFIED APPLICATION LAUNCHER
echo ===================================================
echo.
echo [1/2] Activating Python Virtual Environment (.venv)...
cd backend
call .venv\Scripts\activate
cd ..
echo.
echo [2/2] Opening application in default browser...
start http://localhost:8000/
echo.
echo Launching server process...
python app.py
pause
