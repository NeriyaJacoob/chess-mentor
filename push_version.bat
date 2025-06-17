@echo off
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy.MM.dd-HHmmss"') do set VERSION=version-%%i

echo Creating branch: %VERSION%
git checkout -b %VERSION%

git add .
git commit -m "New version %VERSION% – improvements, fixes and additions"
git push -u origin %VERSION%

echo.
echo ✅ Version "%VERSION%" pushed successfully!
pause
