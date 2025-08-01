#!/bin/bash

echo "🌑 Parando Bonfire Relay - A chama se apaga..."
echo "=============================================="

# Função para parar processo por PID
stop_process() {
    local name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🛑 Parando $name (PID: $pid)..."
            kill "$pid"
            rm "$pid_file"
        else
            echo "⚠️ $name já estava parado"
            rm -f "$pid_file"
        fi
    else
        echo "⚠️ PID file para $name não encontrado"
    fi
}

# Parar todos os serviços
stop_process "API Gateway" "logs/api-gateway.pid"
stop_process "NPC Consumer" "logs/npc-consumer.pid"
stop_process "Invader Consumer" "logs/invader-consumer.pid"

# Aguardar processos terminarem
sleep 2

# Tentar parar processos restantes pelo nome
echo "🧹 Limpando processos restantes..."
pkill -f "node.*api-gateway"
pkill -f "node.*npc-consumer"
pkill -f "node.*invader-consumer"
pkill -f "node.*player-publisher"

echo ""
echo "🌑 Todos os serviços foram parados"
echo "💀 A chama se apagou... até a próxima jornada"
echo ""
echo "📊 RabbitMQ ainda pode estar rodando:"
echo "   Para parar: docker stop rabbitmq-bonfire"
echo "   Ou via compose: cd rabbitmq && docker-compose down"
echo "   Ou serviço: sudo systemctl stop rabbitmq-server"
