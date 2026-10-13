@echo off
echo ========================================================
echo Starting InvoiceTrust AI Backend (FastAPI + SQLite)
echo ========================================================
cd /d %~dp0backend

REM Check python location
if exist "..\venv\Scripts\python.exe" (
    ..\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
) else if exist "C:\Users\HP\.gemini\antigravity\brain\a6290626-da44-44cd-afc0-d536cd1d11a6\scratch\python310\python.exe" (
    "C:\Users\HP\.gemini\antigravity\brain\a6290626-da44-44cd-afc0-d536cd1d11a6\scratch\python310\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
) else (
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
)
pause
