@echo off
title Iniciador Sonorum

echo ====================================
echo | INICIANDO BACKEND E FRONTEND |
echo ====================================
echo.

:: -----------------------------------
:: 1. BACKEND (Python/Poetry/Uvicorn)
:: -----------------------------------
echo [BACKEND] Iniciando servidor Uvicorn...
START "Sonorum Backend" /D "Sonorum\backend\api" cmd /k "poetry run uvicorn main:app --host 127.0.0.1 --port 8080"
echo [BACKEND] Aguardando 5 segundos...
timeout /t 5 /nobreak >nul
echo.

:: -----------------------------------
:: 2. FRONTEND (Node/NPM)
:: -----------------------------------
echo [FRONTEND] Iniciando desenvolvimento com NPM...
START "Sonorum Frontend" /D "Sonorum\src" cmd /k "npm start"
echo [FRONTEND] Servidor iniciado na nova janela.
echo.

echo ====================================
echo | Processo de inicializacao concluido! |
echo ====================================
echo.
echo As janelas do Backend e Frontend estao abertas.
echo Feche-as para encerrar o servidor.

pause
exit