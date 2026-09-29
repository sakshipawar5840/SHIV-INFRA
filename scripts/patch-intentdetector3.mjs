import { readFileSync, writeFileSync } from "fs";

const filePath = "backend/ai-engine/intentDetector.ts";
let content = readFileSync(filePath, "utf8");

// Fix 2: Replace typeMatch with flatMatches (use CRLF)
const oldTypeMatch = "    const typeMatch =\r\n        message.match(\r\n            /(\\d+)\\s*(bhk|flat|villa|penthouse)/i\r\n        );";

const newFlatMatches = "    const flatMatches =\r\n        message.match(\r\n            /(\\d+\\s*(?:bhk|flat|villa|penthouse))/gi\r\n        );";

if (content.includes(oldTypeMatch)) {
  content = content.replace(oldTypeMatch, newFlatMatches);
  console.log("Replaced typeMatch with flatMatches");
} else {
  console.log("WARNING: typeMatch pattern not found");
}

// Fix 3: Replace project_type assignment
const oldProjectType = "        project_type:\r\n            typeMatch\r\n                ? typeMatch[0].trim()\r\n                : null,";

const newProjectType = "        project_type:\r\n            null,\r\n\r\n        flat_types:\r\n            flatMatches\r\n                ? flatMatches\r\n                    .map((f) => f.trim())\r\n                    .join(\", \")\r\n                : null,";

if (content.includes(oldProjectType)) {
  content = content.replace(oldProjectType, newProjectType);
  console.log("Replaced project_type with flat_types");
} else {
  console.log("WARNING: project_type pattern not found");
}

// Fix 4: Fix lead budget regex
const oldBudget = "        const allNumbers =\r\n            message.match(\r\n                /(\\d+(?:\\.\\d+)?)\\s*(lakh|lac|cr|crore|\\/)?/gi\r\n            );";

const newBudget = "        const cleanedForBudget =\r\n            message\r\n                .replace(/\\d+\\s*(?:bhk|flat|villa|penthouse)/gi, \"\")\r\n                .trim();\r\n\r\n        const allNumbers =\r\n            cleanedForBudget.match(\r\n                /(\\d+(?:\\.\\d+)?)\\s*(lakh|lac|cr|crore|\\/)?/gi\r\n            );";

if (content.includes(oldBudget)) {
  content = content.replace(oldBudget, newBudget);
  console.log("Replaced lead budget regex");
} else {
  console.log("WARNING: lead budget pattern not found");
}

writeFileSync(filePath, content);
console.log("Done patching intentDetector.ts");
