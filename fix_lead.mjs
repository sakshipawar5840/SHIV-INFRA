import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/leadService.ts';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = `    const insertData = {



        company_id:
        lead.company_id,



        customer_id:
        lead.customer_id || null,



        project_id:
        lead.project_id || null,



        lead_source:
        lead.lead_source || "AI",



        requirement:
        lead.requirement || null,



        budget:
        lead.budget
        ?
        Number(lead.budget)
        :
        null,



        preferred_location:
        lead.preferred_location || null,



        status:
        this.validateStatus(

            lead.status || "New"

        ),



        assigned_to:

        lead.assigned_to || null,



        remarks:
        lead.remarks || null,



        created_at:
        now,



        updated_at:
        now



    };`;

const newBlock = `    const insertData: any = {



        company_id:
        lead.company_id,



        customer_id:
        lead.customer_id || null,



        project_id:
        lead.project_id || null,



        lead_source:
        lead.lead_source || "AI",



        requirement:
        lead.requirement || null,



        budget:
        lead.budget
        ?
        Number(lead.budget)
        :
        null,



        preferred_location:
        lead.preferred_location || null,



        status:
        this.validateStatus(

            lead.status || "New"

        ),



        remarks:
        lead.remarks || null,



        created_at:
        now,



        updated_at:
        now



    };


    if (
        lead.assigned_to
    ) {

        insertData.assigned_to =
        lead.assigned_to;

    }`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync(path, content);
    console.log('Fixed lead creation assigned_to');
} else {
    console.log('Could not find old block');
}
