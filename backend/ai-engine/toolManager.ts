// =====================================================
// SHIVINFRA AI
// TOOL MANAGER
// Business Action Executor
// =====================================================


// Existing services

import projectService from "../services/projectService";
import customerService from "../services/customerService";
import leadService from "../services/leadService";
import expenseService from "../services/expenseService";
import billService from "../services/modules/BillService";
import reportService from "../services/reportService";
import { WhatsAppService } from "../services/whatsappService";
import { GoogleService } from "../services/googleService";
import { searchNearbySuppliers } from "../services/materialSearchService";
import { generateConversationResponse } from "./conversationEngine";
import { createFollowUp, getPendingFollowUpForLead } from "../services/followUpService";
import { supabaseAdmin as supabase } from "../config/supabase";
import { ReportDeliveryService } from "../services/reportDeliveryService";
import { taskService } from "../services/taskService";
import { inventoryService } from "../services/inventoryService";
import { vendorService } from "../services/vendorService";
import { documentService } from "../services/documentService";


// =====================================================
// TYPES
// =====================================================


interface ToolRequest {


    intent:any;


    userId:string;


    companyId:string;


    role:
    | "ADMIN"
    | "CUSTOMER"
    | "ENGINEER"
    | "SALES";


    phone?: string;


    message?: string;


    conversationHistory?: Array<{


        role: "user" | "assistant" | "system";


        content: string;


    }>;


}


// =====================================================
// HELPERS
// =====================================================


function pick<T>(
    source:any,
    ...keys:string[]
):T | undefined {


    for(const key of keys){


        if(
            source &&
            Object.prototype.hasOwnProperty.call(
                source,
                key
            )
        ){


            return source[key] as T;

        }


    }

    return undefined;


}


// =====================================================
// LEAD RESOLUTION HELPER
// =====================================================


async function resolveLeadId(
    companyId:string,
    params:any
):Promise<string | null>{



    if(params.id){

        return params.id;

    }


    if(params.lead_id){

        return params.lead_id;

    }


    if(params.leadId){

        return params.leadId;

    }


    if(params.name){

        let nameText = "";



        if (typeof params.name === "string") {

            nameText = params.name.trim();

        } else if (

            params.name &&

            typeof params.name === "object"

        ) {

            nameText =

                params.name.name ||

                params.name.full_name ||

                params.name.customer_name ||

                "";

        }



        if (nameText) {

            const uuidPattern =

            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;



            if (uuidPattern.test(nameText)) {

                const directLead =

                await leadService.smartFindLead(

                    companyId,

                    { id: nameText }

                );



                if (directLead) {

                    return directLead.id;

                }

            }



            const lead =

            await leadService.findLeadByName(

                companyId,

                nameText

            );



            if (lead) {

                return lead.id;

            }

        }

    }


    if(params.query){

        const leads =

        await leadService.getLeads(

            companyId

        );



        const matched =

        leads.filter((l:any) =>


            (l.full_name && l.full_name.toLowerCase().includes(params.query.toLowerCase())) ||

            (l.requirement && l.requirement.toLowerCase().includes(params.query.toLowerCase()))

        );



        if(matched.length === 1){

            return matched[0].id;

        }

    }

    return null;


}


function extractBudgetFromMessage(
    message: string
): number | null {

    const budgetMatch =
        message.match(
            /(\d+(?:\.\d+)?)\s*(lakh|lac|cr|crore|lakhs|crores)/i
        ) ||
        message.match(
            /budget\s+(?:to\s+)?(\d+(?:\.\d+)?)/i
        );



    if (!budgetMatch) {

        return null;

    }



    const budget =
        Number(
            budgetMatch[1]
        );



    const unit =
        (budgetMatch[2] || "")
            .toLowerCase();



    if (
        unit.startsWith("cr") ||
        unit.startsWith("crore")
    ) {

        return budget * 10000000;

    }
    else if (
        unit.startsWith("lakh") ||
        unit.startsWith("lac")
    ) {

        return budget * 100000;

    }



    return budget;

}


