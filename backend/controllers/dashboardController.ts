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

    try {
      console.log("==================================");
      console.log("Dashboard Company ID:", companyId);

      const [
        projects,
        customers,
        leads,
        bills,
        expenses,
        recentProjects,
        recentBills,
        activities,
      ] = await Promise.all([

        supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId),

        supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId),

        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId),

        supabase
          .from("bills")
          .select("*")
          .eq("company_id", companyId),

        supabase
          .from("expenses")
          .select("*")
          .eq("company_id", companyId),

        supabase
          .from("projects")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(5),

        supabase
          .from("bills")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(5),

        supabase
          .from("activity_logs")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (projects.error) throw projects.error;
      if (customers.error) throw customers.error;
      if (leads.error) throw leads.error;
      if (bills.error) throw bills.error;
      if (expenses.error) throw expenses.error;
      if (recentProjects.error) throw recentProjects.error;
      if (recentBills.error) throw recentBills.error;
      if (activities.error) throw activities.error;

      const totalRevenue = (bills.data ?? []).reduce(
        (sum, bill) => sum + Number(bill.amount ?? 0),
        0
      );

      const totalExpenses = (expenses.data ?? []).reduce(
        (sum, expense) => sum + Number(expense.amount ?? 0),
        0
      );

      console.log("Projects :", projects.count);
      console.log("Customers:", customers.count);
      console.log("Leads    :", leads.count);
      console.log("Bills    :", bills.data?.length ?? 0);
      console.log("Revenue  :", totalRevenue);
      console.log("Expenses :", totalExpenses);
      console.log("==================================");

      return res.status(200).json({
        success: true,
        data: {
          projects: projects.count ?? 0,
          customers: customers.count ?? 0,
          leads: leads.count ?? 0,
          bills: bills.data?.length ?? 0,
          expenses: totalExpenses,
          revenue: totalRevenue,

          recentProjects: recentProjects.data ?? [],
          recentBills: recentBills.data ?? [],
          activities: activities.data ?? [],
        },
      });
    } catch (err) {
      console.error("Dashboard Error:", err);
      next(err);
    }
  }
}

export default DashboardController;