# 🔥 Bonfire Relay - Sistema de Mensageria Dark Souls

Sistema de mensageria com tema Dark Souls utilizando RabbitMQ como middleware de mensagens (MOM). Implementa os padrões Publisher/Subscriber e Request/Reply com API Gateway para demonstrar conceitos de sistemas distribuídos.

## 📋 Visão Geral

O **Bonfire Relay** simula um sistema de comunicação no universo Dark Souls através de mensageria assíncrona:

- **💬 Mensagens**: Sistema de chat entre jogadores com respostas de NPCs
- **⚔️ Invasões**: Sistema de PvP com detecção automática de ameaças
- **🔥 Fogueiras**: Eventos especiais de save points
- **🎯 Inteligência**: NPCs e invasores respondem baseado no contexto

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│    RabbitMQ     │────│   Consumidores  │
│  (HTTP → MQ)    │    │  (Exchange +    │    │ (Processadores) │
│                 │    │   Queues)       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Player Client   │    │ Message Topics  │    │ Business Logic  │
│ (Terminal UI)   │    │ • ashen_messages│    │ • NPC Responses │
│                 │    │ • ashen_invasions│   │ • Invasions     │
└─────────────────┘    │ • ashen_events  │    │ • Events        │
                       └─────────────────┘    └─────────────────┘
```

### Componentes

1. **API Gateway** (`api-gateway/server.js`): Recebe HTTP e publica no RabbitMQ
2. **Player Publisher** (`producers/player-publisher.js`): Cliente interativo
3. **NPC Consumer** (`consumers/npc-consumer.js`): Simula NPCs respondendo
4. **Invader Consumer** (`consumers/invader-consumer.js`): Sistema de invasões
5. **RabbitMQ**: Middleware com exchanges, filas e roteamento

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 16+
- RabbitMQ (Docker recomendado)
- Git

### Instalação e Configuração

```bash
# 1. Clonar repositório
git clone https://github.com/daniloladeira/Bonfire-Relay.git
cd Bonfire-Relay

# 2. Instalar dependências
npm install

# 3. Configurar filas no RabbitMQ
npm run setup
```

### Inicialização (em terminais separados)

```bash
# 1. Iniciar RabbitMQ
cd rabbitmq && docker-compose up -d

# 2. Configurar filas
npm run setup

# 3. Iniciar serviços (terminais separados)
npm run start:api        # Terminal 1 - API Gateway
npm run start:npc        # Terminal 2 - NPC Consumer  
npm run start:invader   # Terminal 5 - Sistema de invasões

# 6. Cliente Player (Interativo)
npm run start:publisher  # Terminal 6 - Cliente interativo
```
```

## 🎮 Como Usar

### Cliente Interativo (Recomendado)
```bash
npm run start:publisher
```

O cliente oferece uma interface completa:
- `/msg <mensagem>` - Enviar mensagem
- `/invade <jogador>` - Iniciar invasão  
- `/bonfire <nome>` - Acender fogueira
- `/zone <nome>` - Mudar de zona
- `/status` - Ver informações
- `/quit` - Sair

### API REST

#### Enviar Mensagem
```bash
curl -X POST http://localhost:3000/api/send-message 
  -H "Content-Type: application/json" 
  -d '{
    "sender": "Test Knight",
    "message": "Praise the sun!",
    "zone": "Firelink Shrine"
  }'
```

#### Iniciar Invasão
```bash
curl -X POST http://localhost:3000/api/invade 
  -H "Content-Type: application/json" 
  -d '{
    "invader": "Dark Spirit",
    "target": "Test Knight", 
    "zone": "Undead Burg",
    "covenant": "Darkwraith"
  }'
```

#### Acender Fogueira
```bash
curl -X POST http://localhost:3000/api/light-bonfire 
  -H "Content-Type: application/json" 
  -d '{
    "player": "Test Knight",
    "bonfire": "Firelink Shrine",
    "zone": "Central Hub"
  }'
```

#### Status do Sistema
```bash
curl http://localhost:3000/api/status
```

## 📊 Monitoramento

### URLs Importantes
- **API Gateway**: http://localhost:3000
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **Status da API**: http://localhost:3000/api/status

### Logs
```bash
# Logs em tempo real
tail -f logs/api-gateway.log
tail -f logs/npc-consumer.log  
tail -f logs/invader-consumer.log

# Ver todos os processos
ps aux | grep node
```

### Testes Automatizados
```bash
npm test  # Executa scripts/test-system.js
```

## 🎯 Funcionalidades Implementadas

### ✅ Requisitos Básicos
- [x] **Processos Publicadores**: API Gateway + Player Publisher
- [x] **Processos Consumidores**: NPC Consumer + Invader Consumer  
- [x] **MOM (RabbitMQ)**: Exchange, filas e roteamento
- [x] **Interligação**: Todos os processos se comunicam via RabbitMQ

