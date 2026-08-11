const fs = require('fs');
const path = 'backend/services/ai/geminiClient.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace('"gemini-2.5-flash"', 'String(process.env.GEMINI_MODEL || "gemini-1.5-flash").trim()');
fs.writeFileSync(path, content);
console.log('Updated geminiClient.ts');
