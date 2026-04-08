@echo off
setlocal

cd /d "%~dp0.."
npm run start:prod
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo Command failed with exit code %EXIT_CODE%.
  pause
)

exit /b %EXIT_CODE%
