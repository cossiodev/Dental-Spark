@echo off
echo ===== DESPLIEGUE DIRECTO A VERCEL =====
echo.
echo Este script desplegara directamente a Vercel sin pasar por GitHub Actions

rem Instalar Vercel CLI si no esta instalado
where vercel >nul 2>nul
if %errorlevel% neq 0 (
  echo Instalando Vercel CLI...
  npm install -g vercel
)

rem Limpiar cache y carpeta dist
echo Limpiando cache y carpeta dist...
if exist "node_modules\.vite" rmdir /s /q node_modules\.vite
if exist "dist" rmdir /s /q dist

rem Compilar el proyecto
echo Compilando el proyecto...
call npm run build

rem Desplegar a Vercel
echo Desplegando a Vercel...
call vercel --prod

echo.
echo Proceso de despliegue completado.
echo Verifica tu aplicacion en: https://dental-spark.vercel.app
echo.

pause 