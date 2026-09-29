import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { supabaseAdmin as supabase } from "../config/supabase.ts";

export class DashboardController {
  static async getDashboard(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    const companyId = req.user!.company_id;
    const { from_date, to_date, project_id } = req.query;

    try {
      console.log("==================================");
      console.log("Dashboard Company ID:", companyId);
      console.log("Filters:", { from_date, to_date, project_id });

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const projectsQuery = supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);
      if (project_id) projectsQuery.eq("id", project_id as string);
      if (from_date) projectsQuery.gte("created_at", `${from_date}T00:00:00`);
      if (to_date) projectsQuery.lte("created_at", `${to_date}T23:59:59`);

      const projectsDataQuery = supabase
        .from("projects")
        .select("*")
        .eq("company_id", companyId);
      if (project_id) projectsDataQuery.eq("id", project_id as string);
      if (from_date) projectsDataQuery.gte("created_at", `${from_date}T00:00:00`);
      if (to_date) projectsDataQuery.lte("created_at", `${to_date}T23:59:59`);

      const customersQuery = supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      const leadsCountQuery = supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);
      if (project_id) leadsCountQuery.eq("project_id", project_id as string);
      if (from_date) leadsCountQuery.gte("created_at", `${from_date}T00:00:00`);
      if (to_date) leadsCountQuery.lte("created_at", `${to_date}T23:59:59`);

      const leadsDataQuery = supabase
        .from("leads")
        .select("*")
        .eq("company_id", companyId);
      if (project_id) leadsDataQuery.eq("project_id", project_id as string);
      if (from_date) leadsDataQuery.gte("created_at", `${from_date}T00:00:00`);
      if (to_date) leadsDataQuery.lte("created_at", `${to_date}T23:59:59`);

