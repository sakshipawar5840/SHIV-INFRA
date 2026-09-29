const fs = require('fs');
const path = 'C:\\Users\\SP\\Downloads\\shiv-infra\\backend\\ai-engine\\toolManager.ts';

let content = fs.readFileSync(path, 'utf8');

// Fix projectService.searchProjects response
content = content.replace(
    /const projects =\s*\n\s*await projectService\.searchProjects\(\s*\n\s*companyId,\s*\n\s*message\s*\n\s*\);\s*\n\s*\n\s*if \(\s*\n\s*projects &&\s*\n\s*projects\.length > 0\s*\n\s*\) {/g,
    `const projectsResponse = await projectService.searchProjects(
                    companyId,
                    message
                );



            const projects = projectsResponse.data || [];` +
    `



            if (
                projects &&
                projects.length > 0
            ) {`
);

// Fix customerService.aiSearchCustomers response
content = content.replace(
    /const customers =\s*\n\s*await customerService\.aiSearchCustomers\(\s*\n\s*companyId,\s*\n\s*\{ query: message \}\s*\n\s*\);\s*\n\s*\n\s*if \(\s*\n\s*customers &&\s*\n\s*customers\.length > 0\s*\n\s*\) {/g,
    `const customersResponse = await customerService.aiSearchCustomers(
                    companyId,
                    { query: message }
                );



            const customers = customersResponse.data || [];` +
    `



            if (
                customers &&
                customers.length > 0
            ) {`
);

// Fix leadService.getLeads response
content = content.replace(
    /const leads =\s*\n\s*await leadService\.getLeads\(\s*\n\s*companyId\s*\n\s*\);\s*\n\s*\n\s*if \(\s*\n\s*leads &&\s*\n\s*leads\.length > 0\s*\n\s*\) {/g,
    `const leadsResponse = await leadService.getLeads(
                    companyId
                );



            const leads = leadsResponse.data || [];` +
    `



            if (
                leads &&
                leads.length > 0
            ) {`
);

// Fix expenseService.getExpenses response
content = content.replace(
    /const expenses =\s*\n\s*await expenseService\.getExpenses\(\s*\n\s*companyId\s*\n\s*\);\s*\n\s*\n\s*if \(\s*\n\s*expenses &&\s*\n\s*expenses\.length > 0\s*\n\s*\) {/g,
    `const expensesResponse = await expenseService.getExpenses(
                    companyId
                );



            const expenses = expensesResponse.data || [];` +
    `



            if (
                expenses &&
                expenses.length > 0
            ) {`
);

// Fix billService.searchBills response
content = content.replace(
    /const bills =\s*\n\s*await billService\.searchBills\(\s*\n\s*companyId,\s*\n\s*message\s*\n\s*\);\s*\n\s*\n\s*if \(\s*\n\s*bills &&\s*\n\s*bills\.length > 0\s*\n\s*\) {/g,
    `const billsResponse = await billService.searchBills(
                    companyId,
                    message
                );



            const bills = billsResponse.data || [];` +
    `



            if (
                bills &&
                bills.length > 0
            ) {`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed ServiceResponse type errors successfully');
