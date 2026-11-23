@echo off
echo ==============================================
echo           Stopping Noize Local Dev
echo ==============================================
echo.

echo [1/1] Stopping Supabase Local Environment...
call npx supabase stop

echo.
echo Supabase stopped successfully!
echo (Catatan: Untuk frontend/backend, cukup tutup window terminal servernya atau tekan Ctrl+C di sana).
echo.
pause
