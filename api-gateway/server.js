const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const RabbitMQConnection = require('../shared/rabbitmq');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Para servir arquivos estáticos

// Conexão RabbitMQ
const rabbitmq = new RabbitMQConnection();
let isReady = false;

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[X] [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Inicializar RabbitMQ
async function initializeRabbitMQ() {
  try {
    await rabbitmq.connect();
    isReady = true;
    console.log('✅ Sistema pronto para receber mensagens');
  } catch (error) {
    console.error('[-] Falha ao inicializar RabbitMQ:', error);
    process.exit(1);
  }
}

// Middleware para verificar se RabbitMQ está pronto
const checkRabbitMQ = (req, res, next) => {
  if (!isReady) {
    return res.status(503).json({ 
      error: 'RabbitMQ não está disponível',
      message: 'The bonfire has not been lit yet...' 
    });
  }
  next();
};

// Rotas da API

// Status do sistema
app.get('/api/status', (req, res) => {
  const status = rabbitmq.getStatus();
  res.json({
    status: isReady ? 'ready' : 'not_ready',
    message: isReady ? '[*] The flame burns bright' : '🌑 The fire fades...',
    rabbitmq: status,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Enviar mensagem básica
app.post('/api/send-message', checkRabbitMQ, async (req, res) => {
  try {
    const { sender, message, zone } = req.body;
    
    if (!sender || !message) {
      return res.status(400).json({ 
        error: 'Sender e message são obrigatórios',
        message: 'A messenger must have a name and words to carry...'
      });
    }

    const messageData = {
      id: uuidv4(),
      sender,
      message,
      zone: zone || 'Unknown Realm',
      timestamp: new Date().toISOString(),
      type: 'MESSAGE'
    };

    await rabbitmq.sendToQueue('ashen_messages', messageData);
    
    console.log(`📨 Mensagem enviada: ${sender} em ${zone}`);
    
    res.status(200).json({ 
      status: 'sent',
      messageId: messageData.id,
      message: 'Message carried by the winds of Lordran',
      _links: { 
        self: '/api/send-message',
        status: '/api/status'
      }
    });
  } catch (error) {
    console.error('[-] Erro ao enviar mensagem:', error);
    res.status(500).json({ 
      error: 'Falha ao enviar mensagem',
      message: 'The messenger was consumed by darkness...'
    });
  }
});

// Iniciar invasão
app.post('/api/invade', checkRabbitMQ, async (req, res) => {
  try {
    const { invader, target, zone, covenant } = req.body;
    
    if (!invader || !target) {
      return res.status(400).json({ 
        error: 'Invader e target são obrigatórios',
        message: 'An invasion requires both hunter and prey...'
      });
    }

    const invasionData = {
      id: uuidv4(),
      invader,
      target,
      zone: zone || 'Unknown Realm',
      covenant: covenant || 'Darkwraith',
      timestamp: new Date().toISOString(),
      type: 'INVASION',
      status: 'STARTED'
    };

    await rabbitmq.sendToQueue('ashen_invasions', invasionData);
    
    console.log(`[X] Invasão iniciada: ${invader} -> ${target} em ${zone}`);
    
    res.status(200).json({ 
      status: 'invasion_started',
      invasionId: invasionData.id,
      message: `${invader} has invaded ${target}'s world!`,
      _links: { 
        self: '/api/invade',
        status: '/api/status'
      }
    });
  } catch (error) {
    console.error('[-] Erro ao iniciar invasão:', error);
    res.status(500).json({ 
      error: 'Falha ao iniciar invasão',
      message: 'The invasion was thwarted by the abyss...'
    });
  }
});

// Acender fogueira (evento especial)
app.post('/api/light-bonfire', checkRabbitMQ, async (req, res) => {
  try {
    const { player, bonfire, zone } = req.body;
    
    if (!player || !bonfire) {
      return res.status(400).json({ 
        error: 'Player e bonfire são obrigatórios',
        message: 'One must identify themselves to light the flame...'
      });
    }

    const eventData = {
      id: uuidv4(),
      player,
      bonfire,
      zone: zone || 'Firelink Shrine',
      timestamp: new Date().toISOString(),
      type: 'BONFIRE_LIT',
      souls_restored: true
    };

    await rabbitmq.sendToQueue('ashen_events', eventData);
    
    console.log(`[*] Fogueira acesa: ${bonfire} por ${player}`);
    
    res.status(200).json({ 
      status: 'bonfire_lit',
      eventId: eventData.id,
      message: `The bonfire ${bonfire} has been lit. Rest well, ${player}.`,
      _links: { 
        self: '/api/light-bonfire',
        status: '/api/status'
      }
    });
  } catch (error) {
    console.error('[-] Erro ao acender fogueira:', error);
    res.status(500).json({ 
      error: 'Falha ao acender fogueira',
      message: 'The flame could not be lit...'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Página inicial (se não houver frontend)
app.get('/', (req, res) => {
  res.json({
    service: 'Bonfire Relay API Gateway',
    message: '[*] Welcome to the Ashen Network',
    version: '1.0.0',
    endpoints: {
      status: '/api/status',
      send_message: '/api/send-message',
      invade: '/api/invade',
      light_bonfire: '/api/light-bonfire',
      health: '/health'
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('[-] Erro não tratado:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: 'The abyss has consumed your request...'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🌑 Shutting down gracefully...');
  await rabbitmq.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🌑 Shutting down gracefully...');
  await rabbitmq.close();
  process.exit(0);
});

// Iniciar servidor
async function startServer() {
  await initializeRabbitMQ();
  
  app.listen(PORT, () => {
    console.log(`[CAST] Bonfire Relay API Gateway rodando na porta ${PORT}`);
    console.log(`🔗 Acesse: http://localhost:${PORT}`);
    console.log(`[i] Status: http://localhost:${PORT}/api/status`);
  });
}

startServer().catch(console.error);
