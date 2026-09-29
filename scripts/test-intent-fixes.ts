import {
    correctIntent,
    extractLeadData,
    extractCustomerUpdateData,
    extractLeadUpdateData
} from "../backend/ai-engine/intentDetector.ts";

function logIntent(label: string, message: string, firstPass: any) {
    const result = correctIntent(message, firstPass);
    console.log(`\n=== ${label} ===`);
    console.log(`MSG: ${message}`);
    console.log(`[AI INTENT] ${JSON.stringify({
        name: result.name,
        action: result.action,
        entity: result.entity,
        confidence: result.confidence,
        parameters: result.parameters
    })}`);
    return result;
}

function logBudget(label: string, message: string) {
    const lead = extractLeadData(message);
    const cust = extractCustomerUpdateData(message);
    const leadUpd = extractLeadUpdateData(message);
    console.log(`\n=== ${label} ===`);
    console.log(`MSG: ${message}`);
    console.log(`[LEAD DATA]     budget=${JSON.stringify(lead.budget)}  (requirement="${lead.requirement}")`);
    console.log(`[CUST UPDATE]   budget=${JSON.stringify(cust.budget)}`);
    console.log(`[LEAD UPDATE]   budget=${JSON.stringify(leadUpd.budget)}`);
}

console.log("########## FIX 1: SEARCH_MATERIAL must not override project CREATE/UPDATE ##########");

const addProject = logIntent(
    "Add project (BHK in message)",
    "Add project Green Valley in Hadapsar Pune, 2BHK and 3BHK, 1200 sqft, 85 lakh",
    { name: "ADD_PROJECT", action: "CREATE", entity: "PROJECT", parameters: {}, confidence: 0.9 }
);

const updateProject = logIntent(
    "Update project (BHK in message)",
    "Update Sunrise Heights to 3BHK only, price 1.2 crore",
    { name: "UPDATE_PROJECT", action: "UPDATE", entity: "PROJECT", parameters: {}, confidence: 0.9 }
);

const materialFromNeutral = logIntent(
    "Material search (should STILL hit SEARCH_MATERIAL)",
    "2BHK cement bags kiti lagतात Baner site वर",
    { name: "GENERAL_CHAT", action: "CHAT", entity: "AI", parameters: {}, confidence: 0.5 }
);

const materialFromProjectFirstPass = logIntent(
    "Material search even if Gemini first-pass guessed a non-project intent",
    "2BHK cement bags kiti lagतात Baner site वर",
    { name: "SEARCH_PROJECTS", action: "SEARCH", entity: "PROJECT", parameters: {}, confidence: 0.7 }
);

console.log("\n########## FIX 2: lead budget must NOT come from BHK number ##########");

logBudget(
    "Lead: '2BHK Baner pahije' (budget must be null, not 2)",
    "2BHK Baner pahije"
);

logBudget(
    "Lead: 'Baner madhe 60 lakh budget aahe 2BHK sathi' (budget must be 6000000)",
    "Baner madhe 60 lakh budget aahe 2BHK sathi"
);

console.log("\n########## ASSERTIONS ##########");
const ok1 = addProject.name === "ADD_PROJECT";
const ok2 = updateProject.name === "UPDATE_PROJECT";
const ok3 = materialFromNeutral.name === "SEARCH_MATERIAL";
const ok4 = materialFromProjectFirstPass.name === "SEARCH_MATERIAL";
const ok5 = extractLeadData("2BHK Baner pahije").budget === null;
const ok6 = extractLeadData("Baner madhe 60 lakh budget aahe 2BHK sathi").budget === 6000000;

console.log(`Add project not downgraded:        ${ok1 ? "PASS" : "FAIL (" + addProject.name + ")"}`);
console.log(`Update project not downgraded:     ${ok2 ? "PASS" : "FAIL (" + updateProject.name + ")"}`);
console.log(`Cement msg -> SEARCH_MATERIAL:     ${ok3 ? "PASS" : "FAIL (" + materialFromNeutral.name + ")"}`);
console.log(`Cement msg (SEARCH_PROJECTS 1st pass): ${ok4 ? "PASS" : "FAIL (" + materialFromProjectFirstPass.name + ")"}`);
console.log(`'2BHK Baner pahije' budget null:   ${ok5 ? "PASS" : "FAIL"}`);
console.log(`'60 lakh ...' budget = 6000000:    ${ok6 ? "PASS" : "FAIL"}`);
process.exit(ok1 && ok2 && ok3 && ok4 && ok5 && ok6 ? 0 : 1);
