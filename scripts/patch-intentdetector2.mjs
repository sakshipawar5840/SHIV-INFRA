import { readFileSync, writeFileSync } from "fs";

const filePath = "backend/ai-engine/intentDetector.ts";
let content = readFileSync(filePath, "utf8");

// Fix 2: Replace typeMatch with flatMatches
const oldTypeMatch = "    const typeMatch =\n        message.match(\n            /(\\d+)\\s*(bhk|flat|villa|penthouse)/i\n        );";

const newFlatMatches = "    const flatMatches =\n        message.match(\n            /(\\d+\\s*(?:bhk|flat|villa|penthouse))/gi\n        );";

if (content.includes(oldTypeMatch)) {
  content = content.replace(oldTypeMatch, newFlatMatches);
  console.log("Replaced typeMatch with flatMatches");
} else {
  console.log("WARNING: typeMatch pattern not found");
}

// Fix 3: Replace project_type assignment
const oldProjectType = "        project_type:\n            typeMatch\n                ? typeMatch[0].trim()\n                : null,";

const newProjectType = "        project_type:\n            null,\n\n        flat_types:\n            flatMatches\n                ? flatMatches\n                    .map((f) => f.trim())\n                    .join(\", \")\n                : null,";

if (content.includes(oldProjectType)) {
  content = content.replace(oldProjectType, newProjectType);
  console.log("Replaced project_type with flat_types");
} else {
  console.log("WARNING: project_type pattern not found");
}

// Fix 4: Fix lead budget regex
const oldBudget = "        const allNumbers =\n            message.match(\n                /(\\d+(?:\\.\\d+)?)\\s*(lakh|lac|cr|crore|\\/)?/gi\n            );";

const newBudget = "        const cleanedForBudget =\n            message\n                .replace(/\\d+\\s*(?:bhk|flat|villa|penthouse)/gi, \"\")\n                .trim();\n\n        const allNumbers =\n            cleanedForBudget.match(\n                /(\\d+(?:\\.\\d+)?)\\s*(lakh|lac|cr|crore|\\/)?/gi\n            );";

if (content.includes(oldBudget)) {
  content = content.replace(oldBudget, newBudget);
  console.log("Replaced lead budget regex");
} else {
  console.log("WARNING: lead budget pattern not found");
}

writeFileSync(filePath, content);
console.log("Done patching intentDetector.ts");
