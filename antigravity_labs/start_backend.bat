@echo off
echo ===================================================
echo Starting Antigravity Chemistry Microservice (FastAPI)
echo Port: 8000 | URL: http://localhost:8000
echo ===================================================
cd /d "%~dp0chemistry_backend"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
