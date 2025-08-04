const readline = require('readline');
const { v4: uuidv4 } = require('uuid');
const RabbitMQConnection = require('../shared/rabbitmq');
require('dotenv').config();

class PlayerPublisher {
  constructor() {
    this.rabbitmq = new RabbitMQConnection();
    this.playerName = 'Unknown Undead';
    this.currentZone = 'Firelink Shrine';
    this.isConnected = false;
    
    // Setup terminal input
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async initialize() {
    try {
      await this.rabbitmq.connect();
      this.isConnected = true;
      
      // Setup reply queue for responses
      this.replyQueue = await this.rabbitmq.channel.assertQueue('', { exclusive: true });
      
      // Listen for responses
      await this.rabbitmq.consume(this.replyQueue.queue, (message, msg) => {
        console.log(`\n� ${message.response || message}`);
        this.showPrompt();
      }, { noAck: true });
      
      console.log('[*] Conectado ao Ashen Network');
      this.setupPlayer();
      
    } catch (error) {
      console.error('[-] Erro ao conectar:', error.message);
      console.log('[i] Certifique-se de que o RabbitMQ está rodando');
      process.exit(1);
    }
  }

  setupPlayer() {
    console.log('\n[*] ═══════════════════════════════════════');
    console.log('[*]        BEM-VINDO AO ASHEN NETWORK        [*]');
    console.log('═══════════════════════════════════════\n');
    
    this.rl.question('[>] Digite o nome do seu personagem: ', (name) => {
      this.playerName = name || 'Unknown Undead';
      
      this.rl.question('[?] Em que zona você está? ', (zone) => {
        this.currentZone = zone || 'Firelink Shrine';
        
        console.log(`\n✅ ${this.playerName} entrou em ${this.currentZone}`);
        this.showMenu();
        this.startListening();
      });
    });
  }

  showMenu() {
    console.log('\n=== COMANDOS DO JOGO ===');
    console.log('[>] /msg <mensagem>     - Conversar com outros jogadores');
    console.log('[*] /bonfire <nome>     - Acender fogueira (salvar progresso)');
    console.log('[?] /zone <nome>       - Viajar para outra zona');
    console.log('[!] /explore           - Explorar a área atual');
    console.log('[📚] /story <texto>     - Contar uma história');
    console.log('[🎲] /roll             - Rolar dados da sorte');
    console.log('[🎒] /inventory        - Ver seu inventário');
    console.log('[i] /status            - Ver informações do personagem');
    console.log('[-] /quit              - Sair do jogo');
    console.log('========================================\n');
    this.showPrompt();
  }

  showPrompt() {
    process.stdout.write(`[${this.playerName}@${this.currentZone}] > `);
  }

  startListening() {
    this.rl.on('line', async (input) => {
      const trimmed = input.trim();
      
      if (!trimmed) {
        this.showPrompt();
        return;
      }

      try {
        await this.processCommand(trimmed);
      } catch (error) {
        console.log(`[-] Erro: ${error.message}`);
      }
      
      this.showPrompt();
    });
  }

  async processCommand(input) {
    if (input.startsWith('/')) {
      await this.handleSpecialCommand(input);
    } else {
      await this.sendMessage(input);
    }
  }

  async handleSpecialCommand(command) {
    const [cmd, ...args] = command.split(' ');
    const argument = args.join(' ');

    switch (cmd) {
      case '/msg':
        if (!argument) {
          console.log('[>] Uso: /msg <sua mensagem>');
          return;
        }
        await this.sendMessage(argument);
        break;

      case '/bonfire':
        if (!argument) {
          console.log('[*] Uso: /bonfire <nome da fogueira>');
          return;
        }
        await this.lightBonfire(argument);
        break;

      case '/zone':
        if (!argument) {
          console.log('[?] Uso: /zone <nome da zona>');
          return;
        }
        this.currentZone = argument;
        console.log(`[?] Você viajou para ${this.currentZone}`);
        await this.sendMessage(`chegou em ${this.currentZone}`);
        break;

      case '/explore':
        await this.explore();
        break;

      case '/story':
        if (!argument) {
          console.log('[📚] Uso: /story <sua história>');
          return;
        }
        await this.tellStory(argument);
        break;

      case '/roll':
        await this.rollDice();
        break;

      case '/inventory':
        this.showInventory();
        break;

      case '/status':
        this.showStatus();
        break;

      case '/help':
        this.showMenu();
        break;

      case '/quit':
        await this.disconnect();
        break;

      default:
        console.log(`? Comando desconhecido: ${cmd}`);
        console.log('[i] Digite /help para ver os comandos disponíveis');
    }
  }

  async explore() {
    const explorations = [
      'exploro os arredores procurando por tesouros escondidos',
      'investigo ruínas antigas em busca de segredos',
      'procuro por itens úteis pela área',
      'observo a paisagem em busca de algo interessante',
      'caminho pelas trilhas menos conhecidas',
      'verifico atrás de pedras e árvores'
    ];
    
    const action = explorations[Math.floor(Math.random() * explorations.length)];
    await this.sendMessage(`${action} em ${this.currentZone}`);
  }

  async tellStory(story) {
    await this.sendMessage(`conta uma história: "${story}"`);
  }

  async rollDice() {
    const roll = Math.floor(Math.random() * 20) + 1;
    const results = {
      20: 'CRÍTICO! Sorte incrível! ⭐',
      1: 'Azar total... mas faz parte! 💀',
      'high': 'Boa sorte! 😊',
      'medium': 'Resultado mediano. 😐',
      'low': 'Podia ser melhor... 😅'
    };
    
    let result;
    if (roll === 20) result = results[20];
    else if (roll === 1) result = results[1];
    else if (roll >= 15) result = results.high;
    else if (roll >= 8) result = results.medium;
    else result = results.low;
    
    console.log(`[🎲] Você rolou: ${roll}/20 - ${result}`);
    await this.sendMessage(`rola os dados e tira ${roll}! ${result}`);
  }

  showInventory() {
    // Inventário simulado baseado em ações
    const items = [
      'Poção de Cura',
      'Mapa da Região',
      'Moedas de Ouro (15)',
      'Pedra de Fogueira',
      'Pergaminho Misterioso'
    ];
    
    console.log('\n[🎒] === SEU INVENTÁRIO ===');
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item}`);
    });
    console.log('===========================\n');
  }

  async sendMessage(message) {
    const messageData = {
      id: uuidv4(),
      sender: this.playerName,
      message: message,
      zone: this.currentZone,
      timestamp: new Date().toISOString(),
      type: 'MESSAGE'
    };

    await this.rabbitmq.sendToQueue('ashen_messages', messageData, {
      replyTo: this.replyQueue.queue,
      correlationId: messageData.id
    });

    console.log(`[>] Mensagem enviada: "${message}"`);
  }

  async lightBonfire(bonfireName) {
    const eventData = {
      id: uuidv4(),
      player: this.playerName,
      bonfire: bonfireName,
      zone: this.currentZone,
      timestamp: new Date().toISOString(),
      type: 'BONFIRE_LIT'
    };

    await this.rabbitmq.sendToQueue('ashen_events', eventData, {
      replyTo: this.replyQueue.queue,
      correlationId: eventData.id
    });

    console.log(`[*] Acendendo fogueira: ${bonfireName}`);
  }

  showStatus() {
    console.log('\n[i] ═══ STATUS DO JOGADOR ═══');
    console.log(`[USER] Nome: ${this.playerName}`);
    console.log(`[?] Zona: ${this.currentZone}`);
    console.log(`🔗 Conectado: ${this.isConnected ? '✅' : '[-]'}`);
    console.log(`⏰ Tempo: ${new Date().toLocaleTimeString()}`);
    console.log('═══════════════════════════════\n');
  }

  async disconnect() {
    console.log('\n🌑 Desconectando do Ashen Network...');
    this.rl.close();
    await this.rabbitmq.close();
    console.log('👋 Até logo, que a chama jamais se apague!');
    process.exit(0);
  }
}

// Inicializar o publisher
const publisher = new PlayerPublisher();

// Graceful shutdown
process.on('SIGINT', async () => {
  await publisher.disconnect();
});

process.on('SIGTERM', async () => {
  await publisher.disconnect();
});

// Iniciar
publisher.initialize().catch(console.error);
