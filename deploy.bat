@echo off
echo ===== DESPLIEGUE AUTOMATICO VIA GITHUB =====
echo.
echo Las actualizaciones se desplegaran automaticamente tras push a GitHub

rem Limpiar cache y carpeta dist
echo Limpiando cache y carpeta dist...
if exist "node_modules\.vite" rmdir /s /q node_modules\.vite
if exist "dist" rmdir /s /q dist

rem Agregar cambios
echo Agregando cambios al stage...
git add .

rem Auto-pushing cambios a GitHub
echo Auto-pushing cambios a GitHub...
git commit -m "Actualizacion produccion %date% %time%"
git push

echo.
echo Cambios enviados con exito!
echo El despliegue a produccion comenzara automaticamente en GitHub Actions.
echo Verifica el estado en: https://github.com/cossiodev/Dental-Spark/actions
echo.
echo DATOS DE PRODUCCION:
echo - URL: https://dental-spark.vercel.app
echo - GitHub: https://github.com/cossiodev/Dental-Spark
echo - Vercel: https://vercel.com/elvis-cossios-projects-ca2df045/dental-spark
echo - Supabase: https://app.supabase.com/project/fdhanpamtgtyeaqskikh

pause 