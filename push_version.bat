@echo off
setlocal

for /f %%i in ('powershell -command "Get-Date -Format yyyy.MM.dd-HHmm"') do set BRANCH=version-%%i

git diff --quiet && git diff --cached --quiet
IF %ERRORLEVEL%==0 (
    echo ⏹️ אין שינויים לדחוף. סיום.
    exit /b
)

echo 📦 מוסיף קבצים...
git add .

echo ✍️ מבצע commit...
git commit -m "🔁 גרסה אוטומטית – %date% %time%"

echo 🌿 יוצר ענף חדש: %BRANCH%
git checkout -b %BRANCH%

echo 📤 דוחף ל־origin...
git push -u origin %BRANCH%

echo ✅ הושלם. ניתן למזג ל־main מאוחר יותר.
