@echo off
setlocal
chcp 65001 >nul
title Rede Eclypse — Atualizar Modpack Mobile
cd /d "%~dp0"

node scripts\sync-modpack-mobile.cjs %*

echo.
pause
