import { supabaseAdmin as supabase } from "../config/supabase.ts";

// ---------------------------------------------------------------------------
// Live `settings` table contract (verified against production schema).
// Columns that actually exist:
//   id, company_id, whatsapp_enabled, meta_phone_id, meta_access_token,
//   openai_key_override, google_drive_folder_id, google_calendar_id,
//   alert_email, created_at, updated_at
//
// NOTE: `settings_data` does NOT exist in the live table. It was removed
// from this service so updates no longer reference a non-existent column.
// ---------------------------------------------------------------------------

export interface SettingItem {
  id: string;
  company_id: string;
  whatsapp_enabled: boolean;
  meta_phone_id?: string;
  meta_access_token?: string;
  openai_key_override?: string;
  google_drive_folder_id?: string;
  google_calendar_id?: string;
  alert_email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SettingUpdateInput {
  whatsapp_enabled?: boolean;
  meta_phone_id?: string;
  meta_access_token?: string;
  openai_key_override?: string;
  google_drive_folder_id?: string;
  google_calendar_id?: string;
  alert_email?: string;
}

export interface ServiceResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class SettingService {
  async getByCompany(companyId: string): Promise<ServiceResponse> {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("company_id", companyId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    if (!data) {
      const { data: newData, error: insertError } = await supabase
        .from("settings")
        .insert({ company_id: companyId, whatsapp_enabled: true, alert_email: "shivinfra55@gmail.com" })
        .select()
        .single();
      if (insertError) throw insertError;
      return { success: true, message: "Settings created", data: newData };
    }

    // Never expose secrets back to the frontend.
    const sanitized = { ...data };
    delete sanitized.meta_access_token;
    delete sanitized.openai_key_override;

    return { success: true, message: "Settings retrieved", data: sanitized };
  }

  async update(companyId: string, input: SettingUpdateInput): Promise<ServiceResponse> {
    // Only map fields that the live `settings` table actually supports.
    const payload: any = {};
    if (input.whatsapp_enabled !== undefined) payload.whatsapp_enabled = input.whatsapp_enabled;
    if (input.meta_phone_id !== undefined) payload.meta_phone_id = input.meta_phone_id;
    if (input.meta_access_token !== undefined) payload.meta_access_token = input.meta_access_token;
    if (input.openai_key_override !== undefined) payload.openai_key_override = input.openai_key_override;
    if (input.google_drive_folder_id !== undefined) payload.google_drive_folder_id = input.google_drive_folder_id;
    if (input.google_calendar_id !== undefined) payload.google_calendar_id = input.google_calendar_id;
    if (input.alert_email !== undefined) payload.alert_email = input.alert_email;

    // Guard: an empty payload causes PostgREST to error with PGRST116.
    if (Object.keys(payload).length === 0) {
      const { data: current } = await supabase
        .from("settings")
        .select("*")
        .eq("company_id", companyId)
        .single();
      const sanitized = { ...current };
      delete sanitized.meta_access_token;
      delete sanitized.openai_key_override;
      return { success: true, message: "No changes", data: sanitized };
    }

    const { data, error } = await supabase
      .from("settings")
      .update(payload)
      .eq("company_id",companyId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, message: "Settings updated", data };
  }
}

export const settingService = new SettingService();