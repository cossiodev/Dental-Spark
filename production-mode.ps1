# Script para modo produccion con Vercel y Supabase
param (
    [switch]$SkipGitPush,
    [switch]$SkipVercelDeploy,
    [switch]$ForceRebuild
)

$ErrorActionPreference = "Stop"

$SUPABASE_URL = "https://fdhanpamtgtyeaqskikh.supabase.co"
$SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkaGFucGFtdGd0eWVhcXNraWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NDQ0ODYsImV4cCI6MjA1OTMyMDQ4Nn0._DrZndzilD-Y7WzzzbeDZSvcpXl8os_PcWGmGgwB4ow"
$PROJECT_URL = "https://dental-spark.vercel.app"

function Show-Header {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║               DENTAL SPARK - MODO PRODUCCION               ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Handle-Error {
    param (
        [string]$Message,
        [bool]$IsFatal = $true
    )
    
    Write-Host "❌ ERROR: $Message" -ForegroundColor Red
    
    if ($IsFatal) {
        Write-Host "Proceso abortado. Ejecute el script de nuevo cuando solucione el problema." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "Continuando a pesar del error..." -ForegroundColor Yellow
    }
}

Show-Header
Write-Host "Iniciando configuracion de produccion..." -ForegroundColor Green

# Verificar que Vercel CLI está instalado
Write-Host "Verificando Vercel CLI..." -ForegroundColor Cyan
$vercelVersion = vercel --version
if ($LASTEXITCODE -ne 0) {
    Handle-Error "Vercel CLI no está instalado. Instálelo con: npm install -g vercel"
}
Write-Host "✓ Vercel CLI detectado: $vercelVersion" -ForegroundColor Green

# Verificar Git
Write-Host "Verificando configuracion de Git..." -ForegroundColor Cyan
$gitRemotes = git remote -v
if ($LASTEXITCODE -ne 0) {
    Handle-Error "Git no está configurado correctamente."
}

if (-not ($gitRemotes -match "github.com/cossiodev/Dental-Spark")) {
    Write-Host "Añadiendo remote de GitHub..." -ForegroundColor Yellow
    git remote add origin https://github.com/cossiodev/Dental-Spark.git
    if ($LASTEXITCODE -ne 0) {
        Handle-Error "No se pudo configurar el remote de Git."
    }
}
Write-Host "✓ Git configurado correctamente" -ForegroundColor Green

# Configurar entorno de producción
Write-Host "Configurando variables para produccion..." -ForegroundColor Cyan
$env:VITE_SUPABASE_URL = $SUPABASE_URL
$env:VITE_SUPABASE_ANON_KEY = $SUPABASE_KEY
$env:VERCEL_ORG_ID = "team_FQxZQ9IhxWG52RnY12hrmTfA"
$env:VERCEL_PROJECT_ID = "prj_lnxgc2CxQpS6MJYbWHcBXF4Sc2bE"
Write-Host "✓ Variables de entorno configuradas" -ForegroundColor Green

# Sincronizar con GitHub (opcional)
if (-not $SkipGitPush) {
    try {
        Write-Host "Sincronizando con GitHub..." -ForegroundColor Cyan
        git add .
        git commit -m "Actualizacion para produccion [$(Get-Date -Format 'yyyy-MM-dd HH:mm')]" --allow-empty
        git push origin master
        Write-Host "✓ Cambios sincronizados con GitHub" -ForegroundColor Green
    } catch {
        Handle-Error "Error al sincronizar con GitHub: $_" -IsFatal $false
    }
} else {
    Write-Host "⚠️ Omitiendo sincronización con GitHub (--SkipGitPush)" -ForegroundColor Yellow
}

# Build de producción
if ($ForceRebuild -or -not (Test-Path -Path ".\dist")) {
    try {
        Write-Host "Construyendo aplicacion para produccion..." -ForegroundColor Cyan
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Error durante la construcción de la aplicación."
        }
        Write-Host "✓ Aplicación construida correctamente" -ForegroundColor Green
    } catch {
        Handle-Error "Error al construir la aplicación: $_"
    }
} else {
    Write-Host "⚠️ Omitiendo build (carpeta dist ya existe). Use --ForceRebuild para forzar" -ForegroundColor Yellow
}

# Desplegar en Vercel (opcional)
if (-not $SkipVercelDeploy) {
    try {
        Write-Host "Desplegando en Vercel..." -ForegroundColor Cyan
        vercel --prod
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Error durante el despliegue en Vercel."
        }
        Write-Host "✓ Despliegue en Vercel completado" -ForegroundColor Green
    } catch {
        Handle-Error "Error al desplegar en Vercel: $_"
    }
} else {
    Write-Host "⚠️ Omitiendo despliegue en Vercel (--SkipVercelDeploy)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         🎉 MODO PRODUCCION ACTIVADO 🎉         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 URL de produccion: $PROJECT_URL" -ForegroundColor Cyan
Write-Host "📈 Panel de Vercel: https://vercel.com/elvis-cossios-projects-ca2df045/dental-spark" -ForegroundColor Cyan
Write-Host "🗄️ Supabase: https://app.supabase.com/project/fdhanpamtgtyeaqskikh" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para ejecutar con opciones específicas:" -ForegroundColor White
Write-Host "  .\production-mode.ps1 -SkipGitPush -SkipVercelDeploy -ForceRebuild" -ForegroundColor Gray 