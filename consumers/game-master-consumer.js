const RabbitMQConnection = require('../shared/rabbitmq');
require('dotenv').config();

class GameMasterConsumer {
  constructor() {
    this.rabbitmq = new RabbitMQConnection();
    this.activeEvents = new Map();
    this.playerStats = new Map();
    this.eventHistory = [];
    this.totalEvents = 0;
  }

  async start() {
    try {
      await this.rabbitmq.connect();
      console.log('[*] Game Master iniciado - Criando diversão...');
      
      // Consumir mensagens para criar eventos
      await this.rabbitmq.consume('ashen_messages', (message, msg, channel) => {
        this.handleMessage(message, msg, channel);
      });

      // Consumir eventos especiais
      await this.rabbitmq.consume('ashen_events', (event, msg, channel) => {
        this.handleSpecialEvent(event, msg, channel);
      });

      console.log('[*] Game Master ativo - Preparando aventuras...');
      
      // Iniciar eventos automáticos
      this.startRandomEvents();
      
    } catch (error) {
      console.error('[-] Erro ao iniciar Game Master:', error);
      process.exit(1);
    }
  }

  handleMessage(message, msg, channel) {
    try {
      const { sender, message: text, zone } = message;
      const lowerText = text.toLowerCase();
      
      // Atualizar stats do jogador
      this.updatePlayerStats(sender, zone);
      
      // Detectar palavras que ativam mini-jogos
      const gameWords = [
        'aventura', 'adventure', 'explorar', 'explore', 'jogar', 'game',
        'tesouro', 'treasure', 'quest', 'missão', 'desafio', 'challenge'
      ];
      
      const shouldTriggerEvent = gameWords.some(word => lowerText.includes(word)) ||
                                Math.random() < 0.15; // 15% chance aleatória
      
      if (shouldTriggerEvent) {
        console.log(`[*] [${zone}] Game Master detectou: "${text}" de ${sender}`);
        
        const gameEvent = this.createRandomEvent(sender, zone, text);
        
        // Enviar evento divertido
        if (msg.properties.replyTo) {
          const responseMessage = {
            response: gameEvent.description,
            eventType: gameEvent.type,
            reward: gameEvent.reward,
            difficulty: gameEvent.difficulty,
            timestamp: new Date().toISOString()
          };
          
          channel.sendToQueue(
            msg.properties.replyTo, 
            Buffer.from(JSON.stringify(responseMessage)), {
              correlationId: msg.properties.correlationId
            }
          );
        }
        
        console.log(`[>] Evento: ${gameEvent.description}`);
      } else {
        // Resposta casual do Game Master
        const casualResponse = this.getCasualResponse(sender, zone, text);
        if (msg.properties.replyTo && Math.random() < 0.3) { // 30% chance
          const responseMessage = {
            response: casualResponse,
            timestamp: new Date().toISOString()
          };
          
          channel.sendToQueue(
            msg.properties.replyTo, 
            Buffer.from(JSON.stringify(responseMessage)), {
              correlationId: msg.properties.correlationId
            }
          );
        }
      }
      
      channel.ack(msg);
      
    } catch (error) {
      console.error('[-] Erro ao processar mensagem:', error);
      channel.nack(msg, false, true);
    }
  }

