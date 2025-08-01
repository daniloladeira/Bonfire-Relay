#!/bin/bash

echo "🔥 Iniciando Bonfire Relay - Sistema de Mensageria Dark Souls"
echo "============================================================="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js primeiro."
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se RabbitMQ está rodando
echo "🐰 Verificando RabbitMQ..."
if ! nc -z localhost 5672; then
    echo "⚠️ RabbitMQ não está rodando. Tentando iniciar via Docker..."
    
    if command -v docker &> /dev/null; then
        if [ -f "rabbitmq/docker-compose.yml" ]; then
            cd rabbitmq
            docker-compose up -d
            cd ..
            echo "⏳ Aguardando RabbitMQ inicializar..."
            sleep 10
        else
            echo "🐳 Iniciando RabbitMQ via Docker run..."
            docker run -d \
                --name rabbitmq-bonfire \
                -p 5672:5672 \
                -p 15672:15672 \
                -e RABBITMQ_DEFAULT_USER=guest \
                -e RABBITMQ_DEFAULT_PASS=guest \
                rabbitmq:3-management
            sleep 15
        fi
    else
        echo "❌ Docker não encontrado. Por favor, inicie RabbitMQ manualmente."
        echo "💡 Alternativa: sudo systemctl start rabbitmq-server"
        exit 1
    fi
fi

# Configurar filas
echo "🔧 Configurando filas..."
npm run setup

# Criar diretório de logs
mkdir -p logs
touch logs/api-gateway.log
touch logs/npc-consumer.log
touch logs/invader-consumer.log

echo "🚀 Iniciando serviços..."

# Iniciar API Gateway
echo "🏰 Iniciando API Gateway..."
npm run start:api > logs/api-gateway.log 2>&1 &
API_PID=$!

# Aguardar API Gateway inicializar
sleep 3

# Iniciar consumidores
echo "🧙 Iniciando NPC Consumer..."
npm run start:npc > logs/npc-consumer.log 2>&1 &
NPC_PID=$!

echo "⚔️ Iniciando Invader Consumer..."
npm run start:invader > logs/invader-consumer.log 2>&1 &
INVADER_PID=$!

# Salvar PIDs para posterior cleanup
echo $API_PID > logs/api-gateway.pid
echo $NPC_PID > logs/npc-consumer.pid
echo $INVADER_PID > logs/invader-consumer.pid

# Aguardar tudo inicializar
sleep 5

echo ""
echo "✅ Bonfire Relay iniciado com sucesso!"
echo "🔥 Todos os serviços estão ativos"
echo ""
echo "📊 URLs importantes:"
echo "   API Gateway: http://localhost:3000"
echo "   RabbitMQ Management: http://localhost:15672 (guest/guest)"
echo ""
echo "📜 Logs em tempo real:"
echo "   tail -f logs/api-gateway.log"
echo "   tail -f logs/npc-consumer.log"
echo "   tail -f logs/invader-consumer.log"
echo ""
echo "🎮 Para iniciar cliente interativo:"
echo "   npm run start:publisher"
echo ""
echo "🧪 Para testar sistema:"
echo "   npm test"
echo ""
echo "🛑 Para parar tudo:"
echo "   ./stop-all.sh"
echo ""
echo "🎯 Que a chama jamais se apague!"
