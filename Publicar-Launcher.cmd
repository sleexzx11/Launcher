@echo off
chcp 65001 >nul
title Rede Eclypse - Publicar Atualizacao do Launcher
cd /d "C:\Mods\rede-eclypse-launcher"

node scripts\publicar.js

echo.
pause
