# Script PowerShell para iniciar Bonfire Relay no Windows
Write-Host "🔥 Iniciando Bonfire Relay - Sistema de Mensageria Dark Souls" -ForegroundColor Yellow
Write-Host "=============================================================" -ForegroundColor Yellow

# Verificar se Node.js está instalado
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não encontrado. Por favor, instale Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se as dependências estão instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
    npm install
}

# Verificar se RabbitMQ está rodando
Write-Host "🐰 Verificando RabbitMQ..." -ForegroundColor Cyan
$rabbitmqRunning = Test-NetConnection -ComputerName localhost -Port 5672 -WarningAction SilentlyContinue

if (-not $rabbitmqRunning.TcpTestSucceeded) {
    Write-Host "⚠️ RabbitMQ não está rodando. Tentando iniciar via Docker..." -ForegroundColor Yellow
    
    if (Get-Command "docker" -ErrorAction SilentlyContinue) {
        if (Test-Path "rabbitmq\docker-compose.yml") {
            Set-Location rabbitmq
            docker-compose up -d
            Set-Location ..
            Write-Host "⏳ Aguardando RabbitMQ inicializar..." -ForegroundColor Yellow
            Start-Sleep 10
        } else {
            Write-Host "🐳 Iniciando RabbitMQ via Docker run..." -ForegroundColor Cyan
            docker run -d --name rabbitmq-bonfire -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=guest -e RABBITMQ_DEFAULT_PASS=guest rabbitmq:3-management
            Start-Sleep 15
        }
    } else {
        Write-Host "❌ Docker não encontrado. Por favor, inicie RabbitMQ manualmente." -ForegroundColor Red
        exit 1
    }
}

# Configurar filas
Write-Host "🔧 Configurando filas..." -ForegroundColor Cyan
npm run setup

# Criar diretório de logs
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs"
}

Write-Host "🚀 Iniciando serviços em novas janelas..." -ForegroundColor Green

# Iniciar API Gateway em nova janela
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm run start:api"

# Aguardar API Gateway inicializar
Start-Sleep 3

# Iniciar consumidores em novas janelas
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm run start:npc"
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm run start:gamemaster"

# Aguardar tudo inicializar
Start-Sleep 5

Write-Host ""
Write-Host "✅ Bonfire Relay iniciado com sucesso!" -ForegroundColor Green
Write-Host "🔥 Todos os serviços estão ativos em janelas separadas" -ForegroundColor Green
Write-Host ""
Write-Host "📊 URLs importantes:" -ForegroundColor Cyan
Write-Host "   API Gateway: http://localhost:3000"
Write-Host "   RabbitMQ Management: http://localhost:15672 (guest/guest)"
Write-Host ""
Write-Host "🎮 Para iniciar cliente interativo:" -ForegroundColor Yellow
Write-Host "   npm run start:publisher"
Write-Host ""
Write-Host "🧪 Para testar sistema:" -ForegroundColor Yellow
Write-Host "   npm test"
Write-Host ""
Write-Host "🛑 Para parar tudo:" -ForegroundColor Yellow
Write-Host "   .\stop-all.ps1"
Write-Host ""
Write-Host "🎯 Boa aventura!" -ForegroundColor Yellow
