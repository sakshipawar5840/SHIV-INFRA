import { ProjectAI } from "../backend/services/ai/ProjectAI.ts";

async function main() {
  const ai = new ProjectAI();
  
  const params = {
    project_name: "Green Valley",
    location: "Hadapsar Pune",
    project_type: "Residential",
    flat_type: "2BHK and 3BHK",
    area_sqft: 1200,
    price: 8500000,
  };
  
  const user = {
    company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
    role: "Admin",
    id: "5982519a-2ba8-43a7-82a4-cf6185f3d8a4",
  };
  
  try {
    const result = await (ai as any).addProject(params, user);
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.log("Error:", e.message);
    console.log("Stack:", e.stack);
  }
}

main();
