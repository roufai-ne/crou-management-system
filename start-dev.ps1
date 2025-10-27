# Script de démarrage pour le développement
# CROU Management System

Write-Host "🚀 Démarrage du système CROU..." -ForegroundColor Green
Write-Host ""

# Vérifier que pnpm est installé
if (!(Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pnpm n'est pas installé. Veuillez l'installer avec:" -ForegroundColor Red
    Write-Host "npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

# Vérifier que les dépendances sont installées
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    pnpm install
}

# Créer les fichiers .env s'ils n'existent pas
if (!(Test-Path "apps\api\.env")) {
    Write-Host "⚙️  Création du fichier .env pour l'API..." -ForegroundColor Yellow
    Copy-Item "apps\api\.env.example" "apps\api\.env" -ErrorAction SilentlyContinue
    if (!(Test-Path "apps\api\.env.example")) {
        @"
# Configuration Base de Données PostgreSQL
DATABASE_URL=postgresql://crou_user:crou_password@localhost:5432/crou_database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crou_database
DB_USER=crou_user
DB_PASSWORD=crou_password

# Configuration Serveur
NODE_ENV=development
PORT=3001

# Configuration JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Configuration CORS
CORS_ORIGIN=http://localhost:3000
"@ | Out-File "apps\api\.env" -Encoding UTF8
    }
}

if (!(Test-Path "apps\web\.env")) {
    Write-Host "⚙️  Création du fichier .env pour l'application web..." -ForegroundColor Yellow
    @"
# Configuration API
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001

# Configuration App
VITE_APP_NAME=CROU Management System
VITE_APP_VERSION=1.0.0

# Configuration Environnement
NODE_ENV=development
"@ | Out-File "apps\web\.env" -Encoding UTF8
}

Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 L'API sera disponible sur: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🌐 L'application web sera disponible sur: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Pour vous connecter, utilisez:" -ForegroundColor Yellow
Write-Host "   Email: admin@crou.ne" -ForegroundColor White
Write-Host "   Mot de passe: admin123" -ForegroundColor White
Write-Host ""

# Démarrer les applications avec Turbo
Write-Host "🚀 Démarrage des applications..." -ForegroundColor Green
pnpm run dev
