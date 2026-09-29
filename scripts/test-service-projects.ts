import { ProjectService } from "../backend/services/projectService.ts";

async function main() {
  const companyId = '3e9e9ae1-8593-473f-9aa3-9bcee469d795';
  
  const service = new ProjectService();
  
  // Test searchProjects
  const result = await service.searchProjects(companyId, "", {});
  
  console.log("Search result:", result);
  console.log("Count:", result.count);
  console.log("Data sample:", result.data?.slice(0, 2));
  
  if (result.data && result.data.length > 0) {
    const firstProject = result.data[0];
    console.log("First project keys:", Object.keys(firstProject));
    console.log("First project flat_type:", firstProject.flat_type);
    console.log("First project flat_types:", firstProject.flat_types);
    console.log("First project sqft:", firstProject.sqft);
    console.log("First project area_sqft:", firstProject.area_sqft);
    console.log("First project brochure_pdf_url:", firstProject.brochure_pdf_url);
    console.log("First project brochure_url:", firstProject.brochure_url);
    console.log("First project project_name:", firstProject.project_name);
    console.log("First project name:", firstProject.name);
    console.log("First project status:", firstProject.status);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });