@echo off
REM Exact Online MCP - Claude Desktop Installer (Windows)
REM Dubbelklik op dit bestand om te installeren

echo.
echo ========================================
echo   Exact Online MCP - Demo Installer
echo ========================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0install-claude-desktop.ps1"

echo.
pause
