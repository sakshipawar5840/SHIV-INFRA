// =====================================================
// SHIVINFRA AI
// RESPONSE GENERATOR ENGINE
//
// Purpose:
// - Convert tool results into natural AI responses
// - Handle success / failure
// - Handle GENERAL_CHAT
// - Work with Marathi / English / Hinglish
// - Never expose raw database errors to users
// =====================================================


// =====================================================
// TYPES
// =====================================================

export interface ResponseGeneratorRequest {

    intent: {

        name: string;

        action?: string;

        entity?: string;

        parameters?: any;

    };

    result: any;

}


export interface GeneratedResponse {

    success: boolean;

    message: string;

}


// =====================================================
// MAIN RESPONSE GENERATOR
// =====================================================

export async function generateResponse(
    request: ResponseGeneratorRequest
): Promise<GeneratedResponse> {

    try {

        const {
            intent,
            result
        } = request;


        const intentName =
            String(intent?.name || "")
                .toUpperCase()
                .trim();


        // =================================================
        // INVALID RESULT
        // =================================================

        if (!result) {

            return {

                success: false,

                message:
                    "Sorry, I could not process that request."

            };

        }


        // =================================================
        // GENERAL CHAT
        // =================================================

        if (intentName === "GENERAL_CHAT") {

            return {

                success: true,

                message:
                    String(
                        result.message ||
                        "I am ready to help you with SHIVINFRA."
                    )

            };

        }


        // =================================================
        // IF TOOL FAILED
        // =================================================

        if (
            result.success === false ||
            result.error === true
        ) {

            return {

                success: false,

                message:
                    getSafeErrorMessage(result)

            };

        }


        // =================================================
        // PROJECT
        // =================================================

        switch (intentName) {


            // =============================================
            // ADD PROJECT
            // =============================================

            case "ADD_PROJECT":

                return {

                    success: true,

                    message:
                        buildCreatedMessage(
                            "Project",
                            result
                        )

                };


            // =============================================
            // SEARCH PROJECTS
            // =============================================

            case "SEARCH_PROJECTS":

                return {

                    success: true,

                    message:
                        formatProjects(result)

                };


            // =============================================
            // UPDATE PROJECT
            // =============================================

            case "UPDATE_PROJECT":

                return {

                    success: true,

                    message:
                        buildUpdatedMessage(
                            "Project",
                            result
                        )

                };


            // =============================================
            // DELETE PROJECT
            // =============================================

            case "DELETE_PROJECT":

                return {

                    success: true,

                    message:
                        buildDeletedMessage(
                            "Project",
                            result
                        )

                };


            // =============================================
            // CUSTOMER
            // =============================================

            case "ADD_CUSTOMER":

                return {

                    success: true,

                    message:
                        buildCreatedMessage(
                            "Customer",
                            result
                        )

                };


            case "SEARCH_CUSTOMERS":

                return {

                    success: true,

                    message:
                        formatCustomers(result)

                };


            case "UPDATE_CUSTOMER":

                return {

                    success: true,

                    message:
                        buildUpdatedMessage(
                            "Customer",
                            result
                        )

                };


            case "DELETE_CUSTOMER":

                return {

                    success: true,

                    message:
                        buildDeletedMessage(
                            "Customer",
                            result
                        )

                };


            // =============================================
            // LEAD
            // =============================================

            case "ADD_LEAD":

                return {

                    success: true,

                    message:
                        buildCreatedMessage(
                            "Lead",
                            result
                        )

                };


            case "SEARCH_LEADS":

                return {

                    success: true,

                    message:
                        formatLeads(result)

                };


            case "UPDATE_LEAD":

                return {

                    success: true,

                    message:
                        buildUpdatedMessage(
                            "Lead",
                            result
                        )

                };


            case "DELETE_LEAD":

                return {

                    success: true,

                    message:
                        buildDeletedMessage(
                            "Lead",
                            result
                        )

                };


            // =============================================
            // EXPENSE
            // =============================================

            case "ADD_EXPENSE":

                return {

                    success: true,

                    message:
                        buildCreatedMessage(
                            "Expense",
                            result
                        )

                };


            case "SEARCH_EXPENSES":

                return {

                    success: true,

                    message:
                        formatExpenses(result)

                };


            case "UPDATE_EXPENSE":

                return {

                    success: true,

                    message:
                        buildUpdatedMessage(
                            "Expense",
                            result
                        )

                };


            case "DELETE_EXPENSE":

                return {

                    success: true,

                    message:
                        buildDeletedMessage(
                            "Expense",
                            result
                        )

                };


            // =============================================
            // BILL
            // =============================================

            case "UPLOAD_BILL":

                return {

                    success: true,

                    message:
                        formatBillUpload(result)

                };


            case "SEARCH_BILLS":

                return {

                    success: true,

                    message:
                        formatBills(result)

                };


            // =============================================
            // REPORT
            // =============================================

            case "GENERATE_REPORT":

                return {

                    success: true,

                    message:
                        formatReport(result)

                };


            // =============================================
            // SITE VISIT
            // =============================================

            case "BOOK_SITE_VISIT":

                return {

                    success: true,

                    message:
                        buildCreatedMessage(
                            "Site visit",
                            result
                        )

                };


            // =============================================
            // MATERIAL SEARCH
            // =============================================

            case "SEARCH_MATERIAL":

            case "MATERIAL_SEARCH":

                return {

                    success: true,

                    message:
                        formatMaterials(result)

                };


            // =============================================
            // DEFAULT
            // =============================================

            default:

                return {

                    success: true,

                    message:
                        createGenericResponse(result)

                };

        }


    }
    catch (error) {

        console.error(
            "[SHIVINFRA RESPONSE GENERATOR ERROR]",
            error
        );


        return {

            success: false,

            message:
                "I could not complete that request right now. Please try again."

        };

    }

}


