const RabbitMQConnection = require('../shared/rabbitmq');
require('dotenv').config();

class InvaderConsumer {
  constructor() {
    this.rabbitmq = new RabbitMQConnection();
    this.activeInvasions = new Map();
    this.invasionHistory = [];
    this.totalInvasions = 0;
  }

  async start() {
    try {
      await this.rabbitmq.connect();
      console.log('[*] Invader Consumer iniciado - Dark spirits gathering...');
      
      // Consumir mensagens gerais (para detectar provocações)
      await this.rabbitmq.consume('ashen_messages', (message, msg, channel) => {
        this.handleMessage(message, msg, channel);
      });

      // Consumir invasões diretas
      await this.rabbitmq.consume('ashen_invasions', (invasion, msg, channel) => {
        this.handleInvasion(invasion, msg, channel);
      });

      console.log('[!] Invasores ativos e buscando por alvos...');
      
      // Simular resolução de invasões
      this.startInvasionSimulation();
      
    } catch (error) {
      console.error('[-] Erro ao iniciar Invader Consumer:', error);
      process.exit(1);
    }
  }

  handleMessage(message, msg, channel) {
    try {
      const { sender, message: text, zone } = message;
      const lowerText = text.toLowerCase();
      
      // Detectar provocações ou palavras-chave que atraem invasores
      const triggerWords = [
        'invade', 'duel', 'challenge', 'fight', 'pvp', 
        'coward', 'weak', 'noob', 'ganker', 'tryhard'
      ];
      
      const dangerousZones = [
        'Catacombs', 'New Londo Ruins', 'Darkroot Garden', 
        'Forest', 'Anor Londo', 'Demon Ruins'
      ];
      
      const shouldRespond = triggerWords.some(word => lowerText.includes(word)) ||
                           dangerousZones.some(zone_name => zone.includes(zone_name));
      
      if (shouldRespond) {
        console.log(`[!] [${zone}] Invasor detectou: "${text}" de ${sender}`);
        
        const response = this.generateThreat(sender, zone, text);
        
        // Chance de invasão automática
        if (Math.random() < 0.3) { // 30% de chance
          this.triggerAutoInvasion(sender, zone);
        }
        
        // Enviar resposta ameaçadora
        if (msg.properties.replyTo) {
          const responseMessage = {
            response: response,
            invaderType: 'Dark Spirit',
            threat_level: this.calculateThreatLevel(text, zone),
            timestamp: new Date().toISOString()
          };
          
          channel.sendToQueue(
            msg.properties.replyTo, 
            Buffer.from(JSON.stringify(responseMessage)), {
              correlationId: msg.properties.correlationId
            }
          );
        }
        
        console.log(`[X] Ameaça: ${response}`);
      } else {
        console.log(`😐 [${zone}] Invasor ignorou: "${text}" de ${sender}`);
      }
      
      channel.ack(msg);
      
    } catch (error) {
      console.error('[-] Erro ao processar mensagem:', error);
      channel.nack(msg, false, true);
    }
  }

  handleInvasion(invasion, msg, channel) {
    try {
      this.totalInvasions++;
      const { invader, target, zone, covenant, id } = invasion;
      
      console.log(`[!] INVASÃO DETECTADA!`);
      console.log(`   Invasor: ${invader} (${covenant})`);
      console.log(`   Alvo: ${target}`);
      console.log(`   Zona: ${zone}`);
      
      // Registrar invasão ativa
      const invasionData = {
        id,
        invader,
        target,
        zone,
        covenant,
        startTime: new Date(),
        status: 'ACTIVE',
        duration: this.calculateInvasionDuration(zone)
      };
      
      this.activeInvasions.set(id, invasionData);
      
      // Resposta dramática
      const response = this.generateInvasionResponse(invader, target, zone, covenant);
      
      if (msg.properties.replyTo) {
        const responseMessage = {
          response: response,
          invasionId: id,
          status: 'INVASION_CONFIRMED',
          estimatedDuration: invasionData.duration,
          timestamp: new Date().toISOString()
        };
        
        channel.sendToQueue(
          msg.properties.replyTo, 
          Buffer.from(JSON.stringify(responseMessage)), {
            correlationId: msg.properties.correlationId
          }
        );
      }
      
      console.log(`[>] ${response}`);
      console.log(`[i] Invasões ativas: ${this.activeInvasions.size}`);
      
      channel.ack(msg);
      
    } catch (error) {
      console.error('[-] Erro ao processar invasão:', error);
      channel.nack(msg, false, true);
    }
  }

  async triggerAutoInvasion(target, zone) {
    const invaders = [
      'Dark Spirit Maldron',
      'Darkwraith Knight',
      'Forest Invader',
      'Gravelord Servant',
      'Red Phantom',
      'Blade of the Darkmoon'
    ];
    
    const randomInvader = invaders[Math.floor(Math.random() * invaders.length)];
    
    const autoInvasion = {
      id: `auto_${Date.now()}`,
      invader: randomInvader,
      target: target,
      zone: zone,
      covenant: 'Auto-Generated',
      timestamp: new Date().toISOString(),
      type: 'AUTO_INVASION'
    };
    
    await this.rabbitmq.sendToQueue('ashen_invasions', autoInvasion);
    console.log(`[#] Invasão automática acionada: ${randomInvader} -> ${target}`);
  }

