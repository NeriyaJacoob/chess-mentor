@echo off
for /f %%a in ('powershell -command "Get-Date -Format \"yyyy.MM.dd-HHmm\""') do (
  set version=version-%%a
)
echo 🔼 העלאת גרסה: %version%
git checkout -b %version%
git add .
git commit -m "🚀 שמירה אוטומטית - %version%"
git push origin %version%
