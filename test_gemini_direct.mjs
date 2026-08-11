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
    const result = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Say hello"
    });
    console.log("SUCCESS:", result.text?.substring(0, 100));
  } catch (error) {
    console.log("ERROR:", error?.message || error?.status || JSON.stringify(error));
  }
}

test();
