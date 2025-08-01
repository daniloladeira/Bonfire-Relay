const amqp = require('amqplib');
require('dotenv').config();

class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      console.log('🔄 Conectando ao RabbitMQ...');
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      this.channel = await this.connection.createChannel();
      
      // Criar exchange principal
      await this.channel.assertExchange(process.env.EXCHANGE_NAME || 'ashen_realm', 'topic', {
        durable: true
      });

      // Criar filas principais
      await this.channel.assertQueue(process.env.QUEUE_MESSAGES || 'ashen_messages', { durable: true });
      await this.channel.assertQueue(process.env.QUEUE_INVASIONS || 'ashen_invasions', { durable: true });
      await this.channel.assertQueue(process.env.QUEUE_EVENTS || 'ashen_events', { durable: true });

      this.isConnected = true;
      console.log('🔥 Conectado ao RabbitMQ - The fire burns...');
      
      // Handlers para reconexão
      this.connection.on('error', (err) => {
        console.error('❌ Erro na conexão RabbitMQ:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        console.log('🌑 Conexão RabbitMQ fechada');
        this.isConnected = false;
      });

      return this.channel;
    } catch (error) {
      console.error('❌ Erro ao conectar com RabbitMQ:', error.message);
      throw error;
    }
  }

  async publish(routingKey, message, exchange = null) {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ não está conectado');
    }

    const exchangeName = exchange || process.env.EXCHANGE_NAME || 'ashen_realm';
    const messageBuffer = Buffer.from(JSON.stringify(message));
    
    return this.channel.publish(exchangeName, routingKey, messageBuffer, {
      persistent: true,
      timestamp: Date.now()
    });
  }

  async sendToQueue(queueName, message, options = {}) {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ não está conectado');
    }

    const messageBuffer = Buffer.from(JSON.stringify(message));
    return this.channel.sendToQueue(queueName, messageBuffer, {
      persistent: true,
      ...options
    });
  }

  async consume(queueName, callback, options = {}) {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ não está conectado');
    }

    return this.channel.consume(queueName, (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          callback(content, msg, this.channel);
        } catch (error) {
          console.error('❌ Erro ao processar mensagem:', error);
          this.channel.nack(msg, false, false); // Descarta mensagem malformada
        }
      }
    }, { noAck: false, ...options });
  }

  async bindQueue(queueName, routingKey, exchange = null) {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ não está conectado');
    }

    const exchangeName = exchange || process.env.EXCHANGE_NAME || 'ashen_realm';
    return this.channel.bindQueue(queueName, exchangeName, routingKey);
  }

  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.isConnected = false;
    console.log('🌑 Conexão RabbitMQ fechada - The fire has faded...');
  }

  getStatus() {
    return {
      connected: this.isConnected,
      url: process.env.RABBITMQ_URL || 'amqp://localhost',
      exchange: process.env.EXCHANGE_NAME || 'ashen_realm'
    };
  }
}

module.exports = RabbitMQConnection;
