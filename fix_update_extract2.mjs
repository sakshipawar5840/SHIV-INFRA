import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/ai-engine/intentDetector.ts';
let content = fs.readFileSync(path, 'utf8');

const startMarker = 'function extractUpdateData(';
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
    console.log('Function not found');
    process.exit(1);
}

// Find the next function declaration after extractUpdateData
const nextFunctionIdx = content.indexOf('\n\nfunction ', startIdx + 1);
const endIdx = nextFunctionIdx === -1 ? content.length : nextFunctionIdx;

const newFunction = `function extractUpdateData(
    message:string
):any{

    const params:any = {};

    const cleaned =
    message
    .replace(
        /update project|edit project|project update|project change|project badal|project update kar|update|change|badal/gi,
        ""
    )
    .trim();

    const words =
    cleaned.split(" ");

    const projectName =
    words.slice(
        0,
        -3
    )
    .join(" ");

    if(projectName){

        params.project_name =
        projectName;

    }


    const priceMatch =
    message.match(
        /(?:price|amount|kimat|daam)\\s+(?:to|ka|la|to\\s+)(\\d+)\\s*(lakh|lac|cr|crore)?/i
    );


    if(priceMatch){


        let price =
        Number(priceMatch[1]);


        if(priceMatch[2]){


            const unit =
            priceMatch[2]
            .toLowerCase();


            if(
                unit.startsWith("cr") ||
                unit.startsWith("crore")
            ){


                price *=
                10000000;



            }
            else if(
                unit.startsWith("lakh") ||
                unit.startsWith("lac")
            ){


                price *=
                100000;


            }


        }


        params.price =
        price;


    }


    return params;


}

`;

content = content.substring(0, startIdx) + newFunction + content.substring(endIdx);
fs.writeFileSync(path, content);
console.log('Updated extractUpdateData');
