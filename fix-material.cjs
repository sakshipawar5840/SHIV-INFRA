const fs = require('fs');
const path = 'C:\\Users\\SP\\Downloads\\shiv-infra\\backend\\ai-engine\\toolManager.ts';

let content = fs.readFileSync(path, 'utf8');

const materialHandler = `
        // -----------------------------------------
        // MATERIAL SEARCH
        // -----------------------------------------



        if (

            /material|cement|steel|brick|sand|aggregate|supplier|vendor/i.test(lower)
        ) {


            const materialQuery =

                message

                .replace(/find|search|get|show|list|near|in|suppliers?|shops?/gi, "")

                .trim() ||

                message;



            try {


                const materialResult =

                    await GoogleService.searchNearbySuppliers(

                        materialQuery,

                        companyId

                    );



                if (

                    materialResult &&
                    materialResult.results &&
                    materialResult.results.length > 0
                ) {


                    const lines = materialResult.results.slice(0, 5).map((m: any, i: number) => {


                        return \`\${i + 1}. \${m.name || 'Unknown'}\\n   📍 \${m.address || 'N/A'}\\n   📞 \${m.phone || 'N/A'}\\n   🔗 \${m.mapUrl || ''}\`;


                    });



                    return \`Found \${materialResult.results.length} material suppliers:\\n\\n\${lines.join('\\n\\n')}\`;


                }



                return "No material suppliers found for this location.";



            }


            catch (error: any) {


                console.error("[MATERIAL SEARCH ERROR]", error.message);



                return "Material search is currently unavailable.";



            }



        }


`;

// Find the generic fallback comment and insert material handler before it
const marker = '        // -----------------------------------------\n        // GENERIC FALLBACK\n        // -----------------------------------------';
const index = content.indexOf(marker);

if (index !== -1) {
    content = content.substring(0, index) + materialHandler + content.substring(index);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Material handler inserted successfully');
} else {
    console.error('Could not find generic fallback marker');
    process.exit(1);
}
