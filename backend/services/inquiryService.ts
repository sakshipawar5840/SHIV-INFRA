import { supabaseAdmin as supabase } from "../config/supabase.ts";

export interface InquiryItem {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  project: string;
  location: string;
  budget: number;
  requirement: string;
  status: string;
  replied: boolean;
  interest_level: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface InquiryCreateInput {
  name: string;
  phone: string;
  project: string;
  location: string;
  budget: number;
  requirement: string;
  interest_level?: string;
  notes?: string;
}

export interface InquiryUpdateInput {
  name?: string;
  phone?: string;
  project?: string;
  location?: string;
  budget?: number;
  requirement?: string;
  status?: string;
  replied?: boolean;
  interest_level?: string;
  notes?: string;
}

export interface ServiceResponse {
  success: boolean;
  message: string;
  data?: any;
  count?: number;
}

export class InquiryService {
  async list(companyId: string, query?: string): Promise<ServiceResponse> {
    let q = supabase
      .from("inquiries")
      .select("*", { count: "exact" })
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (query) {
      q = q.or(`name.ilike.%${query}%,phone.ilike.%${query}%,project.ilike.%${query}%,location.ilike.%${query}%`);
    }

    const { data, error, count } = await q;
    if (error) throw error;
    return { success: true, message: "Inquiries retrieved", data: data || [], count: count || 0 };
  }

  async getById(id: string, companyId: string): Promise<InquiryItem | null> {
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .single();

    if (error || !data) return null;
    return data as InquiryItem;
  }

  async create(companyId: string, input: InquiryCreateInput): Promise<ServiceResponse> {
    const payload: any = {
      company_id: companyId,
      name: input.name,
      phone: input.phone,
      project: input.project,
      location: input.location,
      budget: Number(input.budget),
      requirement: input.requirement,
      status: "New",
      notes: input.notes || null,
    };

    const { data, error } = await supabase
      .from("inquiries")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return { success: true, message: "Inquiry created", data };
  }

  async update(id: string, companyId: string, input: InquiryUpdateInput): Promise<ServiceResponse> {
    const payload: any = {};
    if (input.name !== undefined) payload.name = input.name;
    if (input.phone !== undefined) payload.phone = input.phone;
    if (input.project !== undefined) payload.project = input.project;
    if (input.location !== undefined) payload.location = input.location;
    if (input.budget !== undefined) payload.budget = Number(input.budget);
    if (input.requirement !== undefined) payload.requirement = input.requirement;
    if (input.status !== undefined) payload.status = input.status;
    if (input.replied !== undefined) payload.replied = input.replied;
    if (input.interest_level !== undefined) payload.interest_level = input.interest_level;
    if (input.notes !== undefined) payload.notes = input.notes;

    const { data, error } = await supabase
      .from("inquiries")
      .update(payload)
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .select()
      .single();

    if (error) throw error;
    if (!data) return { success: false, message: "Inquiry not found" };
    return { success: true, message: "Inquiry updated", data };
  }

  async delete(id: string, companyId: string): Promise<ServiceResponse> {
    const { data, error } = await supabase
      .from("inquiries")
      .update({ is_deleted: true })
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .select()
      .single();

    if (error) throw error;
    if (!data) return { success: false, message: "Inquiry not found" };
    return { success: true, message: "Inquiry deleted", data };
  }
}

export const inquiryService = new InquiryService();
