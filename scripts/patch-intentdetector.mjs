import { readFileSync, writeFileSync } from "fs";

const filePath = "backend/ai-engine/intentDetector.ts";
let content = readFileSync(filePath, "utf8");

// Fix 1: location regex - add comma to char class
content = content.replace(
  '/(?:at|in|madhe|madhye|me|par)\\s+([A-Za-z0-9\\s]+?)(?:\\s+project|\\s+type|\\s+bhk|\\s+sqft|\\s+price|\\s+crore|\\s+lakh|\\s+\\d|$)/i',
  '/(?:at|in|madhe|madhye|me|par)\\s+([A-Za-z0-9\\s,]+?)(?:\\s+project|\\s+type|\\s+bhk|\\s+sqft|\\s+price|\\s+crore|\\s+lakh|\\s+\\d|$)/i'
);

// Fix 2: Replace typeMatch with flatMatches
content = content.replace(
  'const typeMatch =\n        message.match(\n            /(\\d+)\\s*(bhk|flat|villa|penthouse)/i\n        );',
  'const flatMatches =\n        message.match(\n            /(\\d+\\s*(?:bhk|flat|villa|penthouse))/gi\n        );'
);

// Fix 3: Replace project_type from typeMatch with flat_types from flatMatches
content = content.replace(
  'project_type:\n            typeMatch\n                ? typeMatch[0].trim()\n                : null,',
  'project_type:\n            null,\n\n        flat_types:\n            flatMatches\n                ? flatMatches\n                    .map((f) => f.trim())\n                    .join(", ")\n                : null,'
);

// Fix 4: Fix lead budget regex to strip BHK numbers first
content = content.replace(
  'const allNumbers =\n            message.match(\n                /(\\d+(?:\\.\\d+)?)\\s*(lakh|lac|cr|crore|\\/)?/gi\n            );',
  'const cleanedForBudget =\n            message\n                .replace(/\\d+\\s*(?:bhk|flat|villa|penthouse)/gi, "")\n                .trim();\n\n        const allNumbers =\n            cleanedForBudget.match(\n                /(\\d+(?:\\.\\d+)?)\\s*(lakh|lac|cr|crore|\\/)?/gi\n            );'
);

writeFileSync(filePath, content);
console.log("Patched intentDetector.ts");
