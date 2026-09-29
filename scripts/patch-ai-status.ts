import { readFileSync, writeFileSync } from "fs";
const path = "src/pages/AIAssistant.tsx";
let content = readFileSync(path, "utf8");

// Replace hardcoded "AI Online" with dynamic state
const aiOnlineRegex = new RegExp(String.raw`AI\s+Online`);
content = content.replace(aiOnlineRegex, '{aiStatus.status === "available" ? "AI Online" : aiStatus.status === "degraded" ? "AI Degraded" : aiStatus.status === "fallback" ? "AI Fallback" : "AI Checking"}');

// Replace hardcoded "Gemini Engine" with dynamic provider
const geminiRegex = new RegExp(String.raw`Gemini\s+Engine`);
content = content.replace(geminiRegex, '{aiStatus.provider === "gemini" ? "Gemini Engine" : aiStatus.provider === "openai" ? "OpenAI Engine" : aiStatus.provider === "rule-based" ? "Rule Engine" : "AI Engine"}');

writeFileSync(path, content);
console.log("DONE");
