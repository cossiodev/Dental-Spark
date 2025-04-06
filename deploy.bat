@echo off
echo ===== DESPLIEGUE AUTOMATICO VIA GITHUB =====
echo.
echo Las actualizaciones se desplegaran automaticamente tras push a GitHub

rem Agregar cambios
echo Agregando cambios al stage...
git add .

rem Crear commit
echo Creando commit con los cambios...
git commit -m "Actualizacion produccion %date% %time%"

rem Push a GitHub
echo Enviando cambios a GitHub...
git push origin master

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