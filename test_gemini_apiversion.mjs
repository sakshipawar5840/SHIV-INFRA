import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.log("NO_API_KEY");
  process.exit(0);
}

async function test() {
  const models = [
    { name: "gemini-2.5-flash", apiVersion: "v1beta" },
    { name: "gemini-2.5-flash", apiVersion: "v1" },
    { name: "gemini-1.5-flash", apiVersion: "v1" },
    { name: "gemini-1.5-flash", apiVersion: "v1beta" },
  ];
  
  for (const { name, apiVersion } of models) {
    try {
      const client = new GoogleGenAI({ apiKey, apiVersion });
      const result = await client.models.generateContent({
        model: name,
        contents: "Say hello"
      });
      console.log("SUCCESS [" + name + " / " + apiVersion + "]:", result.text?.substring(0, 100));
      process.exit(0);
    } catch (error) {
      console.log("FAIL [" + name + " / " + apiVersion + "]:", error?.message?.substring(0, 120) || JSON.stringify(error).substring(0, 120));
    }
  }
}

test();
