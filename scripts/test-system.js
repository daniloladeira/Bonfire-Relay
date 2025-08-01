const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_BASE = 'http://localhost:3000/api';

async function testSystem() {
  console.log('🧪 Iniciando testes do Bonfire Relay System...\n');
  
  try {
    // Teste 1: Verificar status
    console.log('1. 🔍 Testando status da API...');
    const statusResponse = await axios.get(`${API_BASE}/status`);
    console.log('✅ Status:', statusResponse.data.message);
    console.log('📊 RabbitMQ:', statusResponse.data.rabbitmq.connected ? 'Conectado' : 'Desconectado');
    console.log('');
    
    await sleep(1000);
    
    // Teste 2: Enviar mensagem
    console.log('2. 💬 Testando envio de mensagem...');
    const messageData = {
      sender: 'Test Knight',
      message: 'Praise the sun! Testing message system.',
      zone: 'Test Arena'
    };
    
    const messageResponse = await axios.post(`${API_BASE}/send-message`, messageData);
    console.log('✅ Mensagem enviada:', messageResponse.data.message);
    console.log('🆔 ID:', messageResponse.data.messageId);
    console.log('');
    
    await sleep(1000);
    
    // Teste 3: Iniciar invasão
    console.log('3. ⚔️ Testando sistema de invasão...');
    const invasionData = {
      invader: 'Dark Spirit Tester',
      target: 'Test Knight',
      zone: 'Test Arena',
      covenant: 'Darkwraith'
    };
    
    const invasionResponse = await axios.post(`${API_BASE}/invade`, invasionData);
    console.log('✅ Invasão iniciada:', invasionResponse.data.message);
    console.log('🆔 ID:', invasionResponse.data.invasionId);
    console.log('');
    
    await sleep(1000);
    
    // Teste 4: Acender fogueira
    console.log('4. 🔥 Testando sistema de fogueiras...');
    const bonfireData = {
      player: 'Test Knight',
      bonfire: 'Test Bonfire',
      zone: 'Test Arena'
    };
    
    const bonfireResponse = await axios.post(`${API_BASE}/light-bonfire`, bonfireData);
    console.log('✅ Fogueira acesa:', bonfireResponse.data.message);
    console.log('🆔 ID:', bonfireResponse.data.eventId);
    console.log('');
    
    // Teste 5: Múltiplas mensagens
    console.log('5. 🌪️ Testando múltiplas mensagens...');
    const testMessages = [
      { sender: 'Knight A', message: 'Anyone want to duel?', zone: 'Undead Burg' },
      { sender: 'Knight B', message: 'Invade me if you dare!', zone: 'Catacombs' },
      { sender: 'Knight C', message: 'Trading souls for items', zone: 'Firelink Shrine' },
      { sender: 'Knight D', message: 'Help with boss fight', zone: 'Anor Londo' },
      { sender: 'Knight E', message: 'Praise the sun!', zone: 'Darkroot Garden' }
    ];
    
    for (let i = 0; i < testMessages.length; i++) {
      const response = await axios.post(`${API_BASE}/send-message`, testMessages[i]);
      console.log(`✅ Mensagem ${i + 1}: ${testMessages[i].sender} em ${testMessages[i].zone}`);
      await sleep(300);
    }
    
    console.log('\n🎉 Todos os testes concluídos com sucesso!');
    console.log('🔥 O sistema de mensageria está funcionando corretamente');
    console.log('\n📊 Verifique os logs dos consumidores para ver o processamento');
    console.log('🎮 Execute o player-publisher para testar interativamente');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.response) {
      console.error('📄 Resposta do servidor:', error.response.status);
      console.error('📋 Dados:', error.response.data);
    }
    console.log('\n💡 Certifique-se de que:');
    console.log('   1. RabbitMQ está rodando');
    console.log('   2. API Gateway está ativo (npm run start:api)');
    console.log('   3. Consumidores estão rodando');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

if (require.main === module) {
  testSystem().catch(console.error);
}

module.exports = testSystem;
