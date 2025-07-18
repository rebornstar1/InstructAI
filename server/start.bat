@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================================
echo  InstructAI Application Startup
echo ================================================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo [INFO] Docker is running...

REM Check if Docker Compose is available
docker-compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not available. Please install Docker Compose.
    pause
    exit /b 1
)

echo [INFO] Docker Compose is available...

REM Stop any existing containers
echo [INFO] Stopping existing containers...
docker-compose down >nul 2>&1

REM Build and start the application
echo [INFO] Building and starting the application...
docker-compose up -d --build

REM Wait for services to be ready
echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check if the main application is healthy
echo [INFO] Checking application health...
for /l %%i in (1,1,30) do (
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8007/actuator/health' -TimeoutSec 5 -UseBasicParsing; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
    if !errorlevel! equ 0 (
        echo [SUCCESS] Application is healthy!
        goto :healthy
    )
    echo [INFO] Waiting for application to start... (attempt %%i/30)
    timeout /t 2 /nobreak >nul
)

echo [WARNING] Application health check timed out. The application might still be starting.

:healthy
echo.
echo ================================================================
echo  InstructAI is now running
echo ================================================================
echo  Application URL: http://localhost:8007
echo  Socket.IO URL: http://localhost:9092
echo  Health Check: http://localhost:8007/actuator/health
echo  Redis Commander: http://localhost:8081
echo.
echo  To view logs: docker-compose logs -f app
echo  To stop: docker-compose down
echo.
echo  Setup complete
echo ================================================================
echo.

pause