  generateThreat(target, zone, originalMessage) {
    const threats = [
      `[!] "Suas palavras atraíram a atenção dos espíritos sombrios, ${target}..."`,
      `[X] "A escuridão ouviu seu chamado. Prepare-se para a invasão!"`,
      `[-] "Você fala muito para alguém que logo será silenciado..."`,
      `[!] "Os Darkwraiths marcaram você, ${target}. Sua localização foi revelada."`,
      `[>] "Palavras corajosas... veremos se sua espada é tão afiada quanto sua língua."`,
      `[+] "A morte caminha entre as sombras de ${zone}. Cuidado..."`,
      `[#] "Você despertou algo que deveria permanecer adormecido..."`
    ];
    
    return threats[Math.floor(Math.random() * threats.length)];
  }

  generateInvasionResponse(invader, target, zone, covenant) {
    const responses = [
      `[*] "${invader} emergiu das trevas de ${zone}!"`,
      `[!] "INVASÃO! ${invader} (${covenant}) caça ${target}!"`,
      `[+] "Um espírito sombrio surgiu... ${invader} busca sangue!"`,
      `[-] "${covenant} ${invader} invadiu o mundo de ${target}!"`,
      `[X] "A escuridão toma forma... ${invader} chegou para duelar!"`,
      `[#] "ALERTA: ${invader} marcou ${target} para eliminação!"`,
      `[>] "${zone} ecoa com os passos de ${invader}... que a caçada comece!"`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  calculateThreatLevel(message, zone) {
    let threat = 1;
    
    // Palavras agressivas aumentam ameaça
    const aggressiveWords = ['kill', 'destroy', 'noob', 'easy', 'ganker'];
    aggressiveWords.forEach(word => {
      if (message.toLowerCase().includes(word)) threat++;
    });
    
    // Zonas perigosas aumentam ameaça
    const dangerousZones = ['Catacombs', 'New Londo', 'Darkroot'];
    if (dangerousZones.some(dz => zone.includes(dz))) threat += 2;
    
    return Math.min(threat, 5); // Máximo 5
  }

  calculateInvasionDuration(zone) {
    const baseDuration = 60000; // 1 minuto
    const zoneMultipliers = {
      'Anor Londo': 2.0,
      'Sen\'s Fortress': 1.5,
      'Catacombs': 1.8,
      'New Londo Ruins': 1.7,
      'Darkroot Garden': 1.6,
      'Firelink Shrine': 0.5
    };
    
    const multiplier = zoneMultipliers[zone] || 1.0;
    return Math.floor(baseDuration * multiplier * (0.5 + Math.random()));
  }

  startInvasionSimulation() {
    // Verificar invasões ativas a cada 10 segundos
    setInterval(() => {
      this.resolveInvasions();
    }, 10000);
  }

  resolveInvasions() {
    const now = new Date();
    const toResolve = [];
    
    this.activeInvasions.forEach((invasion, id) => {
      const elapsed = now - invasion.startTime;
      if (elapsed >= invasion.duration) {
        toResolve.push(id);
      }
    });
    
    toResolve.forEach(id => {
      const invasion = this.activeInvasions.get(id);
      this.resolveInvasion(invasion);
      this.activeInvasions.delete(id);
    });
  }

  resolveInvasion(invasion) {
    const outcomes = [
      { result: 'INVADER_VICTORY', message: `[+] ${invasion.target} foi derrotado por ${invasion.invader}!` },
      { result: 'TARGET_VICTORY', message: `[X] ${invasion.target} repeliu ${invasion.invader}!` },
      { result: 'INVADER_RETREATED', message: `🏃 ${invasion.invader} recuou da batalha.` },
      { result: 'CONNECTION_LOST', message: `📡 Conexão perdida durante a invasão.` },
      { result: 'DRAW', message: `🤝 Empate honroso entre ${invasion.invader} e ${invasion.target}.` }
    ];
    
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    console.log(`🏁 INVASÃO RESOLVIDA: ${outcome.message}`);
    
    // Adicionar ao histórico
    this.invasionHistory.push({
      ...invasion,
      outcome: outcome.result,
      endTime: new Date(),
      actualDuration: new Date() - invasion.startTime
    });
    
    // Manter apenas últimas 50 invasões no histórico
    if (this.invasionHistory.length > 50) {
      this.invasionHistory.shift();
    }
  }

  getStats() {
    return {
      totalInvasions: this.totalInvasions,
      activeInvasions: this.activeInvasions.size,
      completedInvasions: this.invasionHistory.length,
      uptime: process.uptime(),
      successRate: this.invasionHistory.length > 0 ? 
        (this.invasionHistory.filter(i => i.outcome === 'INVADER_VICTORY').length / this.invasionHistory.length * 100).toFixed(1) + '%' : '0%'
    };
  }

  async stop() {
    console.log('🌑 Parando Invader Consumer...');
    await this.rabbitmq.close();
    console.log('[!] Os invasores retornaram às sombras...');
  }
}

// Inicializar consumer
const invaderConsumer = new InvaderConsumer();

// Graceful shutdown
process.on('SIGINT', async () => {
  await invaderConsumer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await invaderConsumer.stop();
  process.exit(0);
});

// Status periódico
setInterval(() => {
  const stats = invaderConsumer.getStats();
  console.log(`[i] Invader Stats: ${stats.totalInvasions} invasões total, ${stats.activeInvasions} ativas, ${stats.successRate} sucesso`);
}, 60000); // A cada minuto

invaderConsumer.start().catch(console.error);