  createRandomEvent(player, zone, originalText) {
    const events = [
      {
        type: 'TREASURE_HUNT',
        description: `[GAME] Game Master: '${player}, eu sinto a presença de um tesouro escondido em ${zone}! 🎁'`,
        reward: 'Moedas de ouro',
        difficulty: 'Fácil'
      },
      {
        type: 'RIDDLE_CHALLENGE',
        description: `[GAME] Sábio Ancião: '${player}, resolva este enigma: O que é que quanto mais se tira, maior fica?' 🤔`,
        reward: 'Pergaminho de Sabedoria',
        difficulty: 'Médio'
      },
      {
        type: 'FRIENDLY_RACE',
        description: `[GAME] Corredor: '${player}, que tal uma corrida amigável até a próxima fogueira? 🏃‍♂️'`,
        reward: 'Botas de Velocidade',
        difficulty: 'Fácil'
      },
      {
        type: 'CRAFTING_QUEST',
        description: `[GAME] Artesão: '${player}, preciso de 3 cristais mágicos para criar algo especial! Pode me ajudar? ⚒️'`,
        reward: 'Arma Encantada',
        difficulty: 'Médio'
      },
      {
        type: 'PEACEFUL_ENCOUNTER',
        description: `[GAME] Viajante Misterioso: '${player}, compartilhe uma história comigo e eu lhe darei um presente! 📚'`,
        reward: 'Mapa Secreto',
        difficulty: 'Fácil'
      },
      {
        type: 'MINI_BOSS',
        description: `[GAME] Guardião da Floresta: '${player}, prove seu valor enfrentando meu desafio de lógica! 🌳'`,
        reward: 'Coroa de Folhas',
        difficulty: 'Difícil'
      },
      {
        type: 'TRADING_GAME',
        description: `[GAME] Mercador: '${player}, tenho itens raros para trocar! Que tal um jogo de barganha? 💰'`,
        reward: 'Item Raro',
        difficulty: 'Médio'
      },
      {
        type: 'EXPLORATION',
        description: `[GAME] Explorador: '${player}, descobri uma caverna secreta em ${zone}! Vamos explorar juntos? 🗺️'`,
        reward: 'Relíquia Antiga',
        difficulty: 'Médio'
      }
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    this.totalEvents++;
    
    return randomEvent;
  }

  getCasualResponse(player, zone, text) {
    const responses = [
      `[GAME] Game Master: 'Interessante, ${player}... continue explorando!'`,
      `[GAME] Narrador: 'Em ${zone}, ${player} pondera sobre a vida...'`,
      `[GAME] Eco: 'As palavras de ${player} ecoam pela região...'`,
      `[GAME] Vento: 'O vento leva sua mensagem para outros aventureiros...'`,
      `[GAME] Sábio: 'Sábias palavras, jovem ${player}.'`,
      `[GAME] Bardo: 'Isso daria uma boa música, ${player}!'`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  handleSpecialEvent(event, msg, channel) {
    try {
      const { player, bonfire, zone, type } = event;
      
      if (type === 'BONFIRE_LIT') {
        console.log(`[*] [${zone}] ${player} acendeu a fogueira: ${bonfire}`);
        
        // Eventos especiais quando fogueira é acesa
        const bonfireEvents = [
          `[GAME] Espírito da Fogueira: '${player}, a chama revela segredos... Use /explore para descobrir!'`,
          `[GAME] Firekeeper: '${player}, sua alma brilha mais forte. Ganhou +10 pontos de experiência!'`,
          `[GAME] Viajante: '${player}, outros aventureiros deixaram mensagens aqui. Use /read para ver!'`,
          `[GAME] Guardião: '${player}, a fogueira ${bonfire} agora é seu ponto de respawn!'`
        ];
        
        const response = bonfireEvents[Math.floor(Math.random() * bonfireEvents.length)];
        
        if (msg.properties.replyTo) {
          const responseMessage = {
            response: response,
            eventType: 'BONFIRE_BLESSING',
            experience: 10,
            timestamp: new Date().toISOString()
          };
          
          channel.sendToQueue(
            msg.properties.replyTo, 
            Buffer.from(JSON.stringify(responseMessage)), {
              correlationId: msg.properties.correlationId
            }
          );
        }
        
        console.log(`[>] Evento da Fogueira: ${response}`);
      }
      
      channel.ack(msg);
      
    } catch (error) {
      console.error('[-] Erro ao processar evento especial:', error);
      channel.nack(msg, false, true);
    }
  }

  updatePlayerStats(player, zone) {
    if (!this.playerStats.has(player)) {
      this.playerStats.set(player, {
        name: player,
        zones_visited: new Set(),
        messages_sent: 0,
        events_completed: 0,
        last_seen: new Date(),
        favorite_zone: zone
      });
    }
    
    const stats = this.playerStats.get(player);
    stats.zones_visited.add(zone);
    stats.messages_sent++;
    stats.last_seen = new Date();
    
    // Atualizar zona favorita (onde mais fala)
    if (Math.random() < 0.3) {
      stats.favorite_zone = zone;
    }
  }

  startRandomEvents() {
    // Evento global a cada 2-5 minutos
    setInterval(() => {
      this.createGlobalEvent();
    }, (2 + Math.random() * 3) * 60000); // 2-5 minutos
    
    // Status dos jogadores a cada 10 minutos
    setInterval(() => {
      this.showPlayerStats();
    }, 10 * 60000);
  }

  createGlobalEvent() {
    const globalEvents = [
      '[GAME] EVENTO GLOBAL: Um meteoro dourado cruza o céu! Quem falar primeiro ganha um bônus! ⭐',
      '[GAME] EVENTO GLOBAL: Mercador raro apareceu! Digite /trade para negociar itens especiais! 🛒',
      '[GAME] EVENTO GLOBAL: Festival da Lua! Todas as ações geram +50% de experiência! 🌙',
      '[GAME] EVENTO GLOBAL: Chuva de estrelas! Façam um pedido digitando /wish! ✨',
      '[GAME] EVENTO GLOBAL: Dragão amigável sobrevoando! Acenem com /wave para receber uma bênção! 🐉'
    ];
    
    const event = globalEvents[Math.floor(Math.random() * globalEvents.length)];
    console.log(`[!] EVENTO GLOBAL: ${event}`);
  }

  showPlayerStats() {
    if (this.playerStats.size > 0) {
      console.log(`[i] Game Master Stats: ${this.totalEvents} eventos criados, ${this.playerStats.size} jogadores ativos`);
    }
  }

  getStats() {
    return {
      totalEvents: this.totalEvents,
      activePlayers: this.playerStats.size,
      uptime: process.uptime(),
      status: 'creating_fun'
    };
  }

  async stop() {
    console.log('[*] Game Master parando...');
    await this.rabbitmq.close();
    console.log('[*] Game Master offline - Até a próxima aventura!');
  }
}

// Inicializar Game Master
const gameMaster = new GameMasterConsumer();

// Graceful shutdown
process.on('SIGINT', async () => {
  await gameMaster.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await gameMaster.stop();
  process.exit(0);
});

// Status periódico
setInterval(() => {
  const stats = gameMaster.getStats();
  console.log(`[i] Game Master Stats: ${stats.totalEvents} eventos criados, ${stats.activePlayers} jogadores ativos`);
}, 60000); // A cada minuto

gameMaster.start().catch(console.error);
