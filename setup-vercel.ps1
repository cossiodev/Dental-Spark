# Script para inicializar Vercel
Write-Host "Configurando Vercel para Dental Spark..." -ForegroundColor Green

# Verificar si Vercel CLI está instalado
$vercelInstalled = npm list -g vercel
if ($LASTEXITCODE -ne 0) {
    Write-Host "Instalando Vercel CLI globalmente..." -ForegroundColor Yellow
    npm install -g vercel
}

# Iniciar proyecto en Vercel
Write-Host "Vinculando proyecto con Vercel..." -ForegroundColor Cyan
vercel link --confirm

# Configurar secretos para Supabase
Write-Host "Configurando variables de entorno para Supabase..." -ForegroundColor Cyan
$supabaseUrl = Read-Host "Ingresa tu URL de Supabase"
$supabaseKey = Read-Host "Ingresa tu clave anónima de Supabase"

vercel env add VITE_SUPABASE_URL production $supabaseUrl --yes
vercel env add VITE_SUPABASE_ANON_KEY production $supabaseKey --yes

# Desplegar a Vercel
Write-Host "¿Deseas desplegar la aplicación ahora? (S/N)" -ForegroundColor Yellow
$respuesta = Read-Host
if ($respuesta -eq "S" -or $respuesta -eq "s") {
    vercel --prod
    Write-Host "¡Proyecto desplegado con éxito en Vercel!" -ForegroundColor Green
} else {
    Write-Host "Configuración completada. Usa 'npm run deploy' cuando estés listo para desplegar." -ForegroundColor Green
} 