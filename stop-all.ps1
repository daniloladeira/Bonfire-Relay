# Script PowerShell para parar Bonfire Relay no Windows
Write-Host "🌑 Parando Bonfire Relay - A chama se apaga..." -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow

# Parar processos Node.js relacionados ao projeto
Write-Host "🛑 Parando processos Node.js..." -ForegroundColor Cyan

# Matar processos específicos do projeto
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.ProcessName -eq "node"
} | ForEach-Object {
    $processId = $_.Id
    $commandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $processId").CommandLine
    
    if ($commandLine -match "bonfire|api-gateway|npc-consumer|game-master-consumer|player-publisher") {
        Write-Host "🛑 Parando processo: $commandLine" -ForegroundColor Yellow
        Stop-Process -Id $processId -Force
    }
}

# Aguardar processos terminarem
Start-Sleep 2

Write-Host ""
Write-Host "🌑 Todos os serviços foram parados" -ForegroundColor Green
Write-Host "💀 A chama se apagou... até a próxima jornada" -ForegroundColor DarkGray
Write-Host ""
Write-Host "📊 RabbitMQ ainda pode estar rodando:" -ForegroundColor Cyan
Write-Host "   Para parar: docker stop rabbitmq-bonfire" -ForegroundColor White
Write-Host "   Ou via compose: cd rabbitmq; docker-compose down" -ForegroundColor White
