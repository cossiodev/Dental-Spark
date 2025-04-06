# Script para modo produccion con Vercel y Supabase
Write-Host "=== INICIANDO MODO PRODUCCION ===" -ForegroundColor Green
Write-Host "Configurando proyecto para produccion con Vercel y Supabase..." -ForegroundColor Cyan

# Definir variables de Supabase directamente
$SUPABASE_URL = "https://fdhanpamtgtyeaqskikh.supabase.co"
$SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkaGFucGFtdGd0eWVhcXNraWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NDQ0ODYsImV4cCI6MjA1OTMyMDQ4Nn0._DrZndzilD-Y7WzzzbeDZSvcpXl8os_PcWGmGgwB4ow"

# Verificar conexion Git/GitHub
Write-Host "Verificando conexion con GitHub..." -ForegroundColor Cyan
git remote -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "ADVERTENCIA: Git no esta configurado correctamente. Configurando..." -ForegroundColor Yellow
    git remote add origin https://github.com/cossiodev/Dental-Spark.git
}

# Configurar cambios locales
Write-Host "Agregando cambios locales..." -ForegroundColor Cyan
git add .
git commit -m "Actualizacion para modo produccion" --allow-empty
git push origin master

# Desplegar a Vercel en produccion
Write-Host "Desplegando en Vercel (produccion)..." -ForegroundColor Cyan
Write-Host "Usando proyecto existente: https://vercel.com/elvis-cossios-projects-ca2df045/dental-spark" -ForegroundColor Yellow

# Configuracion para el proyecto existente
$env:VERCEL_ORG_ID = "team_FQxZQ9IhxWG52RnY12hrmTfA"
$env:VERCEL_PROJECT_ID = "prj_lnxgc2CxQpS6MJYbWHcBXF4Sc2bE"

# Desplegando a produccion
vercel --prod

Write-Host "=== MODO PRODUCCION ACTIVADO ===" -ForegroundColor Green
Write-Host "La aplicacion esta ahora en produccion y conectada a Supabase en vivo." -ForegroundColor Green
Write-Host "URL de produccion: dental-spark.vercel.app" -ForegroundColor Cyan 