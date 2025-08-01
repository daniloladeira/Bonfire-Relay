const RabbitMQConnection = require('../shared/rabbitmq');
require('dotenv').config();

class NPCConsumer {
  constructor() {
    this.rabbitmq = new RabbitMQConnection();
    this.processedMessages = 0;
    this.responses = this.initializeResponses();
  }

  initializeResponses() {
    return {
      greetings: [
        "[FIRE] Firekeeper: 'Bem-vindo, Chosen Undead. A chama aguarda...'",
        "[SMTH] Andre: 'Ah, um cliente! Que arma posso forjar para você?'",
        "[SAGE] Logan: 'Interessante... você busca conhecimento arcano?'",
        "[SERP] Frampt: 'Ahh, você trouxe almas? Excelente...'",
        "[THIF] Patches: 'Heh heh... mais um tolo perdido nas catacumbas.'"
      ],
      invasions: [
        "[FIRE] Firekeeper: 'Cuidado, chosen one. Dark spirits approach...'",
        "[SMTH] Andre: 'Invasores! Pegue uma arma, rápido!'",
        "[SAGE] Logan: 'A magia da invasão... fascinante e perigosa.'",
        "[SERP] Frampt: 'Keh heh heh... que batalha interessante se aproxima.'"
      ],
      bonfires: [
        "[FIRE] Firekeeper: 'A chama foi acesa. Rest well, warrior.'",
        "[KEEP] Bonfire Keeper: 'Another flame joins the network of fires.'",
        "[SMTH] Andre: 'Aha! A fogueira brilha forte. Boa escolha.'",
        "[SAGE] Logan: 'The flame connects all things... remarkable.'"
      ],
      farewells: [
        "[FIRE] Firekeeper: 'May the flames guide thee.'",
        "[SMTH] Andre: 'Stay safe out there!'",
        "[SAGE] Logan: 'Knowledge is power. Use it wisely.'",
        "[SERP] Frampt: 'Keh heh heh... until next time.'"
      ],
      general: [
        "[NPC ] NPC: 'The darkness grows stronger each day...'",
        "[WARR] Warrior: 'Praise the sun! \\\\[T]/'",
        "[ARCH] Archer: 'Watch for traps ahead.'",
        "[SORC] Sorcerer: 'The ancient magics stir...'",
        "[KNGT] Knight: 'Honor guides my blade.'"
      ]
    };
  }

  async start() {
    try {
      await this.rabbitmq.connect();
      console.log('[*] NPC Consumer iniciado - NPCs aguardando interações...');
      
      // Consumir mensagens principais
      await this.rabbitmq.consume('ashen_messages', (message, msg, channel) => {
        this.handleMessage(message, msg, channel);
      });

      // Consumir eventos de fogueira
      await this.rabbitmq.consume('ashen_events', (event, msg, channel) => {
        this.handleEvent(event, msg, channel);
      });

      console.log('✅ NPCs ativos e prontos para interação');
      
    } catch (error) {
      console.error('[-] Erro ao iniciar NPC Consumer:', error);
      process.exit(1);
    }
  }

  handleMessage(message, msg, channel) {
    try {
      this.processedMessages++;
      const { sender, message: text, zone, type } = message;
      
      console.log(`📥 [${zone}] ${sender}: "${text}"`);
      
      // Determinar tipo de resposta baseado no conteúdo
      let responseType = 'general';
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('hello') || lowerText.includes('oi') || lowerText.includes('salve')) {
        responseType = 'greetings';
      } else if (lowerText.includes('bye') || lowerText.includes('tchau') || lowerText.includes('farewell')) {
        responseType = 'farewells';
      } else if (lowerText.includes('praise') || lowerText.includes('sun') || lowerText.includes('sol')) {
        responseType = 'general';
      }
      
      // Gerar resposta
      const response = this.generateResponse(responseType, sender, zone);
      
      // Enviar resposta se houver replyTo
      if (msg.properties.replyTo) {
        const responseMessage = {
          response: response,
          originalSender: sender,
          responderZone: zone,
          timestamp: new Date().toISOString(),
          messageCount: this.processedMessages
        };
        
        channel.sendToQueue(
          msg.properties.replyTo, 
          Buffer.from(JSON.stringify(responseMessage)), {
            correlationId: msg.properties.correlationId
          }
        );
      }
      
      console.log(`� Resposta: ${response}`);
      channel.ack(msg);
      
    } catch (error) {
      console.error('[-] Erro ao processar mensagem:', error);
      channel.nack(msg, false, true);
    }
  }

  handleEvent(event, msg, channel) {
    try {
      const { player, bonfire, zone, type } = event;
      
      if (type === 'BONFIRE_LIT') {
        console.log(`[*] [${zone}] ${player} acendeu a fogueira: ${bonfire}`);
        
        const response = this.generateResponse('bonfires', player, zone);
        
        // Enviar resposta se houver replyTo
        if (msg.properties.replyTo) {
          const responseMessage = {
            response: response,
            eventType: 'BONFIRE_RESPONSE',
            timestamp: new Date().toISOString()
          };
          
          channel.sendToQueue(
            msg.properties.replyTo, 
            Buffer.from(JSON.stringify(responseMessage)), {
              correlationId: msg.properties.correlationId
            }
          );
        }
        
        console.log(`[>] Resposta: ${response}`);
      }
      
      channel.ack(msg);
      
    } catch (error) {
      console.error('[-] Erro ao processar evento:', error);
      channel.nack(msg, false, true);
    }
  }

  generateResponse(type, sender, zone) {
    const responses = this.responses[type] || this.responses.general;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Personalizar resposta baseado na zona
    const zoneModifiers = {
      'Anor Londo': ' The gods smile upon you.',
      'Blighttown': ' Be careful of the poison...',
      'Catacombs': ' The dead do not rest easy here.',
      'New Londo Ruins': ' The ghosts whisper of your presence.',
      'Darkroot Garden': ' The forest guardians watch...',
      'Sen\'s Fortress': ' Mind the traps, traveler.',
      'Firelink Shrine': ' This sanctuary offers respite.'
    };
    
    const modifier = zoneModifiers[zone] || '';
    return randomResponse + modifier;
  }

  getStats() {
    return {
      processedMessages: this.processedMessages,
      uptime: process.uptime(),
      status: 'active'
    };
  }

  async stop() {
    console.log('🌑 Parando NPC Consumer...');
    await this.rabbitmq.close();
    console.log('👋 NPCs foram para descansar');
  }
}

// Inicializar consumer
const npcConsumer = new NPCConsumer();

// Graceful shutdown
process.on('SIGINT', async () => {
  await npcConsumer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await npcConsumer.stop();
  process.exit(0);
});

// Status periódico
setInterval(() => {
  const stats = npcConsumer.getStats();
  console.log(`[i] NPC Stats: ${stats.processedMessages} mensagens processadas`);
}, 60000); // A cada minuto

npcConsumer.start().catch(console.error);
