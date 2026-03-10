# Microservices Setup Script

Write-Host "🚀 Talk2Fast Microservices Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green

# Check if MongoDB is accessible
Write-Host "Checking MongoDB connection..." -ForegroundColor Yellow
$mongoCheck = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
if ($mongoCheck.TcpTestSucceeded) {
    Write-Host "✅ MongoDB is accessible on localhost:27017" -ForegroundColor Green
} else {
    Write-Host "⚠️  MongoDB not detected on localhost:27017" -ForegroundColor Yellow
    Write-Host "   Make sure MongoDB is running before starting services" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

Write-Host ""
Write-Host "📝 Setting up environment files..." -ForegroundColor Yellow

# Gateway Service
if (-not (Test-Path "gateway-service\.env")) {
    Copy-Item "gateway-service\.env.example" "gateway-service\.env"
    Write-Host "✅ Created gateway-service/.env" -ForegroundColor Green
} else {
    Write-Host "⏭️  gateway-service/.env already exists" -ForegroundColor Cyan
}

# Auth Service
if (-not (Test-Path "services\auth-service\.env")) {
    Copy-Item "services\auth-service\.env.example" "services\auth-service\.env"
    Write-Host "✅ Created services/auth-service/.env" -ForegroundColor Green
} else {
    Write-Host "⏭️  services/auth-service/.env already exists" -ForegroundColor Cyan
}

# Chatbot Service
if (-not (Test-Path "services\chatbot-service\.env")) {
    Copy-Item "services\chatbot-service\.env.example" "services\chatbot-service\.env"
    Write-Host "✅ Created services/chatbot-service/.env" -ForegroundColor Green
} else {
    Write-Host "⏭️  services/chatbot-service/.env already exists" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Configure your .env files before starting:" -ForegroundColor Yellow
Write-Host "   1. gateway-service/.env" -ForegroundColor White
Write-Host "   2. services/auth-service/.env (Supabase & MongoDB credentials)" -ForegroundColor White
Write-Host "   3. services/chatbot-service/.env (MongoDB & RAG API)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 To start the microservices:" -ForegroundColor Cyan
Write-Host "   Development mode: npm run dev" -ForegroundColor White
Write-Host "   Production mode:  npm start" -ForegroundColor White
Write-Host ""
Write-Host "📚 For more information, see:" -ForegroundColor Cyan
Write-Host "   - QUICKSTART.md" -ForegroundColor White
Write-Host "   - MICROSERVICES.md" -ForegroundColor White
Write-Host "   - MIGRATION_SUMMARY.md" -ForegroundColor White
Write-Host ""
