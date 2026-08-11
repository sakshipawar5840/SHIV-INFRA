import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { supabaseAdmin as supabase, isSupabaseConfigured } from "../config/supabase.ts";
import { mockExpenses, mockProjects, mockLeads } from "../database/mockDB.ts";
import { ReportService } from "../services/reportService.ts";

export class ReportController {
  /**
   * Triggers file compilations and downloads
   */
  static async generateReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { type, format } = req.query; // type: 'Finance' | 'Leads' | 'Projects', format: 'PDF' | 'Excel' | 'CSV'
    const companyId = req.user!.company_id;

    try {
      let rawData: any[] = [];
      let title = "SHIVINFRA Operational Audit Report";

      // 1. Gather Dataset
      if (type === "Finance") {
        title = "Corporate Procurement & Labor Expense Ledger";
        if (isSupabaseConfigured) {
          const { data } = await supabase.from("expenses").select("*").eq("company_id", companyId);
          rawData = data || [];
        } else {
          rawData = mockExpenses.filter((e) => e.company_id === companyId);
        }
      } else if (type === "Leads") {
        title = "CRM Inquiries and Leads Funnel Metrics";
        if (isSupabaseConfigured) {
          const { data } = await supabase.from("leads").select("*").eq("company_id", companyId);
          rawData = data || [];
        } else {
          rawData = mockLeads.filter((l) => l.company_id === companyId);
        }
      } else {
        title = "SaaS Infrastructure Site Valuation Audits";
        if (isSupabaseConfigured) {
          const { data } = await supabase.from("projects").select("*").eq("company_id", companyId);
          rawData = data || [];
        } else {
          rawData = mockProjects.filter((p) => p.company_id === companyId);
        }
      }

      // 2. Generate and stream format
      const reportName = `${type || "Ledger"}_Report_${Date.now()}`;

      if (format === "PDF") {
        const filePath = await ReportService.generatePDF(reportName, {
          title,
          items: rawData,
        });
        return res.download(filePath);
      }

      if (format === "Excel") {
        const columns = [
          { header: "Entity ID", key: "id", width: 36 },
          { header: "Description / Name", key: "name", width: 25 },
          { header: "Category / Valuation", key: "amount", width: 18 },
          { header: "Date Registered", key: "created_at", width: 22 },
        ];

        // Format raw values to flat items
        const formatted = rawData.map((item) => ({
          id: item.id,
          name: item.name || item.vendor || item.category || "General Unit",
          amount: item.price || item.amount || 0,
          created_at: item.created_at || item.expense_date || new Date().toISOString(),
        }));

        const filePath = await ReportService.generateExcel(reportName, columns, formatted);
        return res.download(filePath);
      }

      if (format === "CSV") {
        const columns = [
          { header: "ID", key: "id" },
          { header: "Name", key: "name" },
          { header: "Valuation", key: "amount" },
        ];

        const formatted = rawData.map((item) => ({
          id: item.id,
          name: item.name || item.vendor || item.category || "General Unit",
          amount: item.price || item.amount || 0,
        }));

        const csvString = ReportService.generateCSV(columns, formatted);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=${reportName}.csv`);
        return res.status(200).send(csvString);
      }

      return res.status(400).json({ success: false, error: "Unsupported report generation formats requested." });
    } catch (err) {
      next(err);
    }
  }
}
export default ReportController;
