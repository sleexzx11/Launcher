@echo off
setlocal
echo ========================================================
echo   Rede Eclypse - Gerador de Distribuicao e Atualizacao
echo ========================================================
echo.

node generate-distribution.js %*

echo.
echo Manifesto distribution.json atualizado com sucesso!
echo.
pause
