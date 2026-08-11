import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/activityLoggerService.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace('action:\n                data.action,', 'action_type:\n                data.action || "UPDATE",');
content = content.replace(/module:\n                data\.module \|\| "SYSTEM",\n\n                status:\n                data\.status \|\| "SUCCESS",\n\n                metadata:\n                data\.metadata \|\| {}/g, 'details:\n                data.details || data.module || "{}",');
fs.writeFileSync(path, content);
console.log('activityLoggerService.ts updated');
