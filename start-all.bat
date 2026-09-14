@echo off
chcp 65001 > nul
echo =======================================================
echo    CONG TY TNHH NK NAM KHANH - VAN PHONG PHAM
echo    KHOI DONG HE THONG QUAN TRI CRM ^& DIEU HANH
echo =======================================================

echo 1. Khoi dong Backend API (Port 5000)...
start "NK Nam Khanh - Backend API (5000)" cmd /k "pushd "%~dp0backend" && npm run dev"

echo 2. Doi 3 giay de Backend san sang...
timeout /t 3 /nobreak > nul

echo 3. Khoi dong Frontend Web App (Port 3000)...
start "NK Nam Khanh - Frontend Web App (3000)" cmd /k "pushd "%~dp0frontend" && npm run dev"

echo.
echo =======================================================
echo    HE THONG DA DUOC KHOI DONG!
echo.
echo    Backend API: http://localhost:5000/api/v1/health
echo    Frontend:    http://localhost:3000
echo =======================================================
pause

