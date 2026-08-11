import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/leadService.ts';
let content = fs.readFileSync(path, 'utf8');

// Remove the assigned_to line from insertData
content = content.replace(
    `        assigned_to:

        lead.assigned_to || null,



        remarks:`,
    `        remarks:`
);

// Add conditional assigned_to after the closing brace
content = content.replace(
    `    };



    const {`,
    `    };


    if (
        lead.assigned_to
    ) {

        insertData.assigned_to =
        lead.assigned_to;

    }



    const {`
);

fs.writeFileSync(path, content);
console.log('Fixed lead creation assigned_to');
