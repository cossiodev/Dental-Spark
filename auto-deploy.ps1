# Script para despliegue automático con Vercel
Write-Host "Iniciando proceso de auto-despliegue..." -ForegroundColor Green

# Agregar cambios y realizar commit
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al agregar archivos. Abortando." -ForegroundColor Red
    exit 1
}

git commit -m "Auto commit - producción"
if ($LASTEXITCODE -ne 0) {
    Write-Host "No hay cambios para commit o hubo un error. Continuando..." -ForegroundColor Yellow
}

# Push a GitHub
git push origin master
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al hacer push. Revisar credenciales." -ForegroundColor Red
    exit 1
}

Write-Host "Cambios subidos a GitHub. Desplegando en Vercel..." -ForegroundColor Green

# Desplegar en Vercel
npm run deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en el despliegue a Vercel. Abortando." -ForegroundColor Red
    exit 1
}

Write-Host "¡Proyecto desplegado con éxito en Vercel!" -ForegroundColor Green 