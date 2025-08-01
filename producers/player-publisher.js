const readline = require('readline');
const chalk = require('c  showMenu() {
    console.log('\n[=] ═══ COMANDOS DISPONÍVEIS ═══');
    console.log('[>] /msg <mensagem>     - Enviar mensagem');
    console.log('[X] /invade <jogador>   - Iniciar invasão');
    console.log('[*] /bonfire <nome>     - Acender fogueira');
    console.log('[?] /zone <nome>       - Mudar de zona');
    console.log('[i] /status            - Ver status');
    console.log('[-] /quit              - Sair');
    console.log('═══════════════════════════════════════\n');
    this.showPrompt();
  }st { v4: uuidv4 } = require('uuid');
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
    console.log('\n� ═══ COMANDOS DISPONÍVEIS ═══');
    console.log('[>] /msg <mensagem>     - Enviar mensagem');
    console.log('[X] /invade <jogador>   - Iniciar invasão');
    console.log('[*] /bonfire <nome>     - Acender fogueira');
    console.log('[?] /zone <nome>       - Mudar de zona');
    console.log('[i] /status            - Ver status');
    console.log('[-] /quit              - Sair');
    console.log('═══════════════════════════════════════\n');
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

      case '/invade':
        if (!argument) {
          console.log('[X] Uso: /invade <nome do jogador>');
          return;
        }
        await this.sendInvasion(argument);
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
        console.log(`[?] Você entrou em ${this.currentZone}`);
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
        console.log(`❓ Comando desconhecido: ${cmd}`);
        console.log('[i] Digite /help para ver os comandos disponíveis');
    }
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

  async sendInvasion(target) {
    const invasionData = {
      id: uuidv4(),
      invader: this.playerName,
      target: target,
      zone: this.currentZone,
      covenant: 'Darkwraith',
      timestamp: new Date().toISOString(),
      type: 'INVASION'
    };

    await this.rabbitmq.sendToQueue('ashen_invasions', invasionData, {
      replyTo: this.replyQueue.queue,
      correlationId: invasionData.id
    });

    console.log(`[X] Invadindo ${target} em ${this.currentZone}...`);
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
