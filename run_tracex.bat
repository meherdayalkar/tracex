@echo off
echo ===================================================
echo   TraceX - Legal Metrology Compliance Platform
echo   Launching Backend (FastAPI) and Frontend (Vite)
echo ===================================================

cd /d "%~dp0"

echo [1/3] Starting Backend API Server on http://127.0.0.1:8000 ...
start "TraceX Backend (FastAPI)" cmd /k "cd backend && .venv\Scripts\activate && uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo [2/3] Starting Frontend Dev Server on http://127.0.0.1:5173 ...
start "TraceX Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo [3/3] Opening TraceX Web App in your default browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo All services launched!
echo - Frontend: http://localhost:5173
echo - Backend API & Swagger Docs: http://localhost:8000/docs
echo ===================================================
