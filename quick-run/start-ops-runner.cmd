@echo off
setlocal

cd /d "%~dp0.."
if not defined AURORA_RUNNER_ALLOWED_ORIGINS (
  set "AURORA_RUNNER_ALLOWED_ORIGINS=https://www.pso-aurora.com,https://pso-aurora.com,http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"
)
npm run ops:runner
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo Ops runner exited with code %EXIT_CODE%.
  pause
)

exit /b %EXIT_CODE%
