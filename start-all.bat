@echo off
chcp 65001 > nul
echo =======================================================
echo    CÔNG TY TNHH NK NAM KHÁNH - VĂN PHÒNG PHẨM
echo    KHỞI ĐỘNG HỆ THỐNG QUẢN TRỊ CRM & ĐIỀU HÀNH
echo =======================================================

echo 1. Khởi động Backend API (Port 5000)...
start "NK Nam Khánh - Backend API (5000)" cmd /k "cd /d \"%~dp0backend\" && npm run dev"

echo 2. Đợi 3 giây để Backend sẵn sàng...
timeout /t 3 /nobreak > nul

echo 3. Khởi động Frontend Web App (Port 3000)...
start "NK Nam Khánh - Frontend Web App (3000)" cmd /k "cd /d \"%~dp0frontend\" && npm run dev"

echo.
echo =======================================================
echo    HỆ THỐNG ĐÃ ĐƯỢC KHỞI ĐỘNG THÀNH CÔNG!
echo.
echo    📡 Backend API: http://localhost:5000/api/v1/health
echo    💻 Frontend:    http://localhost:3000
echo =======================================================
pause
