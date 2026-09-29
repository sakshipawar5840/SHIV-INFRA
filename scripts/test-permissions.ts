import { checkPermission } from "../backend/ai-engine/permissionChecker.ts";

async function main() {
    let allOk = true;

    async function assert(label: string, got: boolean, want: boolean) {
        const pass = got === want;
        if (!pass) allOk = false;
        console.log(`${pass ? "PASS" : "FAIL"} | ${label} -> allowed=${got} (want ${want})`);
    }

    console.log("=== MODULE 1: Admin full CRUD ===");
    for (const intent of ["ADD_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT", "ADD_LEAD", "DELETE_LEAD", "ADD_EXPENSE", "UPLOAD_BILL", "SEARCH_MATERIAL", "GENERATE_REPORT"]) {
        await assert(`ADMIN ${intent}`, (await checkPermission({ role: "ADMIN", intent })).allowed, true);
    }

    console.log("\n=== MODULE 2: Customer restricted to search/view/enquiry ===");
    for (const intent of ["SEARCH_PROJECTS", "SEARCH_CUSTOMERS", "ADD_LEAD", "BOOK_SITE_VISIT", "GENERAL_CHAT"]) {
        await assert(`CUSTOMER ${intent} (should be allowed)`, (await checkPermission({ role: "CUSTOMER", intent })).allowed, true);
    }
    for (const intent of ["ADD_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT", "ADD_EXPENSE", "UPDATE_EXPENSE", "DELETE_EXPENSE", "UPLOAD_BILL", "UPDATE_CUSTOMER", "DELETE_CUSTOMER", "SEARCH_MATERIAL"]) {
        await assert(`CUSTOMER ${intent} (should be BLOCKED)`, (await checkPermission({ role: "CUSTOMER", intent })).allowed, false);
    }

    console.log("\n=== Bonus: Engineer/Sales scoping ===");
    await assert("ENGINEER ADD_PROJECT (blocked)", (await checkPermission({ role: "ENGINEER", intent: "ADD_PROJECT" })).allowed, false);
    await assert("ENGINEER UPLOAD_BILL (allowed)", (await checkPermission({ role: "ENGINEER", intent: "UPLOAD_BILL" })).allowed, true);
    await assert("SALES ADD_PROJECT (blocked)", (await checkPermission({ role: "SALES", intent: "ADD_PROJECT" })).allowed, false);
    await assert("SALES ADD_LEAD (allowed)", (await checkPermission({ role: "SALES", intent: "ADD_LEAD" })).allowed, true);

    process.exit(allOk ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
