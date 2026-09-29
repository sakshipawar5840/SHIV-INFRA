const fs = require("fs");
const filePath = "backend/services/ai/ProjectAI.ts";
let content = fs.readFileSync(filePath, "utf8");

content = content.replace(
  "catch(error:any){",
  `catch(error:any){

    console.error("[PROJECT AI ERROR]", error);`
);

fs.writeFileSync(filePath, content);
console.log("Added error logging");
