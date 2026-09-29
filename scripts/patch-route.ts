import { readFileSync, writeFileSync } from "fs";

const filePath = "backend/routes/whatsappRoutes.ts";
let content = readFileSync(filePath, "utf8");

content = content.replace(
  'import crypto from "crypto";',
  `import crypto from "crypto";

import fs from "fs";
import path from "path";

const DEBUG_LOG_PATH = path.join(process.cwd(), "whatsapp-debug.log");
function debugLog(message: string) {
    try {
        fs.appendFileSync(DEBUG_LOG_PATH, \`${new Date().toISOString()} \${message}\\n\`);
    } catch (e) {
        // ignore
    }
}`
);

content = content.replace(
  'res.status(200).send("OK");\n\n        whatsappWebhookService',
  `res.status(200).send("OK");\n\n        debugLog("STARTING BACKGROUND PROCESSING");\n\n        whatsappWebhookService`
);

content = content.replace(
  '.catch((error:any)=>{\n\n                console.error(\n                    "WHATSAPP BACKGROUND PROCESSING ERROR",\n                    error\n                );\n\n            });',
  `.then((result)=>{
                debugLog(\`PROCESSING SUCCESS: \${JSON.stringify(result).slice(0, 200)}\`);
            }).catch((error:any)=>{
                debugLog(\`PROCESSING ERROR: \${error?.message || error}\`);
                console.error(
                    "WHATSAPP BACKGROUND PROCESSING ERROR",
                    error
                );

            });`
);

writeFileSync(filePath, content);
console.log("Updated whatsappRoutes.ts with debug logging");
