import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { supabaseAdmin as supabase, isSupabaseConfigured } from "../config/supabase.ts";
import { mockCompanies } from "../database/mockDB.ts";

export class SubscriptionController {
  /**
   * Fetches the current subscription state of the active tenant
   */
  static async getSubscription(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user!.company_id;

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from("companies")
          .select("id, company_name, subscription_plan, subscription_status, created_at, updated_at")
          .eq("id", companyId)
          .single();

        if (error || !data) {
          return res.status(404).json({ success: false, error: "Tenant metadata not found." });
        }
        return res.status(200).json({ success: true, data });
      } else {
        const company = mockCompanies.find((c) => c.id === companyId);
        if (!company) {
          return res.status(404).json({ success: false, error: "Tenant metadata not found." });
        }

        return res.status(200).json({
          success: true,
          data: {
            id: company.id,
            company_name: company.company_name,
            subscription_plan: company.subscription_plan,
            subscription_start: company.created_at,
            subscription_end: "2030-01-01T00:00:00Z", // Simulation Lifetime
            status: company.status,
          },
        });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Upgrades subscription level
   */
  static async renewSubscription(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user!.company_id;
    const { plan } = req.body; // 'Professional' | 'Enterprise' | 'Lifetime'

    if (!["Starter", "Professional", "Enterprise", "Lifetime"].includes(plan)) {
      return res.status(400).json({ success: false, error: "Invalid subscription tier." });
    }

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from("companies")
          .update({
            subscription_plan: plan,
            subscription_end: plan === "Lifetime" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", companyId)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json({ success: true, message: `Upgraded to ${plan} subscription successfully.`, data });
      } else {
        const company = mockCompanies.find((c) => c.id === companyId);
        if (company) {
          company.subscription_plan = plan;
        }
        return res.status(200).json({
          success: true,
          message: `Upgraded to ${plan} simulation subscription tier.`,
          plan,
        });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
export default SubscriptionController;
