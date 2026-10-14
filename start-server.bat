@echo off
title PlacementHub Server (Port 5000)
echo ===================================================
echo   PlacementHub Advanced Backend Server
echo ===================================================
echo.
cd /d "%~dp0"
echo Starting server on http://localhost:5000 ...
echo Press Ctrl+C at any time to stop the server.
echo.
node server/server.js
pause
