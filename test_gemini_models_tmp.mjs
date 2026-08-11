import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.log("NO_API_KEY");
  process.exit(0);
}

async function test() {
  const models = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"];
  
  for (const model of models) {
    try {
      const client = new GoogleGenAI({ apiKey });
      const result = await client.models.generateContent({
        model: model,
        contents: "Say hello in one word"
      });
      console.log("SUCCESS [" + model + "]:", result.text?.substring(0, 100));
      break;
    } catch (error) {
      console.log("FAIL [" + model + "]:", error?.message || JSON.stringify(error)?.substring(0, 150));
    }
  }
}

test();
