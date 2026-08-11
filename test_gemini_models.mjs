import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.log("NO_API_KEY");
  process.exit(0);
}

async function test() {
  try {
    const client = new GoogleGenAI({ apiKey });
    const result = await client.models.list();
    console.log("RESULT TYPE:", typeof result);
    console.log("RESULT KEYS:", Object.keys(result || {}));
    console.log("RESULT:", JSON.stringify(result).substring(0, 2000));
  } catch (error) {
    console.log("ERROR:", error?.message || JSON.stringify(error));
  }
}

test();
