import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.log("NO_API_KEY");
  process.exit(0);
}

async function test() {
  const client = new GoogleGenAI({ apiKey });
  const result = await client.models.list();
  
  const models = result.pageInternal || [];
  console.log("Total models:", models.length);
  
  for (const model of models.slice(0, 20)) {
    const name = model.name || "";
    const actions = model.supportedActions || [];
    if (actions.includes("generateContent")) {
      console.log("TRYING:", name);
      try {
        const r = await client.models.generateContent({
          model: name.replace("models/", ""),
          contents: "Say hello"
        });
        console.log("  SUCCESS:", r.text?.substring(0, 50));
        process.exit(0);
      } catch (error) {
        console.log("  FAIL:", error?.message?.substring(0, 80));
      }
    }
  }
  
  console.log("No working model found");
}

test();