// =====================================================
// CREATED MESSAGE
// =====================================================

function buildCreatedMessage(
    entity: string,
    result: any
): string {

    const name =
        extractDisplayName(result);


    if (name) {

        return (
            `✅ ${entity} created successfully.\n\n` +
            `Name: ${name}`
        );

    }


    return (
        `✅ ${entity} created successfully.`
    );

}


// =====================================================
// UPDATED MESSAGE
// =====================================================

function buildUpdatedMessage(
    entity: string,
    result: any
): string {

    const name =
        extractDisplayName(result);


    if (name) {

        return (
            `✅ ${entity} updated successfully.\n\n` +
            `Name: ${name}`
        );

    }


    return (
        `✅ ${entity} updated successfully.`
    );

}


// =====================================================
// DELETED MESSAGE
// =====================================================

function buildDeletedMessage(
    entity: string,
    result: any
): string {

    const name =
        extractDisplayName(result);


    if (name) {

        return (
            `✅ ${entity} deleted successfully.\n\n` +
            `Name: ${name}`
        );

    }


    return (
        `✅ ${entity} deleted successfully.`
    );

}


// =====================================================
// PROJECT FORMATTER
// =====================================================

function formatProjects(
    result: any
): string {

    const items =
        extractArray(result);


    if (!items.length) {

        return (
            "No projects found matching your request."
        );

    }


    const lines: string[] = [];


    lines.push(
        `🏗️ Projects found: ${items.length}`
    );


    lines.push("");


    items
        .slice(0, 20)
        .forEach(
            (project: any, index: number) => {

                const name =
                    project.project_name ||
                    project.name ||
                    "Unnamed Project";


                const location =
                    project.location ||
                    project.city ||
                    "";


                const price =
                    project.price ??
                    project.total_price;


                const flatType =
                    project.flat_type ||
                    project.property_type ||
                    "";


                lines.push(
                    `${index + 1}. ${name}`
                );


                if (location) {

                    lines.push(
                        `📍 ${location}`
                    );

                }


                if (flatType) {

                    lines.push(
                        `🏠 ${flatType}`
                    );

                }


                if (price !== undefined && price !== null) {

                    lines.push(
                        `💰 ${formatCurrency(price)}`
                    );

                }


                lines.push("");

            }
        );


    if (items.length > 20) {

        lines.push(
            `Showing 20 of ${items.length} projects.`
        );

    }


    return lines.join("\n").trim();

}


// =====================================================
// CUSTOMER FORMATTER
// =====================================================

function formatCustomers(
    result: any
): string {

    const items =
        extractArray(result);


    if (!items.length) {

        return "No customers found.";

    }


    const lines: string[] = [];


    lines.push(
        `👥 Customers found: ${items.length}`
    );


    lines.push("");


    items
        .slice(0, 20)
        .forEach(
            (customer: any, index: number) => {

                const name =
                    customer.name ||
                    customer.full_name ||
                    "Unnamed Customer";


                const phone =
                    customer.phone ||
                    customer.mobile ||
                    "";


                lines.push(
                    `${index + 1}. ${name}`
                );


                if (phone) {

                    lines.push(
                        `📞 ${phone}`
                    );

                }


                lines.push("");

            }
        );


    return lines.join("\n").trim();

}


