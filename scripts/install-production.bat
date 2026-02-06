@echo off
REM Exact Online MCP - Claude Desktop Installer (Productie)
REM Dubbelklik op dit bestand om te installeren

echo.
echo ========================================
echo   Exact Online MCP - Productie Setup
echo ========================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0install-production.ps1"

echo.
pause
