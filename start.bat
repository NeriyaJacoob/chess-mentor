@echo off
echo Starting ChessMentor...
echo.

REM Check Backend
if not exist "backend-nodejs" (
    echo ERROR: backend-nodejs folder not found!
    pause
    exit
)

REM Check Frontend
if not exist "frontend-react" (
    echo ERROR: frontend-react folder not found!
    pause
    exit
)

REM Install Backend deps
echo Installing Backend dependencies...
cd backend-nodejs
if not exist "node_modules" npm install
start "Backend" cmd /c "npm run dev"
cd ..

REM Install Frontend deps
echo Installing Frontend dependencies...
cd frontend-react
if not exist "node_modules" npm install
start "Frontend" cmd /c "npm start"
cd ..

echo.
echo ChessMentor is starting!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000
echo.
timeout /t 8
start http://localhost:3000
