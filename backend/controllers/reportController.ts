import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { supabaseAdmin as supabase, isSupabaseConfigured } from "../config/supabase.ts";
import { ReportService } from "../services/reportService.ts";

export class ReportController {
  static async getFinancialSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const companyId = req.user!.company_id;
    const { from_date, to_date, project_id } = req.query;

    try {
      let billsQuery = supabase
        .from("bills")
        .select("project_id, amount, payment_status, bill_date")
        .eq("company_id", companyId);

      let expensesQuery = supabase
        .from("expenses")
        .select("project_id, amount, payment_method, expense_date")
        .eq("company_id", companyId);

      if (from_date) {
        billsQuery = billsQuery.gte("bill_date", from_date as string);
        expensesQuery = expensesQuery.gte("expense_date", from_date as string);
      }
      if (to_date) {
        billsQuery = billsQuery.lte("bill_date", to_date as string);
        expensesQuery = expensesQuery.lte("expense_date", to_date as string);
      }
      if (project_id) {
        billsQuery = billsQuery.eq("project_id", project_id as string);
        expensesQuery = expensesQuery.eq("project_id", project_id as string);
      }

      const [billsRes, expensesRes, projectsRes] = await Promise.all([
        billsQuery,
        expensesQuery,
        supabase.from("projects").select("id, project_name, location").eq("company_id", companyId),
      ]);

      if (billsRes.error) throw billsRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (projectsRes.error) throw projectsRes.error;

      const bills = billsRes.data || [];
      const expenses = expensesRes.data || [];
      const projects = projectsRes.data || [];

      const projectMap = new Map(projects.map(p => [p.id, p]));

      const summary = projects.map(proj => {
        const projBills = bills.filter(b => b.project_id === proj.id);
        const projExpenses = expenses.filter(e => e.project_id === proj.id);
        const billsTotal = projBills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
        const expensesTotal = projExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        return {
          project_id: proj.id,
          project_name: proj.project_name,
          location: proj.location,
          bill_count: projBills.length,
          expense_count: projExpenses.length,
          bills_total: billsTotal,
          expenses_total: expensesTotal,
          total_outflow: billsTotal + expensesTotal,
        };
      });

      const totals = {
        bill_count: bills.length,
        expense_count: expenses.length,
        bills_total: bills.reduce((sum, b) => sum + Number(b.amount || 0), 0),
        expenses_total: expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
        total_outflow: bills.reduce((sum, b) => sum + Number(b.amount || 0), 0) + expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
      };

      return res.json({ success: true, data: { summary, totals, filters: { from_date, to_date, project_id } } });
    } catch (err) {
      next(err);
    }
  }

  static async getBillsReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const companyId = req.user!.company_id;
    const { from_date, to_date, project_id, payment_status } = req.query;

    try {
      let query = supabase
        .from("bills")
        .select("*")
        .eq("company_id", companyId);

      if (from_date) query = query.gte("bill_date", from_date as string);
      if (to_date) query = query.lte("bill_date", to_date as string);
      if (project_id) query = query.eq("project_id", project_id as string);
      if (payment_status) query = query.eq("payment_status", payment_status as string);

      const { data, error } = await query.order("bill_date", { ascending: false });

      if (error) throw error;

      const bills = data || [];
      const totals = {
        count: bills.length,
        total_amount: bills.reduce((sum, b) => sum + Number(b.amount || 0), 0),
        paid_amount: bills.filter(b => b.payment_status === "Paid").reduce((sum, b) => sum + Number(b.amount || 0), 0),
        pending_amount: bills.filter(b => b.payment_status === "Pending").reduce((sum, b) => sum + Number(b.amount || 0), 0),
        cancelled_amount: bills.filter(b => b.payment_status === "Cancelled").reduce((sum, b) => sum + Number(b.amount || 0), 0),
      };

      return res.json({ success: true, data: { bills, totals, filters: { from_date, to_date, project_id, payment_status } } });
    } catch (err) {
      next(err);
    }
  }

  static async getExpensesReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const companyId = req.user!.company_id;
    const { from_date, to_date, project_id, category } = req.query;

    try {
      let query = supabase
        .from("expenses")
        .select("*")
        .eq("company_id", companyId);

      if (from_date) query = query.gte("expense_date", from_date as string);
      if (to_date) query = query.lte("expense_date", to_date as string);
      if (project_id) query = query.eq("project_id", project_id as string);
      if (category) query = query.or(`expense_category.ilike.%${category}%,category.ilike.%${category}%`);

      const { data, error } = await query.order("expense_date", { ascending: false });

      if (error) throw error;

      const expenses = data || [];
      const totals = {
        count: expenses.length,
        total_amount: expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
      };

      const byCategory = expenses.reduce((acc: any, e) => {
        const cat = e.expense_category || e.category || "General";
        acc[cat] = (acc[cat] || 0) + Number(e.amount || 0);
        return acc;
      }, {});

      const byProject = expenses.reduce((acc: any, e) => {
        const pid = e.project_id || "unassigned";
        acc[pid] = (acc[pid] || 0) + Number(e.amount || 0);
        return acc;
      }, {});

      return res.json({ success: true, data: { expenses, totals, by_category: byCategory, by_project: byProject, filters: { from_date, to_date, project_id, category } } });
    } catch (err) {
      next(err);
    }
  }

  static async getProjectFinancial(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const companyId = req.user!.company_id;
    const { project_id } = req.params;

    try {
      const [projectRes, billsRes, expensesRes] = await Promise.all([
        supabase.from("projects").select("id, project_name, location").eq("id", project_id).eq("company_id", companyId).maybeSingle(),
        supabase.from("bills").select("*").eq("project_id", project_id).eq("company_id", companyId),
        supabase.from("expenses").select("*").eq("project_id", project_id).eq("company_id", companyId),
      ]);

      if (projectRes.error) throw projectRes.error;
      if (billsRes.error) throw billsRes.error;
      if (expensesRes.error) throw expensesRes.error;

      const project = projectRes.data;
      const bills = billsRes.data || [];
      const expenses = expensesRes.data || [];

      const billsTotal = bills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
      const expensesTotal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      return res.json({
        success: true,
        data: {
          project,
          bills_count: bills.length,
          expenses_count: expenses.length,
          bills_total: billsTotal,
          expenses_total: expensesTotal,
          combined_total: billsTotal + expensesTotal,
          bills,
          expenses,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async generateReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const companyId = req.user!.company_id;
    const { type, format, from_date, to_date, project_id, payment_status, category } = req.query;

    try {
      let rawData: any[] = [];
      let title = "SHIVINFRA Operational Audit Report";
      let columns: any[] = [];
      let filename = "";

      if (type === "FinancialSummary") {
        title = "Project Financial Summary Report";
        const [billsRes, expensesRes, projectsRes] = await Promise.all([
          supabase.from("bills").select("project_id, amount, payment_status, bill_date, vendor_name, material_name, quantity, unit, gst_amount, bill_number, remarks").eq("company_id", companyId),
          supabase.from("expenses").select("project_id, amount, payment_method, expense_date, expense_title, category, vendor, remarks").eq("company_id", companyId),
          supabase.from("projects").select("id, project_name, location").eq("company_id", companyId),
        ]);
        if (billsRes.error) throw billsRes.error;
        if (expensesRes.error) throw expensesRes.error;
        if (projectsRes.error) throw projectsRes.error;

        const projectMap = new Map((projectsRes.data || []).map((p: any) => [p.id, p]));
        rawData = (projectsRes.data || []).map((proj: any) => {
          const projBills = (billsRes.data || []).filter((b: any) => b.project_id === proj.id);
          const projExpenses = (expensesRes.data || []).filter((e: any) => e.project_id === proj.id);
          const billsTotal = projBills.reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0);
          const expensesTotal = projExpenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
          return {
            id: proj.id,
            project_name: proj.project_name,
            location: proj.location,
            bill_count: projBills.length,
            expense_count: projExpenses.length,
            bills_total: billsTotal,
            expenses_total: expensesTotal,
            total_outflow: billsTotal + expensesTotal,
          };
        });

        columns = [
          { header: "Project Name", key: "project_name", width: 30 },
          { header: "Location", key: "location", width: 25 },
          { header: "Bill Count", key: "bill_count", width: 12 },
          { header: "Expense Count", key: "expense_count", width: 14 },
          { header: "Bills Total (INR)", key: "bills_total", width: 18 },
          { header: "Expenses Total (INR)", key: "expenses_total", width: 20 },
          { header: "Total Outflow (INR)", key: "total_outflow", width: 20 },
        ];
        filename = "SHIVINFRA_FINANCIAL_REPORT.xlsx";
      } else if (type === "Bills") {
        title = "Procurement Bills Report";
        let query = supabase.from("bills").select("*").eq("company_id", companyId);
        if (from_date) query = query.gte("bill_date", from_date as string);
        if (to_date) query = query.lte("bill_date", to_date as string);
        if (project_id) query = query.eq("project_id", project_id as string);
        if (payment_status) query = query.eq("payment_status", payment_status as string);
        const { data, error } = await query.order("bill_date", { ascending: false });
        if (error) throw error;
        rawData = data || [];
        columns = [
          { header: "Bill Number", key: "bill_number", width: 20 },
          { header: "Date", key: "bill_date", width: 14 },
          { header: "Project ID", key: "project_id", width: 36 },
          { header: "Vendor", key: "vendor_name", width: 25 },
          { header: "Material", key: "material_name", width: 25 },
          { header: "Qty", key: "quantity", width: 10 },
          { header: "Unit", key: "unit", width: 10 },
          { header: "GST", key: "gst_amount", width: 12 },
          { header: "Amount", key: "amount", width: 15 },
          { header: "Status", key: "payment_status", width: 14 },
          { header: "Remarks", key: "remarks", width: 30 },
        ];
        filename = "SHIVINFRA_BILLS_REPORT.xlsx";
      } else if (type === "Expenses") {
        title = "Expenses Report";
        let query = supabase.from("expenses").select("*").eq("company_id", companyId);
        if (from_date) query = query.gte("expense_date", from_date as string);
        if (to_date) query = query.lte("expense_date", to_date as string);
        if (project_id) query = query.eq("project_id", project_id as string);
        if (category) query = query.or(`expense_category.ilike.%${category}%,category.ilike.%${category}%`);
        const { data, error } = await query.order("expense_date", { ascending: false });
        if (error) throw error;
        rawData = data || [];
        columns = [
          { header: "Title", key: "expense_title", width: 30 },
          { header: "Category", key: "expense_category", width: 18 },
          { header: "Project ID", key: "project_id", width: 36 },
          { header: "Vendor", key: "vendor", width: 20 },
          { header: "Amount", key: "amount", width: 15 },
          { header: "Date", key: "expense_date", width: 14 },
          { header: "Payment Method", key: "payment_method", width: 16 },
          { header: "Remarks", key: "remarks", width: 30 },
        ];
        filename = "SHIVINFRA_EXPENSES_REPORT.xlsx";
      } else {
        return res.status(400).json({ success: false, error: "Unsupported report type." });
      }

      const reportName = `${type || "Ledger"}_Report_${Date.now()}`;
      const normalizedFormat = typeof format === "string" ? format.toLowerCase() : "";

      if (normalizedFormat === "excel") {
        const filePath = await ReportService.generateExcel(reportName, columns, rawData);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        return res.download(filePath);
      }

      if (normalizedFormat === "pdf") {
        const filePath = await ReportService.generatePDF(reportName, {
          title,
          items: rawData,
          columns,
          filters: { from_date, to_date, project_id, payment_status, category },
        });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${reportName}.pdf`);
        return res.download(filePath);
      }

      if (normalizedFormat === "csv") {
        const csvString = ReportService.generateCSV(columns, rawData);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=${reportName}.csv`);
        return res.status(200).send(csvString);
      }

      return res.status(400).json({ success: false, error: "Unsupported format requested." });
    } catch (err) {
      next(err);
    }
  }
}
export default ReportController;
