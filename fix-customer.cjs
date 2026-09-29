const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'services', 'customerService.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the insertData block
const oldBlock = `    const insertData:any = {



        company_id:

        customer.company_id,



        name:

        customerName || "Customer",



        phone:

        phone || null,



        email:

        customer.email || null,



        requirement:

        customer.interested_property_type ||
        customer.requirement ||
        null,



        budget:

        customer.budget

        ?

        Number(customer.budget)

        :

        null,



        location_preference:

        customer.interested_location ||
        customer.location_preference ||
        null,



        status:

        customer.status || "Active",
        source:

        customer.source || "AI"



        notes:

        customer.notes || null,



        is_deleted:false,



        created_at:

        now,



        updated_at:

        now



    };`;

const newBlock = `    const insertData:any = {
        company_id: customer.company_id,
        full_name: customerName || "Customer",
        phone: phone || null,
        email: customer.email || null,
        address: customer.address || null,
        city: customer.city || null,
        state: customer.state || null,
        pincode: customer.pincode || null,
        interested_location: customer.interested_location || customer.location_preference || null,
        interested_property_type: customer.interested_property_type || customer.requirement || null,
        budget: customer.budget ? Number(customer.budget) : null,
        source: customer.source || "AI",
        status: customer.status || "active",
        notes: customer.notes || null,
        is_deleted: false,
        deleted_at: null,
        created_at: now,
        updated_at: now
    };`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully replaced insertData block');
} else {
    console.log('Old block not found, trying line-based replacement');
    // Fallback: replace line by line
    const lines = content.split('\n');
    const newLines = [];
    let skipUntilClosingBrace = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('const insertData:any = {')) {
            skipUntilClosingBrace = true;
            braceCount = 0;
            newLines.push(...newBlock.split('\n'));
            continue;
        }
        if (skipUntilClosingBrace) {
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;
            if (braceCount <= 0 && line.trim() === '};') {
                skipUntilClosingBrace = false;
            }
            continue;
        }
        newLines.push(line);
    }
    
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log('Successfully replaced insertData block using line-based approach');
}
