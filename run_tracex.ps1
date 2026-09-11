Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  TraceX - Legal Metrology Compliance Platform" -ForegroundColor Cyan
Write-Host "  Launching Backend (FastAPI) and Frontend (Vite)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "[1/3] Starting Backend API Server on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; .\.venv\Scripts\activate; uvicorn main:app --reload --host 127.0.0.1 --port 8000"

# Start Frontend
Write-Host "[2/3] Starting Frontend Dev Server on http://127.0.0.1:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm run dev"

# Open Browser
Write-Host "[3/3] Opening TraceX Web App in your browser..." -ForegroundColor Green
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host "`nAll services successfully launched!" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:5173"
Write-Host "- Backend API & Swagger Docs: http://localhost:8000/docs"
