@echo off
echo ===================================================
echo   Antigravity STEM Virtual Labs - Standalone Runner
echo ===================================================
echo [1/2] Launching Chemistry FastAPI Backend in background...
start "Antigravity Chem Backend" cmd /c "cd /d %~dp0chemistry_backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Launching Virtual Labs Preview in Browser...
timeout /t 2 /nobreak >nul
start "" "%~dp0web_labs_package\index.html"

echo.
echo Virtual Labs active! 
echo Close the chemistry backend command window when finished.
pause
