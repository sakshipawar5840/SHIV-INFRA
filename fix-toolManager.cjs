const fs = require('fs');
const path = 'C:\\Users\\SP\\Downloads\\shiv-infra\\backend\\ai-engine\\toolManager.ts';

let content = fs.readFileSync(path, 'utf8');

const correctCode = `
// =============================================
// BUSINESS QUESTION DETECTOR
// =============================================


function isBusinessQuestion(message: string): boolean {


    const lower = message.toLowerCase();



    const businessPatterns = [

        /how many/i,

        /how much/i,

        /total/i,

        /count/i,

        /list/i,

        /show/i,

        /find/i,

        /search/i,

        /get/i,

        /which/i,

        /what.*project/i,

        /what.*customer/i,

        /what.*lead/i,

        /what.*expense/i,

        /what.*bill/i,

        /project.*pune/i,

        /project.*mumbai/i,

        /customer.*pending/i,

        /lead.*status/i,

        /expense.*month/i,

        /bill.*upload/i,

        /report/i

    ];



    return businessPatterns.some((pattern) => pattern.test(lower));

}


// =============================================
// BUSINESS QUESTION HANDLER
// =============================================


async function handleBusinessQuestion(

    message: string,

    companyId: string,

    role: string

): Promise<string> {


    try {



        const lower = message.toLowerCase();



        // -----------------------------------------
        // PROJECT QUESTIONS
        // -----------------------------------------



        if (

            /project/i.test(lower) &&

            (/how many|count|list|show|find|search|get|pune|mumbai|baner|wakad/i.test(lower) || /what.*project/i.test(lower))

        ) {


            const projects =

                await projectService.searchProjects(

                    companyId,

                    message

                );



            if (

                projects &&
                projects.length > 0
            ) {


                if (/how many|count/i.test(lower)) {


                    return \`There are \${projects.length} projects in the system.\`;


                }



                const lines = projects.slice(0, 5).map((p: any, i: number) => {


                    return \`\${i + 1}. \${p.project_name || p.name || 'Untitled'} - \${p.location || 'N/A'} - ₹\${p.price || 'N/A'}\`;


                });



                return \`Found \${projects.length} projects:\\n\\n\${lines.join('\\n')}\`;


            }



            return "No projects found matching your query.";



        }



        // -----------------------------------------
        // CUSTOMER QUESTIONS
        // -----------------------------------------



        if (

            /customer/i.test(lower) &&

            (/how many|count|list|show|find|search|get|pending|enquir/i.test(lower))

        ) {


            const customers =

                await customerService.aiSearchCustomers(

                    companyId,

                    { query: message }

                );



            if (

                customers &&
                customers.length > 0
            ) {


                if (/how many|count/i.test(lower)) {


                    return \`There are \${customers.length} customers in the system.\`;


                }



                const lines = customers.slice(0, 5).map((c: any, i: number) => {


                    return \`\${i + 1}. \${c.full_name || c.name || 'Unknown'} - \${c.phone || 'N/A'} - \${c.status || 'N/A'}\`;


                });



                return \`Found \${customers.length} customers:\\n\\n\${lines.join('\\n')}\`;


            }



            return "No customers found matching your query.";



        }



        // -----------------------------------------
        // LEAD QUESTIONS
        // -----------------------------------------



        if (

            /lead/i.test(lower) &&

            (/how many|count|list|show|find|search|get|status/i.test(lower))

        ) {


            const leads =

                await leadService.getLeads(

                    companyId

                );



            if (

                leads &&
                leads.length > 0
            ) {


                if (/how many|count/i.test(lower)) {


                    return \`There are \${leads.length} leads in the system.\`;


                }



                const lines = leads.slice(0, 5).map((l: any, i: number) => {


                    return \`\${i + 1}. \${l.full_name || l.customer_name || 'Unknown'} - \${l.status || 'N/A'} - \${l.requirement || 'N/A'}\`;


                });



                return \`Found \${leads.length} leads:\\n\\n\${lines.join('\\n')}\`;


            }



            return "No leads found matching your query.";



        }



        // -----------------------------------------
        // EXPENSE QUESTIONS
        // -----------------------------------------



        if (

            /expense/i.test(lower) &&

            (/how many|count|list|show|find|search|get|total|how much/i.test(lower))

        ) {


            const expenses =

                await expenseService.getExpenses(

                    companyId

                );



            if (

                expenses &&
                expenses.length > 0
            ) {


                if (/how many|count/i.test(lower)) {


                    return \`There are \${expenses.length} expenses recorded.\`;


                }



                const total = expenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);



                const lines = expenses.slice(0, 5).map((e: any, i: number) => {


                    return \`\${i + 1}. \${e.expense_title || e.title || 'Expense'} - ₹\${e.amount || 0} - \${e.expense_date || e.expense_date || 'N/A'}\`;


                });



                return \`Found \${expenses.length} expenses. Total: ₹\${total.toLocaleString()}.\\n\\nRecent:\\n\${lines.join('\\n')}\`;


            }



            return "No expenses found matching your query.";



        }



        // -----------------------------------------
        // BILL QUESTIONS
        // -----------------------------------------



        if (

            /bill/i.test(lower) &&

            (/how many|count|list|show|find|search|get|upload/i.test(lower))

        ) {


            const bills =

                await billService.searchBills(

                    companyId,

                    message

                );



            if (

                bills &&
                bills.length > 0
            ) {


                if (/how many|count/i.test(lower)) {


                    return \`There are \${bills.length} bills in the system.\`;


                }



                const lines = bills.slice(0, 5).map((b: any, i: number) => {


                    return \`\${i + 1}. \${b.vendor_name || 'Unknown'} - ₹\${b.amount || 0} - \${b.bill_date || 'N/A'}\`;


                });



                return \`Found \${bills.length} bills:\\n\\n\${lines.join('\\n')}\`;


            }



            return "No bills found matching your query.";



        }



        // -----------------------------------------
        // GENERIC FALLBACK
        // -----------------------------------------



        const projects =

            await projectService.searchProjects(

                companyId,

                message

            );



        if (

            projects &&
            projects.length > 0
        ) {


            const lines = projects.slice(0, 5).map((p: any, i: number) => {


                return \`\${i + 1}. \${p.project_name || p.name || 'Untitled'} - \${p.location || 'N/A'}\`;


            });



            return \`Found \${projects.length} projects:\\n\\n\${lines.join('\\n')}\`;


        }



        return "";




    }


    catch (error: any) {


        console.error("[BUSINESS QUESTION ERROR]", error.message);



        return "";



    }


}
`;

// Find the corrupted section and replace it
const startMarker = '// =============================================\n// BUSINESS QUESTION DETECTOR';
const endMarker = '// MAIN TOOL EXECUTOR';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    content = before + correctCode + '\n\n' + after;
    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed corrupted section successfully');
} else {
    console.error('Could not find markers', startIndex, endIndex);
    process.exit(1);
}
