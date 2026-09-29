const fs = require('fs');
const path = 'backend/routes/whatsappRoutes.ts';
let content = fs.readFileSync(path, 'utf8');

const insert = `
// ============================================
// REAL API: CONVERSATIONS
// ============================================

whatsappRouter.get(
  "/conversations",
  authenticateJWT,
  WhatsAppApiController.listConversations
);

whatsappRouter.get(
  "/conversations/:phone/messages",
  authenticateJWT,
  WhatsAppApiController.getConversationMessages
);

whatsappRouter.get(
  "/activity",
  authenticateJWT,
  WhatsAppApiController.listActivity
);


`;

const healthIdx = content.indexOf('// HEALTH');
if (healthIdx === -1) {
  console.log('HEALTH not found');
  process.exit(1);
}
content = content.slice(0, healthIdx) + insert + content.slice(healthIdx);
fs.writeFileSync(path, content);
console.log('Inserted API routes. New length:', content.length);
