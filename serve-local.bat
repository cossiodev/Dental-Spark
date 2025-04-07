@echo off
echo ===== SERVIDOR LOCAL DE PRUEBA =====
echo.
echo Este script iniciara un servidor web local para probar la build

rem Instalar serve si no esta instalado
where serve >nul 2>nul
if %errorlevel% neq 0 (
  echo Instalando serve...
  npm install -g serve
)

rem Iniciar servidor local
echo Iniciando servidor en http://localhost:3000
echo Presiona Ctrl+C para detener
echo.
serve -s dist 