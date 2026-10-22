@echo off
chcp 65001 >nul
title Rede Eclypse — Publicar Atualização Mobile
cd /d "%~dp0"

node scripts\publicar-mobile.cjs %*

echo.
pause
