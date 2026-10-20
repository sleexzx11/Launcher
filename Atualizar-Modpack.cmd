@echo off
setlocal
cd /d "%~dp0"
node scripts\sync-modpack.cjs %*
pause
