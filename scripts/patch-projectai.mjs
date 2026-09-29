import { readFileSync, writeFileSync } from "fs";

const filePath = "backend/services/ai/ProjectAI.ts";
let content = readFileSync(filePath, "utf8");

content = content.replace(
  "catch(error:any){",
  `catch(error:any){

    console.error("[PROJECT AI ERROR]", error);`
);

writeFileSync(filePath, content);
console.log("Added error logging");
