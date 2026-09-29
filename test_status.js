const message = "Update lead New Lead Person budget to 60 lakh";
const statusMatch = message.match(/status\s+(?:to\s+)?(qualified|hot|follow\s*up|closed|lost|new)/i) || message.match(/(qualified|hot|follow\s*up|closed|lost|new)\s+status/i);
console.log("statusMatch:", statusMatch);

const lowerMessage = message.toLowerCase();
console.log("lowerMessage.includes('new'):", lowerMessage.includes("new"));
console.log("lowerMessage.includes('qualified'):", lowerMessage.includes("qualified"));