// =====================================================


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


            const projectsResponse = await projectService.searchProjects(
                    companyId,
                    message
                );



            const projects = projectsResponse.data || [];



            if (
                projects &&
                projects.length > 0
            ) {


                if (/how many|count/i.test(lower)) {


                    return `There are ${projects.length} projects in the system.`;


                }



                const lines = projects.slice(0, 5).map((p: any, i: number) => {


                    return `${i + 1}. ${p.project_name || p.name || 'Untitled'} - ${p.location || 'N/A'} - ₹${p.price || 'N/A'}`;


                });



                return `Found ${projects.length} projects:\n\n${lines.join('\n')}`;


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


            const customersResponse = await customerService.aiSearchCustomers(
                    companyId,
                    { query: message }
                );



            const customers = customersResponse.data || [];



            if (
                customers &&
                customers.length > 0
            ) {


                if (/how many|count/i.test(lower)) {


                    return `There are ${customers.length} customers in the system.`;


                }



                const lines = customers.slice(0, 5).map((c: any, i: number) => {


                    return `${i + 1}. ${c.full_name || c.name || 'Unknown'} - ${c.phone || 'N/A'} - ${c.status || 'N/A'}`;


                });



                return `Found ${customers.length} customers:\n\n${lines.join('\n')}`;


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


            const leadsResponse = await leadService.getLeads(
                    companyId
                );



            const leads = leadsResponse.data || [];



            if (
                leads &&
                leads.length > 0
            ) {


                if (/how many|count/i.test(lower)) {


                    return `There are ${leads.length} leads in the system.`;


                }



                const lines = leads.slice(0, 5).map((l: any, i: number) => {


                    return `${i + 1}. ${l.full_name || l.customer_name || 'Unknown'} - ${l.status || 'N/A'} - ${l.requirement || 'N/A'}`;


                });



                return `Found ${leads.length} leads:\n\n${lines.join('\n')}`;


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


            const expensesResponse = await expenseService.getExpenses(
                    companyId
                );



            const expenses = expensesResponse.data || [];



            if (
                expenses &&
                expenses.length > 0
            ) {


                if (/how many|count/i.test(lower)) {


                    return `There are ${expenses.length} expenses recorded.`;


                }



                const total = expenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);



                const lines = expenses.slice(0, 5).map((e: any, i: number) => {


                    return `${i + 1}. ${e.expense_title || e.title || 'Expense'} - ₹${e.amount || 0} - ${e.expense_date || e.expense_date || 'N/A'}`;


                });



                return `Found ${expenses.length} expenses. Total: ₹${total.toLocaleString()}.\n\nRecent:\n${lines.join('\n')}`;


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


            const billsResponse = await billService.searchBills(
                    companyId,
                    message
                );



            const bills =
                Array.isArray(billsResponse)
                    ? billsResponse
                    : [];



            if (
                bills &&
                bills.length > 0
            ) {


                if (/how many|count/i.test(lower)) {


                    return `There are ${bills.length} bills in the system.`;


                }



                const lines = bills.slice(0, 5).map((b: any, i: number) => {


                    return `${i + 1}. ${b.vendor_name || 'Unknown'} - ₹${b.amount || 0} - ${b.bill_date || 'N/A'}`;


                });



                return `Found ${bills.length} bills:\n\n${lines.join('\n')}`;


            }



            return "No bills found matching your query.";



        }




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
                    await searchNearbySuppliers(
                        materialQuery,
                        companyId
                    );



                if (

                    materialResult &&
                    materialResult.results &&
                    materialResult.results.length > 0
                ) {


                    const lines = materialResult.results.slice(0, 5).map((m: any, i: number) => {


                        return `${i + 1}. ${m.name || 'Unknown'}\n   📍 ${m.address || 'N/A'}\n   📞 ${m.phone || 'N/A'}\n   🔗 ${m.mapUrl || ''}`;


                    });



                    return `Found ${materialResult.results.length} material suppliers:\n\n${lines.join('\n\n')}`;


                }



                return "No material suppliers found for this location.";



            }


            catch (error: any) {


                console.error("[MATERIAL SEARCH ERROR]", error.message);



                return "Material search is currently unavailable.";



            }



        }


        // -----------------------------------------
        // GENERIC FALLBACK
        // -----------------------------------------



        const projectsResponse = await projectService.searchProjects(
                    companyId,
                    message
                );



            const projects = projectsResponse.data || [];



            if (
                projects &&
                projects.length > 0
            ) {


            const lines = projects.slice(0, 5).map((p: any, i: number) => {


                return `${i + 1}. ${p.project_name || p.name || 'Untitled'} - ${p.location || 'N/A'}`;


            });



            return `Found ${projects.length} projects:\n\n${lines.join('\n')}`;


        }



        return "";




    }


    catch (error: any) {


        console.error("[BUSINESS QUESTION ERROR]", error.message);



        return "";



    }


}


// MAIN TOOL EXECUTOR
// =====================================================


