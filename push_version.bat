@echo off
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy.MM.dd-HHmmss"') do set VERSION=version-%%i

echo Creating branch: %VERSION%
git checkout -b %VERSION%

git add .
git commit -m "New version %VERSION% – improvements, fixes and additions"
git push -u origin %VERSION%

echo.
echo ? Version "%VERSION%" pushed successfully!
pause
@echo off
setlocal

:: Get current date and time for version name
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "Get-Date -Format yyyy.MM.dd-HHmmss"`) do set "VERSION=version-%%i"

echo.
echo Creating branch: %VERSION%
git checkout -b %VERSION%
if %errorlevel% neq 0 (
    echo Error: Failed to create or checkout branch. Exiting.
    goto :eof
)

echo Adding all changes to staging...
git add .
if %errorlevel% neq 0 (
    echo Error: Failed to add files. Exiting.
    goto :eof
)

echo Committing changes...
git commit -m "New version %VERSION% – improvements, fixes and additions"
if %errorlevel% neq 0 (
    echo Error: Failed to commit changes. Exiting.
    goto :eof
)

echo Pushing to remote repository...
git push -u origin %VERSION%
if %errorlevel% neq 0 (
    echo Error: Failed to push changes to remote. Exiting.
    goto :eof
)

echo.
echo ? Version "%VERSION%" pushed successfully!
echo.
pause

endlocal
