# Script para actualizar el proyecto a travÃ©s de GitHub (despliegue automÃ¡tico)
param (
    [Parameter(Mandatory=$false)]
    [string]$CommitMessage = "ActualizaciÃ³n automÃ¡tica [$(Get-Date -Format 'yyyy-MM-dd HH:mm')]"
)

Write-Host "===== MODO PRODUCCIÃ“N VÃA GITHUB =====" -ForegroundColor Green
Write-Host "Las actualizaciones se desplegarÃ¡n automÃ¡ticamente tras push a GitHub"

# Agregar cambios
Write-Host "Agregando cambios al stage..." -ForegroundColor Cyan
git add .

# Verificar si hay cambios para commit
$status = git status --porcelain
if ($status) {
    Write-Host "Creando commit con los cambios..." -ForegroundColor Cyan
    git commit -m $CommitMessage
    
    # Push a GitHub
    Write-Host "Enviando cambios a GitHub..." -ForegroundColor Cyan
    git push origin master
    
    Write-Host "Â¡Cambios enviados con Ã©xito!" -ForegroundColor Green
    Write-Host "El despliegue a producciÃ³n comenzarÃ¡ automÃ¡ticamente en GitHub Actions." -ForegroundColor Green
    Write-Host "Verifica el estado en: https://github.com/cossiodev/Dental-Spark/actions" -ForegroundColor Cyan
} else {
    Write-Host "No se detectaron cambios para commit." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "DATOS DE PRODUCCIÃ“N:" -ForegroundColor Cyan
Write-Host "- URL: https://dental-spark.vercel.app" 
Write-Host "- GitHub: https://github.com/cossiodev/Dental-Spark"
Write-Host "- Vercel Dashboard: https://vercel.com/elvis-cossios-projects-ca2df045/dental-spark"
Write-Host "- Supabase: https://app.supabase.com/project/fdhanpamtgtyeaqskikh" 