      const billsCountQuery = supabase
        .from("bills")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);
      if (project_id) billsCountQuery.eq("project_id", project_id as string);
      if (from_date) billsCountQuery.gte("bill_date", from_date as string);
      if (to_date) billsCountQuery.lte("bill_date", to_date as string);

      const billsDataQuery = supabase
        .from("bills")
        .select("*")
        .eq("company_id", companyId);
      if (project_id) billsDataQuery.eq("project_id", project_id as string);
      if (from_date) billsDataQuery.gte("bill_date", from_date as string);
      if (to_date) billsDataQuery.lte("bill_date", to_date as string);

      const expensesCountQuery = supabase
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);
      if (project_id) expensesCountQuery.eq("project_id", project_id as string);
      if (from_date) expensesCountQuery.gte("expense_date", from_date as string);
      if (to_date) expensesCountQuery.lte("expense_date", to_date as string);

      const expensesDataQuery = supabase
        .from("expenses")
        .select("*")
        .eq("company_id", companyId);
      if (project_id) expensesDataQuery.eq("project_id", project_id as string);
      if (from_date) expensesDataQuery.gte("expense_date", from_date as string);
      if (to_date) expensesDataQuery.lte("expense_date", to_date as string);

      const recentProjectsQuery = supabase
        .from("projects")
        .select("*")
        .eq("company_id", companyId);
      if (project_id) recentProjectsQuery.eq("id", project_id as string);
      if (from_date) recentProjectsQuery.gte("created_at", `${from_date}T00:00:00`);
      if (to_date) recentProjectsQuery.lte("created_at", `${to_date}T23:59:59`);
      recentProjectsQuery.order("created_at", { ascending: false }).limit(5);

      const recentBillsQuery = supabase
        .from("bills")
        .select("*")
        .eq("company_id", companyId);
      if (project_id) recentBillsQuery.eq("project_id", project_id as string);
      if (from_date) recentBillsQuery.gte("bill_date", from_date as string);
      if (to_date) recentBillsQuery.lte("bill_date", to_date as string);
      recentBillsQuery.order("created_at", { ascending: false }).limit(5);

      const [
        projectsCountRes,
        projectsDataRes,
        customersCountRes,
        leadsCountRes,
        leadsDataRes,
        billsCountRes,
        billsDataRes,
        expensesCountRes,
        expensesDataRes,
        recentProjectsRes,
        recentBillsRes,
        activitiesRes,
        siteVisitsRes,
      ] = await Promise.all([
        projectsQuery,
        projectsDataQuery,
        customersQuery,
        leadsCountQuery,
        leadsDataQuery,
        billsCountQuery,
        billsDataQuery,
        expensesCountQuery,
        expensesDataQuery,
        recentProjectsQuery,
        recentBillsQuery,
        supabase.from("activity_logs").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(5),
        supabase.from("site_visits").select("*", { count: "exact", head: true }).eq("company_id", companyId).gte("visit_date", todayStart.toISOString()).lt("visit_date", todayEnd.toISOString()),
      ]);

      if (projectsCountRes.error) throw projectsCountRes.error;
      if (projectsDataRes.error) throw projectsDataRes.error;
      if (customersCountRes.error) throw customersCountRes.error;
      if (leadsCountRes.error) throw leadsCountRes.error;
      if (leadsDataRes.error) throw leadsDataRes.error;
      if (billsCountRes.error) throw billsCountRes.error;
      if (billsDataRes.error) throw billsDataRes.error;
      if (expensesCountRes.error) throw expensesCountRes.error;
      if (expensesDataRes.error) throw expensesDataRes.error;
      if (recentProjectsRes.error) throw recentProjectsRes.error;
      if (recentBillsRes.error) throw recentBillsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;

      const todaysSiteVisits = siteVisitsRes.error ? 0 : (siteVisitsRes.count ?? 0);

      const totalRevenue = (billsDataRes.data ?? []).reduce(
        (sum, bill) => sum + Number(String(bill.amount ?? 0).replace(/[^0-9.-]+/g, "") || 0),
        0
      );

      const totalExpenses = (expensesDataRes.data ?? []).reduce(
        (sum, expense) => sum + Number(String(expense.amount ?? 0).replace(/[^0-9.-]+/g, "") || 0),
        0
      );

      const projectsByStatus = (() => {
        const buckets: Record<string, number> = {};
        for (const project of projectsDataRes.data ?? []) {
          const status = (project.status || "Unknown").toString().trim() || "Unknown";
          buckets[status] = (buckets[status] ?? 0) + 1;
        }
        return buckets;
      })();

      const billsByPaymentStatus = (() => {
        const buckets: Record<string, number> = { Paid: 0, Pending: 0, Cancelled: 0 };
        for (const bill of billsDataRes.data ?? []) {
          const status = (bill.payment_status || "Pending").toString().trim();
          buckets[status] = (buckets[status] ?? 0) + Number(bill.amount ?? 0);
        }
        return buckets;
      })();

      const leadStatusBreakdown = (() => {
        const buckets: Record<string, number> = {};
        for (const lead of leadsDataRes.data ?? []) {
          const status = (lead.status || "Unknown").toString().trim() || "Unknown";
          buckets[status] = (buckets[status] ?? 0) + 1;
        }
        return Object.entries(buckets).map(([name, value]) => ({ name, value }));
      })();

      const leadFlow = (() => {
        const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const buckets: Record<string, { name: string; "New Leads": number; "Interested Leads": number }> = {};
        for (const lead of leadsDataRes.data ?? []) {
          const created = lead.created_at ? new Date(lead.created_at) : null;
          if (!created || isNaN(created.getTime())) continue;
          const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
          if (!buckets[key]) {
            buckets[key] = { name: `${created.getDate()} ${monthNames[created.getMonth()]}`, "New Leads": 0, "Interested Leads": 0 };
          }
          const status = (lead.status || "").toString().toLowerCase();
          if (status.includes("new")) buckets[key]["New Leads"] += 1;
          else if (status.includes("interest")) buckets[key]["Interested Leads"] += 1;
        }
        return Object.values(buckets).sort((a, b) => a.name.localeCompare(b.name));
      })();

      const expenseByCategory = (() => {
        const buckets: Record<string, number> = {};
        for (const expense of expensesDataRes.data ?? []) {
          const category = (expense.expense_category || expense.category || "General").toString().trim() || "General";
          const amount = Number(String(expense.amount ?? 0).replace(/[^0-9.-]+/g, "") || 0);
          buckets[category] = (buckets[category] ?? 0) + amount;
        }
        return Object.entries(buckets).map(([name, amount]) => ({ name, amount }));
      })();

      console.log("Projects :", projectsCountRes.count);
      console.log("Customers:", customersCountRes.count);
      console.log("Leads    :", leadsCountRes.count);
      console.log("Bills    :", billsCountRes.count);
      console.log("Revenue  :", totalRevenue);
      console.log("Expenses :", totalExpenses);
      console.log("SiteVisits(today):", todaysSiteVisits);
      console.log("==================================");

      return res.status(200).json({
        success: true,
        data: {
          projects: projectsCountRes.count ?? 0,
          projects_by_status: projectsByStatus,
          customers: customersCountRes.count ?? 0,
          leads: leadsCountRes.count ?? 0,
          bills: billsCountRes.count ?? 0,
          bills_total: totalRevenue,
          bills_paid: billsByPaymentStatus.Paid,
          bills_pending: billsByPaymentStatus.Pending,
          bills_cancelled: billsByPaymentStatus.Cancelled,
          expenses: expensesCountRes.count ?? 0,
          expenses_total: totalExpenses,
          total_outflow: totalRevenue + totalExpenses,
          revenue: totalRevenue,
          todaysSiteVisits,

          recentProjects: recentProjectsRes.data ?? [],
          recentBills: recentBillsRes.data ?? [],
          activities: activitiesRes.data ?? [],
          leadStatusBreakdown,
          leadFlow,
          expenseByCategory,
        },
      });
    } catch (err) {
      console.error("Dashboard Error:", err);
      next(err);
    }
  }
}

export default DashboardController;