// =====================================================
// LEAD FORMATTER
// =====================================================

function formatLeads(
    result: any
): string {

    const items =
        extractArray(result);


    if (!items.length) {

        return "No leads found.";

    }


    const lines: string[] = [];


    lines.push(
        `🎯 Leads found: ${items.length}`
    );


    lines.push("");


    items
        .slice(0, 20)
        .forEach(
            (lead: any, index: number) => {

                const name =
                    lead.name ||
                    lead.customer_name ||
                    "Unknown";


                const status =
                    lead.status ||
                    "New";


                const requirement =
                    lead.requirement ||
                    "";


                lines.push(
                    `${index + 1}. ${name}`
                );


                lines.push(
                    `📌 Status: ${status}`
                );


                if (requirement) {

                    lines.push(
                        `🏠 Requirement: ${requirement}`
                    );

                }


                lines.push("");

            }
        );


    return lines.join("\n").trim();

}


// =====================================================
// EXPENSE FORMATTER
// =====================================================

function formatExpenses(
    result: any
): string {

    const items =
        extractArray(result);


    if (!items.length) {

        return "No expenses found.";

    }


    let total = 0;


    items.forEach(
        (expense: any) => {

            const amount =
                Number(
                    expense.amount || 0
                );


            if (
                Number.isFinite(amount)
            ) {

                total += amount;

            }

        }
    );


    const lines: string[] = [];


    lines.push(
        `💰 Expenses found: ${items.length}`
    );


    lines.push(
        `Total: ${formatCurrency(total)}`
    );


    lines.push("");


    items
        .slice(0, 20)
        .forEach(
            (expense: any, index: number) => {

                const description =
                    expense.description ||
                    expense.category ||
                    "Expense";


                const amount =
                    Number(
                        expense.amount || 0
                    );


                lines.push(
                    `${index + 1}. ${description}`
                );


                lines.push(
                    `💵 ${formatCurrency(amount)}`
                );


                if (expense.date) {

                    lines.push(
                        `📅 ${expense.date}`
                    );

                }


                lines.push("");

            }
        );


    return lines.join("\n").trim();

}


// =====================================================
// BILL FORMATTER
// =====================================================

function formatBills(
    result: any
): string {

    const items =
        extractArray(result);


    if (!items.length) {

        return "No bills found.";

    }


    let total = 0;


    items.forEach(
        (bill: any) => {

            const amount =
                Number(
                    bill.amount || 0
                );


            if (
                Number.isFinite(amount)
            ) {

                total += amount;

            }

        }
    );


    const lines: string[] = [];


    lines.push(
        `🧾 Bills found: ${items.length}`
    );


    lines.push(
        `Total Amount: ${formatCurrency(total)}`
    );


    lines.push("");


    items
        .slice(0, 20)
        .forEach(
            (bill: any, index: number) => {

                const vendor =
                    bill.vendor ||
                    bill.vendor_name ||
                    "Unknown Vendor";


                const amount =
                    Number(
                        bill.amount || 0
                    );


                lines.push(
                    `${index + 1}. ${vendor}`
                );


                lines.push(
                    `💰 ${formatCurrency(amount)}`
                );


                if (bill.date) {

                    lines.push(
                        `📅 ${bill.date}`
                    );

                }


                if (bill.material) {

                    lines.push(
                        `🧱 ${bill.material}`
                    );

                }


                lines.push("");

            }
        );


    return lines.join("\n").trim();

}


// =====================================================
// BILL UPLOAD FORMATTER
// =====================================================

function formatBillUpload(
    result: any
): string {

    if (
        result.message &&
        typeof result.message === "string"
    ) {

        return (
            `✅ ${result.message}`
        );

    }


    const vendor =
        result.vendor ||
        result.vendor_name;


    const amount =
        result.amount;


    const lines: string[] = [];


    lines.push(
        "✅ Bill processed successfully."
    );


    if (vendor) {

        lines.push(
            `🏢 Vendor: ${vendor}`
        );

    }


    if (
        amount !== undefined &&
        amount !== null
    ) {

        lines.push(
            `💰 Amount: ${formatCurrency(amount)}`
        );

    }


    if (result.date) {

        lines.push(
            `📅 Date: ${result.date}`
        );

    }


    if (result.material) {

        lines.push(
            `🧱 Material: ${result.material}`
        );

    }


    return lines.join("\n");

}


