import { supabaseAdmin as supabase } from "../config/supabase.ts";

export interface ActivityLog {
  id: string;
  company_id: string;
  user_id?: string;
  user_email?: string;
  action_type: string;
  details: string;
  ip_address?: string;
  created_at?: string;
}

export interface ActivityLogCreateInput {
  company_id: string;
  user_id?: string;
  user_email?: string;
  action_type: string;
  details: string;
  ip_address?: string;
}

export interface ServiceResponse {
  success: boolean;
  message: string;
  data?: any;
  count?: number;
}

export class ActivityLogService {
  async list(companyId: string, query?: string, limit = 100): Promise<ServiceResponse> {
    let q = supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (query) {
      q = q.or(`action.ilike.%${query}%,description.ilike.%${query}%,module.ilike.%${query}%`);
    }

    const { data, error, count } = await q;
    if (error) throw error;
    return { success: true, message: "Activity logs retrieved", data: data || [], count: count || 0 };
  }

  async create(input: ActivityLogCreateInput): Promise<ServiceResponse> {
    // Map application fields to actual production schema columns:
    // action_type -> action
    // details -> description
    // user_email -> embedded in description
    const description = input.user_email
      ? `${input.details} (by ${input.user_email})`
      : input.details;
    const { data, error } = await supabase
      .from("activity_logs")
      .insert({
        company_id: input.company_id,
        user_id: input.user_id,
        action: input.action_type,
        module: "system",
        description,
        ip_address: input.ip_address,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, message: "Activity log created", data };
  }
}

export const activityLogService = new ActivityLogService();
