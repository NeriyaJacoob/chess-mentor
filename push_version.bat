@echo off
for /f "tokens=1-4 delims=/: " %%a in ("%date% %time%") do (
    set year=%%d
    set month=%%b
    set day=%%c
    set hour=%%e
    set minute=%%f
)

setlocal enabledelayedexpansion
set version=version-%year%.%month%.%day%-%hour%%minute%

echo 🔄 העלאת גרסה: %version%
git checkout -b %version%
git add .
git commit -m "🚀 שמירה אוטומטית - %version%"
git push origin %version%
