// =====================================================
// SHIVINFRA REPORTS MODULE - LOCAL E2E TEST
// Tests report generation with real Supabase data
// =====================================================

import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";
import { checkPermission } from "../backend/ai-engine/permissionChecker.ts";
import ReportService from "../backend/services/reportService.ts";
import { ReportDeliveryService } from "../backend/services/reportDeliveryService.ts";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";

async function testReportPermissions() {
    console.log("\n=== REPORT PERMISSIONS ===");

    const roles = ["ADMIN", "ENGINEER", "SALES", "CUSTOMER"];

    for (const role of roles) {
        const result = await checkPermission({ role, intent: "GENERATE_REPORT" });
        console.log(`${role}: ${result.allowed ? "ALLOWED" : "DENIED"} - ${result.reason}`);
    }
}

async function testProjectReportGeneration() {
    console.log("\n=== PROJECT REPORT GENERATION ===");

    try {
        const { data: projects, error } = await supabase
            .from("projects")
            .select("*")
            .eq("company_id", COMPANY_ID)
            .limit(10);

        if (error) {
            console.error("Error fetching projects:", error.message);
            return null;
        }

        console.log(`Fetched ${projects?.length || 0} projects from Supabase`);

        if (!projects || projects.length === 0) {
            console.log("No projects found - skipping PDF generation");
            return null;
        }

        const reportData = {
            title: "Project Report",
            items: projects.map((p: any) => ({
                name: p.project_name || "N/A",
                location: p.location || "N/A",
                price: p.price || 0,
                status: p.status || "N/A",
            })),
            columns: [
                { header: "Name", key: "name", width: 30 },
                { header: "Location", key: "location", width: 25 },
                { header: "Price", key: "price", width: 15 },
                { header: "Status", key: "status", width: 15 },
            ],
        };

        const filePath = await ReportService.generatePDF("Project_Report", reportData);
        console.log(`PDF generated: ${filePath}`);

        // Test Excel generation
        const excelPath = await ReportService.generateExcel(
            "Project_Report",
            reportData.columns,
            reportData.items
        );
        console.log(`Excel generated: ${excelPath}`);

        // Test Storage upload
        const uploadResult = await ReportDeliveryService.uploadReportToStorage(filePath, COMPANY_ID);
        console.log(`Storage upload: ${uploadResult.success ? "SUCCESS" : "FAILED"}`);
        if (uploadResult.publicUrl) {
            console.log(`Public URL: ${uploadResult.publicUrl}`);
        }

        return { filePath, excelPath, publicUrl: uploadResult.publicUrl };
    } catch (error: any) {
        console.error("Error generating project report:", error.message);
        return null;
    }
}

async function testBillReportGeneration() {
    console.log("\n=== BILL REPORT GENERATION ===");

    try {
        const { data: bills, error } = await supabase
            .from("bills")
            .select("*")
            .eq("company_id", COMPANY_ID)
            .limit(10);

        if (error) {
            console.error("Error fetching bills:", error.message);
            return null;
        }

        console.log(`Fetched ${bills?.length || 0} bills from Supabase`);

        if (!bills || bills.length === 0) {
            console.log("No bills found - skipping PDF generation");
            return null;
        }

        const reportData = {
            title: "Bill Report",
            items: bills.map((b: any) => ({
                vendor: b.vendor_name || "N/A",
                amount: b.amount || 0,
                date: b.bill_date || "N/A",
                status: b.payment_status || "N/A",
            })),
            columns: [
                { header: "Vendor", key: "vendor", width: 25 },
                { header: "Amount", key: "amount", width: 15 },
                { header: "Date", key: "date", width: 15 },
                { header: "Status", key: "status", width: 15 },
            ],
        };

        const filePath = await ReportService.generatePDF("Bill_Report", reportData);
        console.log(`PDF generated: ${filePath}`);

        return filePath;
    } catch (error: any) {
        console.error("Error generating bill report:", error.message);
        return null;
    }
}

async function testLeadReportGeneration() {
    console.log("\n=== LEAD REPORT GENERATION ===");

    try {
        const { data: leads, error } = await supabase
            .from("leads")
            .select("*")
            .eq("company_id", COMPANY_ID)
            .limit(10);

        if (error) {
            console.error("Error fetching leads:", error.message);
            return null;
        }

        console.log(`Fetched ${leads?.length || 0} leads from Supabase`);

        if (!leads || leads.length === 0) {
            console.log("No leads found - skipping PDF generation");
            return null;
        }

        const reportData = {
            title: "Lead Report",
            items: leads.map((l: any) => ({
                name: l.name || "N/A",
                phone: l.phone || "N/A",
                status: l.status || "N/A",
                budget: l.budget || 0,
            })),
            columns: [
                { header: "Name", key: "name", width: 30 },
                { header: "Phone", key: "phone", width: 15 },
                { header: "Status", key: "status", width: 15 },
                { header: "Budget", key: "budget", width: 15 },
            ],
        };

        const filePath = await ReportService.generatePDF("Lead_Report", reportData);
        console.log(`PDF generated: ${filePath}`);

        return filePath;
    } catch (error: any) {
        console.error("Error generating lead report:", error.message);
        return null;
    }
}

async function testNoDataScenario() {
    console.log("\n=== NO DATA SCENARIO ===");

    try {
        const reportData = {
            title: "Empty Report",
            items: [],
            columns: [
                { header: "Name", key: "name", width: 30 },
                { header: "Value", key: "value", width: 15 },
            ],
        };

        const filePath = await ReportService.generatePDF("Empty_Report", reportData);
        console.log(`Empty PDF generated: ${filePath}`);
        console.log("Note: Report generated with 0 records - user should be informed");
    } catch (error: any) {
        console.error("Error in no-data scenario:", error.message);
    }
}

async function main() {
    console.log("=====================================");
    console.log("SHIVINFRA REPORTS MODULE - E2E TEST");
    console.log("=====================================");

    // Test 1: Permissions
    await testReportPermissions();

    // Test 2: Project Report
    await testProjectReportGeneration();

    // Test 3: Bill Report
    await testBillReportGeneration();

    // Test 4: Lead Report
    await testLeadReportGeneration();

    // Test 5: No Data Scenario
    await testNoDataScenario();

    console.log("\n=====================================");
    console.log("REPORTS E2E TEST COMPLETE");
    console.log("=====================================");
}

main().catch(console.error);
