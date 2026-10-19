@echo off
chcp 65001 >nul
title MLN122 - GAME THUYET TRINH (GROUP 1 - GD1906)
cd /d "%~dp0"

echo =========================================================================
echo   🏛️ DAI HOC FPT - MON MLN122 (KINH TE CHINH TRI MAC - LENIN)
echo   🎯 NHOM 1 - LOP GD1906
echo   🎮 GAME: HANH TRINH GIAI MA THANG DU (VON NHAN LUC HAY BOC LOT TINH VI?)
echo =========================================================================
echo.
echo [*] Dang khoi dong Server Node.js va mo trinh duyet...
echo [*] Cho 2 giay de he thong tao duong truyen va ma QR...
echo.

start "" "http://localhost:3000/admin.html"
npm start

pause
