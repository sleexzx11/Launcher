@echo off
setlocal
chcp 65001 >nul
title Rede Eclypse — Atualizar Modpack PC
cd /d "%~dp0"

node scripts\sync-modpack.cjs %*

echo.
pause
