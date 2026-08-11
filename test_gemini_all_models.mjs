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
  
  for (const model of models) {
    const name = model.name || "";
    const actions = model.supportedActions || [];
    if (actions.includes("generateContent") && !name.includes("tts")) {
      console.log("TRYING:", name);
      try {
        const r = await client.models.generateContent({
          model: name.replace("models/", ""),
          contents: "Say hello"
        });
        console.log("  SUCCESS:", r.text?.substring(0, 50));
      } catch (error) {
        const msg = error?.message || "";
        if (msg.includes("not available to new users")) {
          console.log("  FAIL: not available to new users");
        } else if (msg.includes("not found for API version")) {
          console.log("  FAIL: not found for API version");
        } else if (msg.includes("quota")) {
          console.log("  FAIL: quota exceeded");
        } else {
          console.log("  FAIL:", msg.substring(0, 80));
        }
      }
    }
  }
}

test();
