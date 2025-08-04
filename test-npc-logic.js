// Teste rápido para verificar as melhorias no NPC Consumer

const testMessages = [
  { message: "eai", expected: "casual_greetings" },
  { message: "hello there", expected: "greetings" },
  { message: "obrigado", expected: "compliments" },
  { message: "praise the sun!", expected: "praise_sun" },
  { message: "como vai?", expected: "questions" },
  { message: "preciso de ajuda", expected: "help_requests" },
  { message: "tchau pessoal", expected: "farewells" },
  { message: "que bela paisagem esta zona tem", expected: "general_chat" },
  { message: "hmm", expected: "confusion" }
];

// Simular a função analyzeMessage
function analyzeMessage(text) {
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

console.log('=== TESTE DA ANÁLISE DE MENSAGENS ===\n');

testMessages.forEach(test => {
  const result = analyzeMessage(test.message);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} "${test.message}" -> ${result} (esperado: ${test.expected})`);
});

console.log('\n=== RESUMO ===');
console.log('Agora as respostas dos NPCs serão mais apropriadas:');
console.log('- "eai" -> resposta casual como "E aí, como vai a jornada?"');
console.log('- "hello" -> resposta formal como "Bem-vindo, Chosen Undead"');
console.log('- "obrigado" -> resposta de elogio como "Your kindness warms the flame"');
console.log('- "como vai?" -> resposta de pergunta como "Interessante pergunta..."');
console.log('- "hmm" -> resposta de confusão como "Não entendi bem..."');