### 🌟 Funcionalidades Avançadas
- [x] **Request/Reply Pattern**: NPCs respondem mensagens
- [x] **Pub/Sub Pattern**: Múltiplos consumidores por tópico
- [x] **Context Awareness**: Respostas baseadas em conteúdo e zona
- [x] **Auto Invasions**: Invasões automáticas por trigger words
- [x] **Graceful Shutdown**: Fechamento limpo de conexões
- [x] **Logging**: Sistema de logs estruturado
- [x] **Error Handling**: Tratamento robusto de erros
- [x] **Health Checks**: Monitoramento de saúde dos serviços

### 🎭 Tema Dark Souls
- [x] **Lore Accuracy**: Terminologia e ambientação fiéis
- [x] **NPCs Únicos**: Firekeeper, Andre, Logan, Patches, etc.
- [x] **Zonas Autênticas**: Firelink, Anor Londo, Catacombs, etc.
- [x] **Covenants**: Darkwraith, Forest Hunter, Darkmoon, etc.
- [x] **Atmospheric**: Mensagens imersivas e dramáticas

## 🔧 Scripts Disponíveis

```bash
# Execução
npm start              # API Gateway apenas

# Desenvolvimento  
npm run dev           # API Gateway com nodemon

# Serviços individuais
npm run start:api     # API Gateway
npm run start:publisher # Cliente interativo
npm run start:npc     # NPC Consumer
npm run start:invader # Invader Consumer

# Utilitários
npm run setup         # Configurar filas RabbitMQ
npm test             # Testes automatizados
./stop-all.sh        # Parar todos os serviços
```

## ⚙️ Configuração

### Variáveis de Ambiente (.env)
```bash
# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_MANAGEMENT_URL=http://localhost:15672

# API Gateway
PORT=3000
NODE_ENV=development

# Filas e Exchanges
EXCHANGE_NAME=ashen_realm
QUEUE_MESSAGES=ashen_messages
QUEUE_INVASIONS=ashen_invasions
QUEUE_EVENTS=ashen_events
```

### Docker Compose (RabbitMQ)
O projeto inclui `rabbitmq/docker-compose.yml` para facilitar o setup.

## 🧪 Testes e Demonstração

### Cenário de Teste Completo
1. **Iniciar cada componente** em terminais separados
2. **Abrir cliente**: `npm run start:publisher`
3. **Configurar jogador**: Inserir nome e zona
4. **Testar mensagens**: `/msg Hello world!`
5. **Testar invasões**: `/invade SomePlayer`
6. **Testar fogueiras**: `/bonfire TestBonfire`
7. **Verificar logs**: Ver respostas dos consumidores
8. **Monitorar RabbitMQ**: Acessar interface web

### Palavras-chave que Ativam Invasores
- **Provocações**: "invade", "duel", "challenge", "fight", "pvp"
- **Insultos**: "coward", "weak", "noob", "ganker" 
- **Zonas perigosas**: "Catacombs", "Darkroot", "New Londo"

## 📦 Estrutura do Projeto

```
Bonfire-Relay/
├── api-gateway/
│   └── server.js              # API Gateway principal
├── producers/
│   └── player-publisher.js    # Cliente interativo
├── consumers/
│   ├── npc-consumer.js        # Processador de NPCs
│   └── invader-consumer.js    # Sistema de invasões
├── shared/
│   └── rabbitmq.js           # Classe de conexão RabbitMQ
├── scripts/
│   ├── setup-queues.js       # Configuração de filas
│   └── test-system.js        # Testes automatizados
├── rabbitmq/
│   └── docker-compose.yml    # RabbitMQ via Docker
├── logs/                     # Arquivos de log
├── .env                     # Configurações
└── package.json             # Dependências e scripts
```

## 🛑 Parar o Sistema

```bash
# Método 1: Ctrl+C em cada terminal
# Encerrar cada processo individualmente

# Método 2: Manual
pkill -f "node.*bonfire"

# Parar RabbitMQ
docker-compose down          # Se usando docker-compose
docker stop rabbitmq        # Se usando docker run
sudo systemctl stop rabbitmq-server # Se instalação local
```

## 🏆 Tecnologias Utilizadas

- **Backend**: Node.js, Express.js
- **MOM**: RabbitMQ (amqplib)
- **Patterns**: Publisher/Subscriber, Request/Reply
- **Tools**: Docker, npm scripts
- **Monitoring**: RabbitMQ Management UI
- **CLI**: readline para interface interativa

## 👥 Apresentação

Para demonstrar o projeto:

1. **Mostrar arquitetura** explicando os componentes
2. **Iniciar cada componente** individualmente
3. **Demonstrar cliente** interativo
4. **Mostrar RabbitMQ** Management UI
5. **Executar testes** automatizados
6. **Explicar logs** e processamento
7. **Mostrar APIs** REST com curl/Postman

## 📝 Licença

MIT License - Danilo Ladeira

---

*"Don't you dare go Hollow" - Que a chama jamais se apague! 🔥*