export async function executeTool(
    request:ToolRequest
){



    const {
        intent,
        companyId,
        userId,
        role,
        phone,
        message,
        conversationHistory
    } = request;



    const name =
    intent.name;



    console.log(
        "[AI TOOL]",
        name
    );



    const params =
    intent.parameters || {};



    switch(name){



        // =============================================
        // PROJECT MODULE
        // =============================================

        case "ADD_PROJECT":

            return await projectService.createProject({

                company_id:companyId,

                project_name:
                pick<string>(
                    params,
                    "project_name",
                    "name"
                ) || "New Project",

                project_type:
                pick<string>(
                    params,
                    "project_type",
                    "type"
                ) || "Residential",

                location:
                pick<string>(
                    params,
                    "location"
                ) || "Not specified",

                city:
                pick<string>(
                    params,
                    "city"
                ) || "Pune",

                state:
                pick<string>(
                    params,
                    "state"
                ) || "Maharashtra",

                pincode:
                pick<string>(
                    params,
                    "pincode"
                ) || "",

                description:
                pick<string>(
                    params,
                    "description"
                ) || "",

                flat_types:
                pick<string>(
                    params,
                    "flat_types",
                    "flat_type"
                ) || "",

                area_sqft:
                pick<string | number>(
                    params,
                    "area_sqft",
                    "sqft"
                ) || null,

                price:
                pick<number | string>(
                    params,
                    "price"
                ) || 0,

                brochure_url:
                pick<string>(
                    params,
                    "brochure_url",
                    "brochure_pdf_url"
                ) || "",

                thumbnail_url:
                pick<string>(
                    params,
                    "thumbnail_url"
                ) || "",

                gallery:
                pick<string>(
                    params,
                    "gallery"
                ) || "",

                amenities:
                pick<string>(
                    params,
                    "amenities"
                ) || "",

                contact_person:
                pick<string>(
                    params,
                    "contact_person"
                ) || "",

                contact_number:
                pick<string>(
                    params,
                    "contact_number"
                ) || "",

                total_units:
                pick<number | string>(
                    params,
                    "total_units"
                ) || 0,

                available_units:
                pick<number | string>(
                    params,
                    "available_units"
                ) || 0,

                status:
                pick<string>(
                    params,
                    "status"
                ) || "Ongoing"

            });


        case "SEARCH_PROJECTS":

            return await projectService.searchProjects(

                companyId,

                pick<string>(params, "query", "search", "name") || "",

                {

                    city:
                    pick<string>(params, "city"),

                    status:
                    pick<string>(params, "status")

                }

            );


        case "UPDATE_PROJECT":

            return await projectService.updateProject(

                pick<string>(params, "id", "project_id"),

                companyId,

                {

                    project_name:
                    pick<string>(params, "project_name", "name"),

                    location:
                    pick<string>(params, "location"),

                    city:
                    pick<string>(params, "city"),

                    description:
                    pick<string>(params, "description"),

                    flat_types:
                    pick<string>(params, "flat_types", "flat_type"),

                    area_sqft:
                    pick<string | number>(params, "area_sqft", "sqft"),

                    price:
                    pick<number | string>(params, "price"),

                    brochure_url:
                    pick<string>(params, "brochure_url", "brochure_pdf_url"),

                    thumbnail_url:
                    pick<string>(params, "thumbnail_url"),

                    gallery:
                    pick<string>(params, "gallery"),

                    amenities:
                    pick<string>(params, "amenities"),

                    contact_person:
                    pick<string>(params, "contact_person"),

                    contact_number:
                    pick<string>(params, "contact_number"),

                    total_units:
                    pick<number | string>(params, "total_units"),

                    available_units:
                    pick<number | string>(params, "available_units"),

                    status:
                    pick<string>(params, "status")

                }

            );


        case "DELETE_PROJECT":

            return await projectService.deleteProject(

                pick<string>(params, "id", "project_id"),

                companyId,

                pick<string>(params, "project_name", "name") || ""

            );


        // =============================================
        // CUSTOMER MODULE
        // =============================================

        case "ADD_CUSTOMER":

            return await customerService.createCustomer({

                company_id:companyId,

                full_name:
                pick<string>(
                    params,
                    "full_name",
                    "name",
                    "customer_name"
                ),

                phone:
                pick<string>(
                    params,
                    "phone"
                ),

                email:
                pick<string>(
                    params,
                    "email"
                ),

                city:
                pick<string>(
                    params,
                    "city"
                ),

                state:
                pick<string>(
                    params,
                    "state"
                ),

                pincode:
                pick<string>(
                    params,
                    "pincode"
                ),

                address:
                pick<string>(
                    params,
                    "address"
                ),

                budget:
                pick<number | string>(
                    params,
                    "budget"
                ),

                interested_property_type:
                pick<string>(
                    params,
                    "interested_property_type",
                    "property_type",
                    "requirement"
                ),

                interested_location:
                pick<string>(
                    params,
                    "interested_location",
                    "location"
                ),

                source:
                pick<string>(
                    params,
                    "source",
                    "lead_source"
                ) || "AI",

                status:
                pick<string>(
                    params,
                    "status"
                ) || "active",

                notes:
                pick<string>(
                    params,
                    "notes",
                    "remarks"
                )

            });


        case "SEARCH_CUSTOMERS":

            return await customerService.getCustomers(
                companyId
            );


        case "UPDATE_CUSTOMER":

            return await customerService.updateCustomer(

                pick<string>(params, "id", "customer_id"),

                companyId,

                {

                    full_name:
                    pick<string>(params, "full_name", "name"),

                    phone:
                    pick<string>(params, "phone"),

                    email:
                    pick<string>(params, "email"),

                    city:
                    pick<string>(params, "city"),

                    state:
                    pick<string>(params, "state"),

                    pincode:
                    pick<string>(params, "pincode"),

                    address:
                    pick<string>(params, "address"),

                    budget:
                    pick<number | string>(params, "budget"),

                    interested_property_type:
                    pick<string>(params, "interested_property_type"),

                    interested_location:
                    pick<string>(params, "interested_location"),

                    source:
                    pick<string>(params, "source"),

                    status:
                    pick<string>(params, "status"),

                    notes:
                    pick<string>(params, "notes")

                }

            );


        case "DELETE_CUSTOMER":

            return await customerService.deleteCustomer(

                pick<string>(params, "id", "customer_id"),

                companyId,

                {

                    full_name:
                    pick<string>(
                        params,
                        "full_name",
                        "name",
                        "customer_name"
                    ),

                    phone:
                    pick<string>(params, "phone")

                }

            );


        // =============================================
        // LEAD MODULE
        // =============================================

case "ADD_LEAD":

            const customerPhone =
                pick<string | null>(
                    params,
                    "customer_phone",
                    "phone"
                );

            const customerName =
                pick<string | null>(
                    params,
                    "customer_name",
                    "name",
                    "full_name"
                );

            let resolvedCustomerId =
                pick<string | null>(
                    params,
                    "customer_id"
                );

            if (!resolvedCustomerId && customerPhone) {
                const normalizedPhone = customerPhone.replace(/\D/g, "").slice(-10);

                const { data: existingCustomer } = await supabase
                    .from("customers")
                    .select("id")
                    .eq("company_id", companyId)
                    .eq("phone", normalizedPhone)
                    .maybeSingle();

                if (existingCustomer) {
                    resolvedCustomerId = existingCustomer.id;
                } else {
                    const { data: newCustomer } = await supabase
                        .from("customers")
                        .insert({
                            company_id: companyId,
                            full_name: customerName || "WhatsApp Customer",
                            phone: normalizedPhone,
                            status: "active",
                            source: "WhatsApp"
                        })
                        .select("id")
                        .single();

                    if (newCustomer) {
                        resolvedCustomerId = newCustomer.id;
                    }
                }
            }

            const createdLead =
                await leadService.createLead({

                    company_id: companyId,

                    customer_id: resolvedCustomerId,

                    project_id:
                    pick<string | null>(
                        params,
                        "project_id"
                    ),

                    lead_source:
                    pick<string>(
                        params,
                        "lead_source",
                        "source"
                    ) || "AI",

                    requirement:
                    pick<string>(
                        params,
                        "requirement",
                        "name",
                        "description"
                    ) || "",

                    budget:
                    pick<number | string | null>(
                        params,
                        "budget"
                    ),

                    preferred_location:
                    pick<string | null>(
                        params,
                        "preferred_location",
                        "location"
                    ),

                    status:
                    pick<string>(
                        params,
                        "status"
                    ) || "New",

                    assigned_to:
                    pick<string | null>(
                        params,
                        "assigned_to",
                        "assigned_sales_id",
                        "user_id"
                    ) || userId,

                    remarks:
                    pick<string | null>(
                        params,
                        "remarks",
                        "notes"
                    ) || "Created by SHIVINFRA AI"

                });


            if (
                createdLead &&
                request.phone
            ) {

                const existingFollowUp =
                    await getPendingFollowUpForLead(
                        createdLead.id,
                        companyId
                    );


                if (!existingFollowUp) {

                    const requirement =
                        pick<string>(
                            params,
                            "requirement",
                            "name",
                            "description"
                        ) || "our services";


                    await createFollowUp({

                        company_id: companyId,

                        lead_id: createdLead.id,

                        phone: request.phone,

                        message:
                            "Thank you for your enquiry regarding " +
                            requirement +
                            ". Our team will contact you shortly."

                    });

                }

            }


            return createdLead;


        case "SEARCH_LEADS":

            return await leadService.getLeads(
                companyId
            );


        case "UPDATE_LEAD":

            const leadIdForUpdate =

            await resolveLeadId(

                companyId,

                params

            );



            if(!leadIdForUpdate){

                return {

                    success:false,

                    message:
                        "Lead not found. Please provide a lead name or ID."

                };

            }



            return await leadService.updateLead(

                leadIdForUpdate,

                companyId,

                {

                    lead_source:
                        pick<string>(params, "lead_source", "source"),

                    requirement:
                        pick<string>(params, "requirement"),

                    budget:
                        pick<number | string | null>(params, "budget"),

                    preferred_location:
                        pick<string | null>(params, "preferred_location", "location"),

                    status:
                        pick<string>(params, "status"),

                    assigned_to:
                        pick<string | null>(params, "assigned_to", "assigned_sales_id"),

                    remarks:
                        pick<string | null>(params, "remarks", "notes")

                }

            );


        case "DELETE_LEAD":

            const leadIdForDelete =

            await resolveLeadId(

                companyId,

                params

            );



            if(!leadIdForDelete){

                return {

                    success:false,

                    message:
                        "Lead not found. Please provide a lead name or ID."

                };

            }



            return await leadService.deleteLead(

                leadIdForDelete,

                companyId

            );


        // =============================================
        // EXPENSE MODULE
        // =============================================

        case "ADD_EXPENSE":

            return await expenseService.createExpense({

                company_id:companyId,

                expense_title:
                pick<string>(
                    params,
                    "expense_title",
                    "title",
                    "description",
                    "name"
                ),

                expense_category:
                pick<string>(
                    params,
                    "expense_category",
                    "category"
                ),

                amount:
                pick<number | string>(
                    params,
                    "amount"
                ),

                expense_date:
                pick<string>(
                    params,
                    "expense_date",
                    "date"
                ),

                payment_method:
                pick<string>(
                    params,
                    "payment_method",
                    "payment_mode"
                ),

                remarks:
                pick<string>(
                    params,
                    "remarks",
                    "notes"
                ),

                project_id:
                pick<string | null>(
                    params,
                    "project_id"
                ),

                vendor:
                pick<string>(
                    params,
                    "vendor",
                    "vendor_name"
                ),

                created_by:
                userId

            });


        case "SEARCH_EXPENSES":

            return await expenseService.searchExpenses(
                companyId
            );


        case "UPDATE_EXPENSE":

            return await expenseService.updateExpense(

                pick<string>(params, "id", "expense_id"),

                companyId,

                {

                    expense_title:
                    pick<string>(params, "expense_title", "title"),

                    expense_category:
                    pick<string>(params, "expense_category", "category"),

                    amount:
                    pick<number | string>(params, "amount"),

                    expense_date:
                    pick<string>(params, "expense_date", "date"),

                    payment_method:
                    pick<string>(params, "payment_method", "payment_mode"),

                    remarks:
                    pick<string>(params, "remarks", "notes"),

                    project_id:
                    pick<string | null>(params, "project_id"),

                    vendor:
                    pick<string>(params, "vendor", "vendor_name")

                }

            );


        case "DELETE_EXPENSE":

            return await expenseService.deleteExpense(

                pick<string>(params, "id", "expense_id"),

                companyId

            );


        // =============================================
        // TASK MODULE
        // =============================================

        case "SEARCH_TASKS":

            return await taskService.list(
                companyId,
                pick<string>(params, "query", "status")
            );

        case "ADD_TASK":

            return await taskService.create(
                companyId,
                {
                    title: pick<string>(params, "title", "task_title") || "New Task",
                    description: pick<string>(params, "description", "desc"),
                    due_date: pick<string>(params, "due_date", "date") || new Date(Date.now() + 86400000).toISOString().split("T")[0],
                    priority: (pick<string>(params, "priority") as any) || "Medium",
                    assigned_to: pick<string>(params, "assigned_to", "assignee")
                },
                userId
            );

        case "UPDATE_TASK":

            return await taskService.update(
                pick<string>(params, "id", "task_id"),
                companyId,
                {
                    title: pick<string>(params, "title", "task_title"),
                    description: pick<string>(params, "description", "desc"),
                    due_date: pick<string>(params, "due_date", "date"),
                    priority: pick<string>(params, "priority") as any,
                    status: pick<string>(params, "status") as any,
                    assigned_to: pick<string>(params, "assigned_to", "assignee")
                }
            );

        case "DELETE_TASK":

            return await taskService.delete(
                pick<string>(params, "id", "task_id"),
                companyId
            );


        // =============================================
        // SITE VISIT MODULE
        // =============================================

        case "BOOK_SITE_VISIT":

            return await supabase
                .from("site_visits")
                .insert({
                    company_id: companyId,
                    lead_id: pick<string>(params, "lead_id") || null,
                    customer_id: pick<string>(params, "customer_id") || null,
                    project_id: pick<string>(params, "project_id") || null,
                    visit_date: pick<string>(params, "visit_date", "date") || new Date(Date.now() + 86400000).toISOString().split("T")[0],
                    status: "Scheduled",
                    notes: pick<string>(params, "notes", "remark") || ""
                })
                .select()
                .single()
                .then(({ data, error }) => {
                    if (error) throw error;
                    return { success: true, message: "Site Visit created in Supabase.", data };
                });

        case "SEARCH_SITE_VISITS":

            return await supabase
                .from("site_visits")
                .select("*")
                .eq("company_id", companyId)
                .eq("is_deleted", false)
                .order("visit_date", { ascending: true })
                .then(({ data, error }) => {
                    if (error) throw error;
                    return { success: true, count: data?.length || 0, data: data || [] };
                });

        case "UPDATE_SITE_VISIT":

            return await supabase
                .from("site_visits")
                .update({
                    lead_id: pick<string>(params, "lead_id"),
                    customer_id: pick<string>(params, "customer_id"),
                    project_id: pick<string>(params, "project_id"),
                    visit_date: pick<string>(params, "visit_date", "date"),
                    status: pick<string>(params, "status"),
                    notes: pick<string>(params, "notes", "remark")
                })
                .eq("id", pick<string>(params, "id", "visit_id"))
                .eq("company_id", companyId)
                .select()
                .single()
                .then(({ data, error }) => {
                    if (error) throw error;
                    if (!data) return { success: false, message: "Site visit not found" };
                    return { success: true, message: "Site visit updated in Supabase.", data };
                });

        case "DELETE_SITE_VISIT":

            return await supabase
                .from("site_visits")
                .update({ is_deleted: true })
                .eq("id", pick<string>(params, "id", "visit_id"))
                .eq("company_id", companyId)
                .select()
                .single()
                .then(({ data, error }) => {
                    if (error) throw error;
                    if (!data) return { success: false, message: "Site visit not found" };
                    return { success: true, message: "Site visit appointment canceled successfully." };
                });


        // =============================================
        // INVENTORY MODULE
        // =============================================

        case "SEARCH_INVENTORY":

            return await inventoryService.list(
                companyId,
                pick<string>(params, "query", "item_name", "category")
            );

        case "ADD_INVENTORY":

            return await inventoryService.create(
                companyId,
                {
                    item_name: pick<string>(params, "item_name", "name") || "New Item",
                    category: pick<string>(params, "category") || "General",
                    quantity: Number(pick<string | number>(params, "quantity") || 0),
                    unit: pick<string>(params, "unit") || "Pieces",
                    minimum_stock: Number(pick<string | number>(params, "minimum_stock", "min_stock") || 0),
                    unit_price: Number(pick<string | number>(params, "unit_price", "price") || 0),
                }
            );

        case "UPDATE_INVENTORY":

            return await inventoryService.update(
                pick<string>(params, "id", "item_id"),
                companyId,
                {
                    item_name: pick<string>(params, "item_name", "name"),
                    category: pick<string>(params, "category"),
                    quantity: pick<string | number>(params, "quantity") ? Number(pick<string | number>(params, "quantity")) : undefined,
                    unit: pick<string>(params, "unit"),
                    minimum_stock: pick<string | number>(params, "minimum_stock", "min_stock") ? Number(pick<string | number>(params, "minimum_stock", "min_stock")) : undefined,
                    unit_price: pick<string | number>(params, "unit_price", "price") ? Number(pick<string | number>(params, "unit_price", "price")) : undefined,
                }
            );

        case "DELETE_INVENTORY":

            return await inventoryService.delete(
                pick<string>(params, "id", "item_id"),
                companyId
            );


        // =============================================
        // VENDOR MODULE
        // =============================================

        case "SEARCH_VENDORS":

            return await vendorService.list(
                companyId,
                pick<string>(params, "query", "vendor_name", "name")
            );

        case "ADD_VENDOR":

            return await vendorService.create(
                companyId,
                {
                    vendor_name: pick<string>(params, "vendor_name", "name") || "New Vendor",
                    contact_person: pick<string>(params, "contact_person", "contact"),
                    phone: pick<string>(params, "phone", "mobile"),
                    email: pick<string>(params, "email"),
                    gstin: pick<string>(params, "gstin"),
                    rating: Number(pick<string | number>(params, "rating") || 5),
                    outstanding_balance: Number(pick<string | number>(params, "outstanding_balance", "balance") || 0)
                }
            );

        case "UPDATE_VENDOR":

            return await vendorService.update(
                pick<string>(params, "id", "vendor_id"),
                companyId,
                {
                    vendor_name: pick<string>(params, "vendor_name", "name"),
                    contact_person: pick<string>(params, "contact_person", "contact"),
                    phone: pick<string>(params, "phone", "mobile"),
                    email: pick<string>(params, "email"),
                    gstin: pick<string>(params, "gstin"),
                    rating: pick<string | number>(params, "rating") ? Number(pick<string | number>(params, "rating")) : undefined,
                    outstanding_balance: pick<string | number>(params, "outstanding_balance", "balance") ? Number(pick<string | number>(params, "outstanding_balance", "balance")) : undefined
                }
            );

        case "DELETE_VENDOR":

            return await vendorService.delete(
                pick<string>(params, "id", "vendor_id"),
                companyId
            );


        // =============================================
        // DOCUMENT MODULE
        // =============================================

        case "SEARCH_DOCUMENTS":

            return await documentService.list(
                companyId,
                pick<string>(params, "project_id")
            );

        case "UPLOAD_DOCUMENT":

            return await documentService.create({
                company_id: companyId,
                project_id: pick<string>(params, "project_id") || null,
                uploaded_by: userId,
                document_name: pick<string>(params, "document_name", "name") || "Uploaded Document",
                document_type: pick<string>(params, "document_type", "type") || "application/pdf",
                file_url: pick<string>(params, "file_url") || "",
                file_size: Number(pick<string | number>(params, "file_size", "size") || 0)
            });

        case "UPDATE_DOCUMENT":

            return await documentService.update(
                pick<string>(params, "id", "document_id"),
                companyId,
                {
                    document_name: pick<string>(params, "document_name", "name"),
                    document_type: pick<string>(params, "document_type", "type"),
                    project_id: pick<string>(params, "project_id")
                }
            );

        case "DELETE_DOCUMENT":

            return await documentService.delete(
                pick<string>(params, "id", "document_id"),
                companyId
            );


        // =============================================
        // BILL MODULE
        // =============================================

        case "UPLOAD_BILL":

            return await billService.createBill({

                company_id:companyId,

                vendor_name:
                pick<string>(
                    params,
                    "vendor_name",
                    "vendor",
                    "supplier"
                ),

                material_name:
                pick<string>(
                    params,
                    "material_name",
                    "material"
                ),

                quantity:
                pick<number | string>(
                    params,
                    "quantity"
                ),

                unit:
                pick<string>(
                    params,
                    "unit"
                ),

                bill_number:
                pick<string>(
                    params,
                    "bill_number",
                    "invoice_number"
                ),

                bill_date:
                pick<string>(
                    params,
                    "bill_date",
                    "date"
                ),

                amount:
                pick<number | string>(
                    params,
                    "amount"
                ),

                gst_amount:
                pick<number | string>(
                    params,
                    "gst_amount",
                    "gst_number"
                ),

                total_amount:
                pick<number | string>(
                    params,
                    "total_amount"
                ),

                bill_file_url:
                pick<string>(
                    params,
                    "bill_file_url",
                    "file_url",
                    "original_file_url"
                ),

                ocr_data:
                pick<string | object>(
                    params,
                    "ocr_data",
                    "ocr_text"
                ),

                status:
                pick<string>(
                    params,
                    "status",
                    "payment_status",
                    "ocr_status"
                ) || "Pending",

                remarks:
                pick<string>(
                    params,
                    "remarks",
                    "notes"
                ),

                project_id:
                pick<string | null>(
                    params,
                    "project_id"
                ),

                vendor_id:
                pick<string | null>(
                    params,
                    "vendor_id"
                )

            });


        case "SEARCH_BILLS":

            const billQuery =
                String(
                    params.query ||
                    params.message ||
                    params.text ||
                    params.search ||
                    message ||
                    ""
                )
                    .trim();


            return await billService.searchBills(
                companyId,
                billQuery
            );


        case "UPDATE_BILL":

            return await billService.updateBill(

                pick<string>(params, "id", "bill_id"),

                companyId,

                {

                    vendor_name:
                    pick<string>(params, "vendor_name", "vendor"),

                    material_name:
                    pick<string>(params, "material_name", "material"),

                    quantity:
                    pick<number | string>(params, "quantity"),

                    unit:
                    pick<string>(params, "unit"),

                    bill_number:
                    pick<string>(params, "bill_number"),

                    bill_date:
                    pick<string>(params, "bill_date", "date"),

                    amount:
                    pick<number | string>(params, "amount"),

                    gst_amount:
                    pick<number | string>(params, "gst_amount"),

                    payment_status:
                    pick<string>(params, "payment_status", "status"),

                    bill_file_url:
                    pick<string>(params, "bill_file_url", "file_url"),

                    ocr_text:
                    pick<string>(params, "ocr_text", "ocr_data"),

                    remarks:
                    pick<string>(params, "remarks"),

                    project_id:
                    pick<string | null>(params, "project_id")

                }

            );


        case "DELETE_BILL":

            return await billService.deleteBill(

                pick<string>(params, "id", "bill_id"),

                companyId

            );


        // =============================================
        // MATERIAL SEARCH
        // =============================================

        case "SEARCH_MATERIAL": {

            const material =
                String(
                    params.material ||
                    params.material_name ||
                    params.query ||
                    ""
                )
                    .trim();

            const location =
                String(
                    params.location ||
                    params.city ||
                    params.place ||
                    ""
                )
                    .trim();

            const originalMessage =
                String(message || "")
                    .trim();

            const searchQuery =
                originalMessage ||
                material ||
                "construction material";

            const searchLocation =
                location ||
                "Pune";

            if (!searchQuery) {

                return {

                    success: true,

                    type: "MATERIAL_SEARCH",

                    message:
                        "Please specify material and location. Example: Cement 53 Grade Baner Pune"

                };

            }


            const searchResult =
                await searchNearbySuppliers(
                    searchQuery,
                    searchLocation
                );


            if (
                !searchResult.configured
            ) {

                return {

                    success: false,

                    code: "GOOGLE_NOT_CONFIGURED",

                    message:
                        "Google Maps/Places is not configured. Please set GOOGLE_MAPS_API_KEY.",

                    data:
                        searchResult

                };

            }


            if (
                searchResult.results.length ===
                0
            ) {

                return {

                    success: true,

                    type: "MATERIAL_SEARCH",

                    message:
                        `No suppliers found for "${searchQuery}" near "${searchLocation}".`,

                    data:
                        searchResult

                };

            }


            const lines =
                searchResult.results.map(
                    (supplier: any, idx: number) =>
                        `${idx + 1}. ${supplier.name}\n   Address: ${supplier.address}\n${supplier.phone ? `   Phone: ${supplier.phone}\n` : ""}${supplier.rating ? `   Rating: ${supplier.rating}\n` : ""}   Map: ${supplier.mapUrl}`
                );


            return {

                success: true,

                type: "MATERIAL_SEARCH",

                message:
                    `Suppliers for "${material}" near "${location}":\n\n${lines.join("\n\n")}`,

                data:
                    searchResult

            };

        }


        // =============================================
        // REPORT
        // =============================================

        case "GENERATE_REPORT":

            const reportType =
                String(
                    params.report_type ||
                    params.type ||
                    "finance"
                )
                .toLowerCase()
                .trim();

            const fileFormat =
                String(
                    params.file_format ||
                    params.format ||
                    "PDF"
                )
                .toUpperCase()
                .trim();

            let reportData: any = {
                title: `${reportType} Report`,
                items: []
            };

            let columns: any[] = [];

            try {

                if (
                    reportType.includes("project")
                ) {

                    const projects =
                        await projectService.searchProjects(
                            companyId,
                            "",
                            {}
                        );

                    reportData.items = projects || [];
                    columns = [
                        { header: "Name", key: "name", width: 30 },
                        { header: "Location", key: "location", width: 25 },
                        { header: "Price", key: "price", width: 15 },
                        { header: "Status", key: "status", width: 15 }
                    ];

                }
                else if (
                    reportType.includes("customer")
                ) {

                    const customers =
                        await customerService.getCustomers(
                            companyId
                        );

                    reportData.items = customers || [];
                    columns = [
                        { header: "Name", key: "full_name", width: 30 },
                        { header: "Phone", key: "phone", width: 15 },
                        { header: "Email", key: "email", width: 25 },
                        { header: "Status", key: "status", width: 15 }
                    ];

                }
                else if (
                    reportType.includes("lead")
                ) {

                    const leads =
                        await leadService.getLeads(
                            companyId
                        );

                    reportData.items = leads || [];
                    columns = [
                        { header: "Name", key: "name", width: 30 },
                        { header: "Phone", key: "phone", width: 15 },
                        { header: "Status", key: "status", width: 15 },
                        { header: "Budget", key: "budget", width: 15 }
                    ];

                }
                else if (
                    reportType.includes("expense")
                ) {

                    const expenses =
                        await expenseService.searchExpenses(
                            companyId,
                            ""
                        );

                    reportData.items = expenses || [];
                    columns = [
                        { header: "Title", key: "expense_title", width: 30 },
                        { header: "Category", key: "expense_category", width: 20 },
                        { header: "Amount", key: "amount", width: 15 },
                        { header: "Date", key: "expense_date", width: 15 }
                    ];

                }
                else if (
                    reportType.includes("bill")
                ) {

                    const bills =
                        await billService.searchBills(
                            companyId,
                            ""
                        );

                    reportData.items = bills || [];
                    columns = [
                        { header: "Vendor", key: "vendor_name", width: 25 },
                        { header: "Amount", key: "amount", width: 15 },
                        { header: "Date", key: "bill_date", width: 15 },
                        { header: "Status", key: "payment_status", width: 15 }
                    ];

                }
                else {

                    const expenses =
                        await expenseService.searchExpenses(
                            companyId,
                            ""
                        );

                    reportData.items = expenses || [];
                    columns = [
                        { header: "Title", key: "expense_title", width: 30 },
                        { header: "Category", key: "expense_category", width: 20 },
                        { header: "Amount", key: "amount", width: 15 },
                        { header: "Date", key: "expense_date", width: 15 }
                    ];

                }

                const reportName =
                    `${reportType}_${Date.now()}`;

                let filePath: string = "";

                if (fileFormat === "EXCEL") {

                    filePath =
                        await reportService.generateExcel(
                            reportName,
                            columns,
                            reportData.items
                        );

                }
                else if (fileFormat === "CSV") {

                    const csv =
                        reportService.generateCSV(
                            columns,
                            reportData.items
                        );

                    const fs = await import("fs");
                    const path = await import("path");

                    const reportsDir =
                        path.join(
                            process.cwd(),
                            "uploads",
                            "reports"
                        );

                    if (
                        !fs.existsSync(
                            reportsDir
                        )
                    ) {

                        fs.mkdirSync(
                            reportsDir,
                            { recursive: true }
                        );

                    }

                    filePath =
                        path.join(
                            reportsDir,
                            `${reportName}.csv`
                        );

                    fs.writeFileSync(
                        filePath,
                        csv
                    );

                }
                else {

                    filePath =
                        await reportService.generatePDF(
                            reportName,
                            reportData
                        );

                }

                // Upload to Supabase Storage and send via WhatsApp
                let publicUrl: string | undefined;
                let whatsappSent = false;

                if (phone) {
                    const deliveryResult = await ReportDeliveryService.generateAndDeliverReport(
                        filePath,
                        companyId,
                        phone,
                        reportType,
                        fileFormat
                    );
                    publicUrl = deliveryResult.publicUrl;
                    whatsappSent = deliveryResult.whatsappSent || false;
                }

                return {

                    success: true,

                    code: "REPORT_GENERATED",

                    message:
                        phone
                            ? `Report generated: ${fileFormat}. ${whatsappSent ? "Sent via WhatsApp" : "Stored for download"}`
                            : `Report generated: ${fileFormat}`,

                    data: {

                        report_type:
                            reportType,

                        file_format:
                            fileFormat,

                        file_path:
                            filePath,

                        public_url:
                            publicUrl,

                        whatsapp_sent:
                            whatsappSent,

                        record_count:
                            reportData.items.length

                    },

                    timestamp:
                        new Date()
                            .toISOString()

                };

            }
            catch (error: any) {

                return {

                    success: false,

                    code: "REPORT_FAILED",

                    message:
                        error?.message ||
                        "Report generation failed",

                    timestamp:
                        new Date()
                        .toISOString()

                };

            }


        // =============================================
        // WHATSAPP
        // =============================================

        case "SEND_WHATSAPP_MESSAGE": {

            const phone =
                String(
                    params.phone ||
                    params.mobile ||
                    params.to ||
                    ""
                )
                .trim();

            const message =
                String(
                    params.message ||
                    params.text ||
                    ""
                )
                .trim();

            if (!phone) {

                return {

                    success: false,

                    code:
                        "WHATSAPP_PHONE_REQUIRED",

                    message:
                        "Phone number is required for WhatsApp"

                };

            }

            if (!message) {

                return {

                    success: false,

                    code:
                        "WHATSAPP_MESSAGE_REQUIRED",

                    message:
                        "Message is required for WhatsApp"

                };

            }

            try {

                const sent =
                    await WhatsAppService.sendTextMessage(
                        phone,
                        message
                    );

                return {

                    success: sent,

                    code:
                        sent
                            ? "WHATSAPP_SENT"
                            : "WHATSAPP_FAILED",

                    message:
                        sent
                            ? "WhatsApp message sent successfully"
                            : "Failed to send WhatsApp message",

                    timestamp:
                        new Date()
                        .toISOString()

                };

            }
            catch (error: any) {

                return {

                    success: false,

                    code: "WHATSAPP_ERROR",

                    message:
                        error?.message ||
                        "WhatsApp send failed",

                    timestamp:
                        new Date()
                        .toISOString()

                };

            }

        }

        case "CREATE_BROADCAST":

            try {

                const audience =
                    pick<string>(
                        params,
                        "audience",
                        "target"
                    ) || "CUSTOMERS";

                const messageText =
                    pick<string>(
                        params,
                        "message",
                        "text"
                    ) || "Update from SHIVINFRA";

                const projectName =
                    pick<string | null>(
                        params,
                        "project_name",
                        "project"
                    );

                const city =
                    pick<string | null>(
                        params,
                        "city",
                        "location"
                    );

                const leadStatus =
                    pick<string | null>(
                        params,
                        "lead_status",
                        "status"
                    );

                let recipients: Array<{
                    phone: string;
                    type: "customer" | "lead";
                    id: string;
                }> = [];

                if (
                    audience.toUpperCase() === "CUSTOMERS"
                ) {

                    const { data: customers } =
                        await customerService.filterCustomers(
                            companyId,
                            {
                                city,
                                status: leadStatus
                            }
                        );

                    if (customers) {

                        recipients.push(
                            ...customers
                                .filter(
                                    (c: any) =>
                                        c.phone &&
                                        String(c.phone).trim() !== ""
                                )
                                .map((c: any) => ({
                                    phone:
                                        String(c.phone).trim(),
                                    type: "customer" as const,
                                    id: c.id
                                }))
                        );
                    }
                } else if (
                    audience.toUpperCase() === "LEADS"
                ) {

                    const { data: leads } =
                        await leadService.filterLeads(
                            companyId,
                            {
                                status: leadStatus,
                                preferred_location: city
                            }
                        );

                    if (leads) {

                        recipients.push(
                            ...leads
                                .filter(
                                    (l: any) =>
                                        l.customers?.phone &&
                                        String(l.customers.phone).trim() !== ""
                                )
                                .map((l: any) => ({
                                    phone:
                                        String(l.customers.phone).trim(),
                                    type: "lead" as const,
                                    id: l.id
                                }))
                        );
                    }
                }

                const seenPhones =
                    new Set<string>();

                const uniqueRecipients =
                    recipients.filter(
                        (r) => {

                            const normalized =
                                String(r.phone)
                                    .replace(/\D/g, "")
                                    .slice(-10);

                            if (
                                seenPhones.has(
                                    normalized
                                )
                            ) {

                                return false;
                            }

                            seenPhones.add(
                                normalized
                            );

                            return true;
                        }
                    );

                if (
                    uniqueRecipients.length ===
                    0
                ) {

                    return {

                        success: false,

                        code:
                            "BROADCAST_NO_RECIPIENTS",

                        message:
                            "No valid recipients found for the specified audience",

                        timestamp:
                            new Date()
                                .toISOString()

                    };
                }

                const { data: broadcast, error: broadcastError } =
                    await supabase
                        .from(
                            "broadcasts"
                        )
                        .insert({

                            company_id:
                                companyId,

                            created_by:
                                userId,

                            message_text:
                                messageText,

                            audience:
                                `${audience}${city ? ` (${city})` : ""}${leadStatus ? ` - ${leadStatus}` : ""}`,

                            status:
                                "Pending",

                            recipient_count:
                                uniqueRecipients.length

                        })
                        .select()
                        .single();

                if (
                    broadcastError ||
                    !broadcast
                ) {

                    console.error(
                        "[BROADCAST] Insert failed:",
                        broadcastError
                    );

                    return {

                        success: false,

                        code:
                            "BROADCAST_SAVE_FAILED",

                        message:
                            "Failed to create broadcast record",

                        timestamp:
                            new Date()
                                .toISOString()

                    };
                }

                const deliveryRecords: any[] = [];

                let sentCount = 0;

                let failedCount = 0;

                for (
                    const recipient of
                    uniqueRecipients
                ) {

                    try {

                        const sent =
                            await WhatsAppService.sendTextMessage(
                                recipient.phone,
                                messageText
                            );

                        deliveryRecords.push({

                            broadcast_id:
                                broadcast.id,

                            company_id:
                                companyId,

                            phone:
                                recipient.phone,

                            recipient_type:
                                recipient.type,

                            recipient_id:
                                recipient.id,

                            status:
                                sent
                                    ? "Sent"
                                    : "Failed",

                            error:
                                sent
                                    ? null
                                    : "Meta API dispatch failed",

                            sent_at:
                                sent
                                    ? new Date()
                                        .toISOString()
                                    : null

                        });

                        if (sent) {

                            sentCount++;
                        } else {

                            failedCount++;
                        }

                    } catch (sendError: any) {

                        deliveryRecords.push({

                            broadcast_id:
                                broadcast.id,

                            company_id:
                                companyId,

                            phone:
                                recipient.phone,

                            recipient_type:
                                recipient.type,

                            recipient_id:
                                recipient.id,

                            status:
                                "Failed",

                            error:
                                sendError?.message ||
                                "Send failed",

                            sent_at:
                                null

                        });

                        failedCount++;
                    }
                }

                if (
                    deliveryRecords.length >
                    0
                ) {

                    const { error: deliveryError } =
                        await supabase
                            .from(
                                "broadcast_recipients"
                            )
                            .insert(
                                deliveryRecords
                            );

                    if (
                        deliveryError
                    ) {

                        console.error(
                            "[BROADCAST] Delivery insert failed:",
                            deliveryError
                        );
                    }
                }

                const finalStatus =
                    failedCount ===
                    0
                        ? "Sent"
                        : sentCount > 0
                            ? "Partial"
                            : "Failed";

                const { error: updateError } =
                    await supabase
                        .from(
                            "broadcasts"
                        )
                        .update({

                            status:
                                finalStatus,

                            success_count:
                                sentCount,

                            failure_count:
                                failedCount,

                            completed_at:
                                new Date()
                                    .toISOString()

                        })
                        .eq(
                            "id",
                            broadcast.id
                        );

                if (
                    updateError
                ) {

                    console.error(
                        "[BROADCAST] Status update failed:",
                        updateError
                    );
                }

                return {

                    success:
                        sentCount >
                        0,

                    code:
                        "BROADCAST_SENT",

                    message:
                        `Broadcast sent to ${sentCount} recipients${failedCount > 0 ? `, ${failedCount} failed` : ""}`,

                    data: {

                        broadcast_id:
                            broadcast.id,

                        audience,
                        project_name:
                            projectName ||
                            null,
                        city:
                            city ||
                            null,
                        lead_status:
                            leadStatus ||
                            null,
                        message:
                            messageText,
                        recipient_count:
                            uniqueRecipients.length,
                        sent_count:
                            sentCount,
                        failed_count:
                            failedCount,
                        status:
                            finalStatus

                    },

                    timestamp:
                        new Date()
                            .toISOString()

                };

            } catch (error: any) {

                console.error(
                    "[BROADCAST] Error:",
                    error
                );

                return {

                    success: false,

                    code:
                        "BROADCAST_ERROR",

                    message:
                        error?.message ||
                        "Broadcast failed",

                    timestamp:
                        new Date()
                            .toISOString()

                };
            }

        case "CREATE_FOLLOWUP":

            return {

                success: false,

                code: "NOT_IMPLEMENTED",

                message:
                    "Follow-up creation is not yet implemented",

                timestamp:
                    new Date()
                    .toISOString()

            };


        // =============================================
        // GENERAL CHAT
        // =============================================

        case "GENERAL_CHAT":

            const userMessage =
                pick<string>(
                    params,
                    "message",
                    "text",
                    "query"
                ) ||
                intent.parameters?.message ||
                intent.parameters?.query ||
                intent.parameters?.text ||
                "Hello";



            const businessData =
                await handleBusinessQuestion(

                    userMessage,

                    companyId,

                    request.role

                );



            const conversationResponse =
             await generateConversationResponse({

                 message:
                     businessData
                         ?
                         `${userMessage}\n\nLive data from database:\n${businessData}`
                         :
                         userMessage,

                 companyId,

                 role: request.role as
                     | "ADMIN"
                     | "CUSTOMER"
                     | "ENGINEER"
                     | "SALES",

                 conversationHistory:
                     conversationHistory ||
                     []

             });

            return {

                type: "CHAT",

                message:
                    conversationResponse.message,

                mode:
                    conversationResponse.mode

            };



        default:

            return {

                success:false,

                message:
                "No tool available for this action"

            };



    }



}
