# Bonfire Relay - Jogo de Chat Aventura

Sistema de chat interativo com tema Dark Souls utilizando RabbitMQ. Um jogo simples onde jogadores conversam, exploram, e participam de aventuras geradas automaticamente.

## Visão Geral

O **Bonfire Relay** é um jogo de chat onde:

- **Chat Interativo**: Converse com outros jogadores e NPCs inteligentes
- **Aventuras Automáticas**: Game Master cria eventos e missões aleatórias
- **Exploração**: Viaje entre zonas e explore o mundo
- **Sistema de Progressão**: Acenda fogueiras, colete itens, ganhe experiência

## Como Funciona

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Jogadores    │────│   Chat System   │────│  Game Master &  │
│   (Aventuras)   │    │   (RabbitMQ)    │    │      NPCs       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Componentes

1. **Chat System** (`api-gateway/server.js`): Sistema de mensagens
2. **Player Client** (`producers/player-publisher.js`): Interface do jogador
3. **NPCs** (`consumers/npc-consumer.js`): Personagens que respondem
4. **Game Master** (`consumers/game-master-consumer.js`): Cria eventos e aventuras

## Estrutura do Projeto

```
Bonfire-Relay/
├── api-gateway/
│   └── server.js                     # Sistema de chat
├── producers/
│   └── player-publisher.js           # Cliente do jogador
├── consumers/
│   ├── npc-consumer.js              # NPCs inteligentes
│   └── game-master-consumer.js      # Criador de aventuras
├── shared/
│   └── rabbitmq.js                  # Conexão de mensagens
├── scripts/
│   ├── setup-queues.js              # Configuração
│   └── test-system.js               # Testes
└── rabbitmq/
    └── docker-compose.yml           # Servidor de mensagens
```

## Instalação e Execução

### Pré-requisitos
- Node.js 16+
- RabbitMQ (Docker recomendado)
- Git

### Passos de Instalação

**IMPORTANTE**: Todos os comandos devem ser executados na pasta raiz do projeto:
```powershell
cd c:\Users\20232014040005\Documents\Bonfire-Relay
```

### 1. Instalar dependências
```powershell
# Na pasta raiz: Bonfire-Relay\
npm install
```

### 2. Iniciar RabbitMQ
```powershell
# Na pasta raiz: Bonfire-Relay\
cd rabbitmq
docker-compose up -d
cd ..
```

### 3. Configurar filas do RabbitMQ
```powershell
# Na pasta raiz: Bonfire-Relay\
npm run setup
```

### 4. Iniciar todos os serviços automaticamente
```powershell
# Na pasta raiz: Bonfire-Relay\
npm run start:all
```

### Ou iniciar manualmente em terminais separados

Todos os comandos abaixo devem ser executados na pasta raiz `Bonfire-Relay\`:

```powershell
# Terminal 1: Sistema de Chat
npm run start:api

# Terminal 2: NPCs Inteligentes  
npm run start:npc

# Terminal 3: Game Master (Criador de Aventuras)
npm run start:gamemaster

# Terminal 4: Seu Personagem
npm run start:publisher
```

### 5. Parar o sistema
```powershell
# Na pasta raiz: Bonfire-Relay\
npm run stop:all
```

## Como Jogar

### Iniciar o Jogo
```powershell
# Na pasta raiz: Bonfire-Relay\
npm run start:publisher
```

### Comandos do Jogo
- `/msg <mensagem>` - Conversar com outros jogadores
- `/bonfire <nome>` - Acender fogueira (salvar progresso)  
- `/zone <nome>` - Viajar para outra zona
- `/explore` - Explorar a área atual
- `/story <texto>` - Contar uma história
- `/roll` - Rolar dados da sorte
- `/inventory` - Ver seu inventário
- `/status` - Ver informações do personagem

### O que acontece no jogo:
- **NPCs respondem** às suas mensagens de forma inteligente
- **Game Master cria eventos** como caça ao tesouro, enigmas, corridas
- **Eventos globais** acontecem aleatoriamente 
- **Exploração** revela segredos e itens
- **Histórias** podem ativar missões especiais

## Exemplo de Jogo

```
[Aventureiro@Firelink Shrine] > /msg eai pessoal!
[>] Mensagem enviada: "eai pessoal!"
[WARR] Warrior: 'E aí, como vai a jornada?'

[Aventureiro@Firelink Shrine] > /explore
[>] Mensagem enviada: "exploro os arredores procurando por tesouros escondidos em Firelink Shrine"
[GAME] Game Master: 'Aventureiro, eu sinto a presença de um tesouro escondido em Firelink Shrine!'

[Aventureiro@Firelink Shrine] > /roll
[🎲] Você rolou: 17/20 - Boa sorte!
[>] Mensagem enviada: "rola os dados e tira 17! Boa sorte!"

[Aventureiro@Firelink Shrine] > /bonfire Fogueira Central
[*] Acendendo fogueira: Fogueira Central
[FIRE] Firekeeper: 'A chama foi acesa. Rest well, warrior.'
```

## Monitoramento

- **Chat**: http://localhost:3000
- **RabbitMQ**: http://localhost:15672 (guest/guest)
- **Status**: http://localhost:3000/api/status

## Testes

```powershell
# Na pasta raiz: Bonfire-Relay\
npm test
```

## Scripts Disponíveis

```bash
npm run start:all        # Iniciar tudo automaticamente
npm run stop:all         # Parar tudo
npm run start:publisher  # Apenas seu personagem
npm run start:api        # Apenas sistema de chat
npm run start:npc        # Apenas NPCs
npm run start:gamemaster # Apenas Game Master
```

## Tecnologias

- **Node.js** - Linguagem principal
- **RabbitMQ** - Sistema de mensagens
- **Docker** - Para rodar RabbitMQ
- **PowerShell** - Scripts de automação

---

*"Don't you dare go Hollow" - Boa aventura!*
