const RabbitMQConnection = require('../shared/rabbitmq');
require('dotenv').config();

async function setupQueues() {
  const rabbitmq = new RabbitMQConnection();
  
  try {
    console.log('🔧 Configurando filas e exchanges do RabbitMQ...');
    
    await rabbitmq.connect();
    
    // Criar filas adicionais se necessário
    const additionalQueues = [
      'ashen_responses',
      'ashen_notifications',
      'ashen_logs'
    ];
    
    for (const queue of additionalQueues) {
      await rabbitmq.channel.assertQueue(queue, { durable: true });
      console.log(`✅ Fila criada: ${queue}`);
    }
    
    // Configurar bindings para tópicos
    await rabbitmq.bindQueue('ashen_messages', 'messages.*');
    await rabbitmq.bindQueue('ashen_invasions', 'invasions.*');
    await rabbitmq.bindQueue('ashen_events', 'events.*');
    
    console.log('🎉 Configuração concluída com sucesso!');
    console.log('🔥 O Ashen Network está pronto para uso');
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error);
  } finally {
    await rabbitmq.close();
  }
}

if (require.main === module) {
  setupQueues().catch(console.error);
}

module.exports = setupQueues;
