@echo off
setlocal

cd /d "%~dp0.."
npm run health:public
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
  echo Health check completed successfully.
) else (
  echo Health check reported failures. Exit code: %EXIT_CODE%.
)

pause
exit /b %EXIT_CODE%
