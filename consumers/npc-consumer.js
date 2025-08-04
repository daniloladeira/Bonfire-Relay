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
        "[THIF] Patches: 'Heh heh... mais um tolo perdido.'"
      ],
      casual_greetings: [
        "[WARR] Warrior: 'Eai parceiro, tudo bem?'",
        "[KNGT] Knight: 'Olá, aventureiro.'",
        "[ARCH] Archer: 'E aí, como vai a jornada?'",
        "[MERC] Mercenary: 'Fala aí, guerreiro!'",
        "[NPC ] Villager: 'Oi! Seja bem-vindo.'"
      ],
      farewells: [
        "[FIRE] Firekeeper: 'May the flames guide thee.'",
        "[SMTH] Andre: 'Stay safe out there!'",
        "[SAGE] Logan: 'Knowledge is power. Use it wisely.'",
        "[SERP] Frampt: 'Keh heh heh... until next time.'",
        "[WARR] Warrior: 'Até logo, amigo!'",
        "[KNGT] Knight: 'Que a sorte te acompanhe.'"
      ],
      praise_sun: [
        "[WARR] Solaire: 'Praise the sun! \\\\[T]/'",
        "[KNGT] Knight: 'Ah, um fellow sun worshipper!'",
        "[CLER] Cleric: 'The sun's blessing upon you!'",
        "[WARR] Warrior: 'Jolly cooperation!'",
        "[PALA] Paladin: 'May the sun illuminate your path.'"
      ],
      questions: [
        "[SAGE] Logan: 'Interessante pergunta... deixe-me pensar.'",
        "[MERC] Merchant: 'Hmm, talvez eu tenha uma resposta.'",
        "[SCHO] Scholar: 'Ah, curiosidade é uma virtude.'",
        "[WISE] Wise Man: 'Uma questão profunda, jovem.'"
      ],
      help_requests: [
        "[KNGT] Knight: 'Precisa de ajuda? Estou aqui.'",
        "[CLER] Cleric: 'Posso te auxiliar, irmão.'",
        "[WARR] Warrior: 'Conte comigo para a batalha!'",
        "[MAGE] Mage: 'Minha magia está à sua disposição.'"
      ],
      compliments: [
        "[FIRE] Firekeeper: 'Your kindness warms the flame.'",
        "[KNGT] Knight: 'Você tem um coração nobre.'",
        "[SAGE] Logan: 'Wise words from a wise soul.'",
        "[MERC] Merchant: 'You seem like good people.'"
      ],
      general_chat: [
        "[NPC ] Villager: 'Como vai sua aventura?'",
        "[WARR] Warrior: 'Que novidades você traz?'",
        "[TRAV] Traveler: 'Interessante... me conte mais.'",
        "[BARD] Bard: 'Essa história renderia uma boa canção!'",
        "[MERC] Merchant: 'Sempre bom trocar uma ideia.'"
      ],
      bonfires: [
        "[FIRE] Firekeeper: 'A chama foi acesa. Rest well, warrior.'",
        "[KEEP] Bonfire Keeper: 'Another flame joins the network of fires.'",
        "[SMTH] Andre: 'Aha! A fogueira brilha forte. Boa escolha.'",
        "[SAGE] Logan: 'The flame connects all things... remarkable.'"
      ],
      confusion: [
        "[NPC ] Villager: 'Hmm, não entendi bem...'",
        "[MERC] Merchant: 'Pode repetir isso?'",
        "[GUAR] Guard: 'Do que você está falando?'",
        "[SAGE] Logan: 'Intrigante... mas obscuro.'"
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
      
      // Analisar conteúdo da mensagem de forma mais inteligente
      const responseType = this.analyzeMessage(text);
      
      // Gerar resposta
      const response = this.generateResponse(responseType, sender, zone, text);
      
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
      
      console.log(`📤 Resposta: ${response}`);
      channel.ack(msg);
      
    } catch (error) {
      console.error('[-] Erro ao processar mensagem:', error);
      channel.nack(msg, false, true);
    }
  }

  analyzeMessage(text) {
    const lowerText = text.toLowerCase();
    
    // Cumprimentos formais
    if (lowerText.match(/\b(hello|greetings|salutations|good day)\b/)) {
      return 'greetings';
    }
    
    // Cumprimentos casuais
    if (lowerText.match(/\b(eai|oi|olá|hey|hi|e aí|opa|salve)\b/)) {
      return 'casual_greetings';
    }
    
    // Despedidas
    if (lowerText.match(/\b(bye|tchau|farewell|goodbye|até logo|see you|adeus)\b/)) {
      return 'farewells';
    }
    
    // Praise the sun
    if (lowerText.match(/\b(praise|sun|sol|solar|light|luz)\b/)) {
      return 'praise_sun';
    }
    
    // Perguntas
    if (lowerText.includes('?') || lowerText.match(/\b(como|what|onde|when|why|por que|qual|who)\b/)) {
      return 'questions';
    }
    
    // Pedidos de ajuda
    if (lowerText.match(/\b(help|ajuda|socorro|need|preciso|can you|você pode)\b/)) {
      return 'help_requests';
    }
    
    // Elogios/agradecimentos
    if (lowerText.match(/\b(obrigado|thanks|thank you|nice|good|great|awesome|cool|legal)\b/)) {
      return 'compliments';
    }
    
    // Conversa geral - mensagens longas ou com conteúdo
    if (text.length > 15 && !lowerText.match(/\b(invade|fight|duel|battle)\b/)) {
      return 'general_chat';
    }
    
    // Se não detectou nada específico, resposta de confusão
    if (text.length < 5) {
      return 'confusion';
    }
    
    // Default para conversa geral
    return 'general_chat';
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

  generateResponse(type, sender, zone, originalText = '') {
    // Se o tipo não existir, usar fallback baseado no contexto
    let responses = this.responses[type];
    
    if (!responses) {
      console.log(`[!] Tipo de resposta '${type}' não encontrado, usando general_chat`);
      responses = this.responses.general_chat || this.responses.confusion;
    }
    
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
