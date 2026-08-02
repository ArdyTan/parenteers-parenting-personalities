@echo off
setlocal
title Parenting Bakes - App Server

pushd "%~dp0" >nul 2>&1
if errorlevel 1 goto folder_error

if not exist "package.json" goto project_error

where npm.cmd >nul 2>&1
if errorlevel 1 goto npm_error

powershell.exe -NoProfile -Command "try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5173/' -TimeoutSec 2; if ($response.Content -like '*Gaya Parenting Kamu*') { exit 0 } } catch {}; exit 1" >nul 2>&1
if not errorlevel 1 goto already_running

echo.
echo  Parenting Bakes app server
echo  ===========================
echo.
echo  Starting on port 5173...
echo  This window must stay open while you check the app.
echo  Press Ctrl+C here when you want to stop the server.
echo.

if not defined PARENTING_BAKES_SKIP_BROWSER start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:5173/'"
call npm.cmd run dev -- --port 5173 --strictPort
set "APP_EXIT_CODE=%ERRORLEVEL%"

echo.
if "%APP_EXIT_CODE%"=="0" (
  echo  The app server has stopped.
) else (
  echo  The app server could not start or stopped with an error.
  echo  Review the message above for details.
)
echo.
pause
popd
exit /b %APP_EXIT_CODE%

:already_running
echo.
echo  Parenting Bakes is already running at:
echo  http://localhost:5173/
echo.
echo  Opening it in your default browser now.
if not defined PARENTING_BAKES_SKIP_BROWSER start "" "http://localhost:5173/"
echo.
pause
popd
exit /b 0

:folder_error
echo.
echo  ERROR: Could not open the folder containing this launcher.
goto launcher_failed

:project_error
echo.
echo  ERROR: package.json was not found beside this launcher.
echo  Keep this BAT file in the Parenting Bakes project root.
goto launcher_failed

:npm_error
echo.
echo  ERROR: npm was not found.
echo  Install Node.js 22 or newer, then try again.

:launcher_failed
echo.
pause
popd >nul 2>&1
exit /b 1
