const fs = require('fs');
const path = require('path');

// Mapeamento de emojis para caracteres ASCII
const emojiMap = {
  '🔥': '[*]',
  '🧙': '[FIRE]',
  '🛡️': '[SMTH]',
  '📚': '[SAGE]',
  '🐍': '[SERP]',
  '⚰️': '[THIF]',
  '👤': '[USER]',
  '📍': '[LOC]',
  '🌟': '[STAR]',
  '⚔️': '[X]',
  '🏰': '[CAST]',
  '🗡️': '[-]',
  '💀': '[+]',
  '🕳️': '[#]',
  '🌪️': '[~]',
  '💬': '[>]',
  '⚡': '[!]',
  '🎭': '[MASK]',
  '🎮': '[GAME]',
  '🗺️': '[?]',
  '📊': '[i]',
  '❌': '[-]',
  '👁️': '[!]',
  '💡': '[i]',
  '🎯': '[#]',
  '👹': '[!]'
};

function removeEmojisFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Substituir emojis
    for (const [emoji, replacement] of Object.entries(emojiMap)) {
      const regex = new RegExp(emoji, 'g');
      content = content.replace(regex, replacement);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[*] Emojis removidos de: ${filePath}`);
  } catch (error) {
    console.error(`[!] Erro ao processar ${filePath}:`, error.message);
  }
}

// Processar arquivos
const filesToProcess = [
  'producers/player-publisher.js',
  'consumers/npc-consumer.js',
  'consumers/invader-consumer.js',
  'api-gateway/server.js'
];

filesToProcess.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    removeEmojisFromFile(fullPath);
  } else {
    console.log(`[!] Arquivo não encontrado: ${fullPath}`);
  }
});

console.log('[*] Processamento concluído!');
