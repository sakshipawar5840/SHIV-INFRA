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
import { generateConversationResponse } from "./conversationEngine";


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
                ) || "",

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

            return await leadService.createLead({

                company_id:companyId,

                customer_id:
                pick<string | null>(
                    params,
                    "customer_id"
                ),

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


        case "SEARCH_LEADS":

            return await leadService.getLeads(
                companyId
            );


        case "UPDATE_LEAD":

            return await leadService.updateLead(

                pick<string>(params, "id", "lead_id"),

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

            return await leadService.deleteLead(

                pick<string>(params, "id", "lead_id"),

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

            return await billService.searchBills(
                companyId
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
        // REPORT
        // =============================================

        case "GENERATE_REPORT":

            return {

                status:"REPORT_PENDING",

                message:
                "Report generation service will execute"

            };


        // =============================================
        // GENERAL CHAT
        // =============================================

        case "GENERAL_CHAT":

            const conversationResponse =
             await generateConversationResponse({

                message:
                    pick<string>(
                        params,
                        "message",
                        "text",
                        "query"
                    ) ||
                    intent.parameters?.message ||
                    intent.parameters?.query ||
                    intent.parameters?.text ||
                    "Hello",

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