// =====================================================
// REPORT FORMATTER
// =====================================================

function formatReport(
    result: any
): string {

    if (
        result.message &&
        typeof result.message === "string"
    ) {

        return (
            `📊 ${result.message}`
        );

    }


    if (result.download_url) {

        return (
            "✅ Report generated successfully.\n\n" +
            `📥 ${result.download_url}`
        );

    }


    return (
        "✅ Report generated successfully."
    );

}


// =====================================================
// MATERIAL FORMATTER
// =====================================================

function formatMaterials(
    result: any
): string {

    const items =
        extractArray(result);


    if (!items.length) {

        return (
            "No material suppliers found for this location."
        );

    }


    const lines: string[] = [];


    lines.push(
        `🏪 Suppliers found: ${items.length}`
    );


    lines.push("");


    items
        .slice(0, 20)
        .forEach(
            (item: any, index: number) => {

                const name =
                    item.name ||
                    item.business_name ||
                    "Supplier";


                lines.push(
                    `${index + 1}. ${name}`
                );


                if (item.address) {

                    lines.push(
                        `📍 ${item.address}`
                    );

                }


                if (item.phone) {

                    lines.push(
                        `📞 ${item.phone}`
                    );

                }


                if (item.rating) {

                    lines.push(
                        `⭐ ${item.rating}`
                    );

                }


                lines.push("");

            }
        );


    return lines.join("\n").trim();

}


// =====================================================
// GENERIC RESPONSE
// =====================================================

function createGenericResponse(
    result: any
): string {

    if (
        typeof result === "string"
    ) {

        return result;

    }


    if (
        result.message &&
        typeof result.message === "string"
    ) {

        return result.message;

    }


    if (
        result.success === true
    ) {

        return (
            "✅ Request completed successfully."
        );

    }


    return (
        "Request processed successfully."
    );

}


// =====================================================
// SAFE ERROR MESSAGE
// =====================================================

function getSafeErrorMessage(
    result: any
): string {

    const message =
        String(
            result.message ||
            result.error_message ||
            ""
        )
            .trim();


    if (!message) {

        return (
            "❌ I could not complete that request."
        );

    }


    // -----------------------------------------------
    // Known business-level messages can be exposed
    // -----------------------------------------------

    const safeMessages = [

        "already exists",

        "not found",

        "does not exist",

        "invalid",

        "required",

        "duplicate",

        "cannot",

        "unable",

        "permission",

        "not available"

    ];


    const lower =
        message.toLowerCase();


    const isSafe =
        safeMessages.some(
            (item) =>
                lower.includes(item)
        );


    if (isSafe) {

        return `❌ ${message}`;

    }


    // -----------------------------------------------
    // Never expose raw DB/internal errors
    // -----------------------------------------------

    console.error(
        "[SHIVINFRA INTERNAL TOOL ERROR]",
        result
    );


    return (
        "❌ I could not complete that request right now."
    );

}


// =====================================================
// ARRAY EXTRACTION
// =====================================================

function extractArray(
    result: any
): any[] {

    if (Array.isArray(result)) {

        return result;

    }


    if (
        Array.isArray(result?.data)
    ) {

        return result.data;

    }


    if (
        Array.isArray(result?.projects)
    ) {

        return result.projects;

    }


    if (
        Array.isArray(result?.customers)
    ) {

        return result.customers;

    }


    if (
        Array.isArray(result?.leads)
    ) {

        return result.leads;

    }


    if (
        Array.isArray(result?.expenses)
    ) {

        return result.expenses;

    }


    if (
        Array.isArray(result?.bills)
    ) {

        return result.bills;

    }


    if (
        Array.isArray(result?.items)
    ) {

        return result.items;

    }


    return [];

}


// =====================================================
// DISPLAY NAME
// =====================================================

function extractDisplayName(
    result: any
): string {

    return String(

        result?.project_name ||

        result?.project?.project_name ||

        result?.customer_name ||

        result?.customer?.name ||

        result?.name ||

        result?.full_name ||

        result?.lead_name ||

        ""

    ).trim();

}


// =====================================================
// CURRENCY FORMATTER
// =====================================================

function formatCurrency(
    value: any
): string {

    const amount =
        Number(value);


    if (
        !Number.isFinite(amount)
    ) {

        return String(value);

    }


    try {

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2
            }
        ).format(amount);

    }
    catch {

        return `₹${amount}`;

    }

}