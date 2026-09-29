import { supabaseAdmin as supabase } from "../config/supabase.ts";

export interface Vendor {
  id: string;
  company_id: string;
  vendor_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  rating: number;
  outstanding_balance: number;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface VendorCreateInput {
  vendor_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  rating?: number;
  outstanding_balance?: number;
}

export interface VendorUpdateInput {
  vendor_name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  rating?: number;
  outstanding_balance?: number;
}

export interface ServiceResponse {
  success: boolean;
  message: string;
  data?: any;
  count?: number;
}

export class VendorService {
  async list(companyId: string, query?: string): Promise<ServiceResponse> {
    let q = supabase
      .from("vendors")
      .select("*", { count: "exact" })
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .order("vendor_name", { ascending: true });

    if (query) {
      q = q.or(`vendor_name.ilike.%${query}%,contact_person.ilike.%${query}%,phone.ilike.%${query}%`);
    }

    const { data, error, count } = await q;
    if (error) throw error;
    return { success: true, message: "Vendors retrieved", data: data || [], count: count || 0 };
  }

  async getById(id: string, companyId: string): Promise<Vendor | null> {
    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .single();

    if (error || !data) return null;
    return data as Vendor;
  }

  async create(companyId: string, input: VendorCreateInput): Promise<ServiceResponse> {
    const payload: any = {
      company_id: companyId,
      vendor_name: input.vendor_name,
      contact_person: input.contact_person || null,
      phone: input.phone || null,
      email: input.email || null,
      gstin: input.gstin || null,
      rating: input.rating != null ? Number(input.rating) : 5.0,
      outstanding_balance: input.outstanding_balance != null ? Number(input.outstanding_balance) : 0,
    };

    const { data, error } = await supabase
      .from("vendors")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return { success: true, message: "Vendor created", data };
  }

  async update(id: string, companyId: string, input: VendorUpdateInput): Promise<ServiceResponse> {
    const payload: any = {};
    if (input.vendor_name !== undefined) payload.vendor_name = input.vendor_name;
    if (input.contact_person !== undefined) payload.contact_person = input.contact_person;
    if (input.phone !== undefined) payload.phone = input.phone;
    if (input.email !== undefined) payload.email = input.email;
    if (input.gstin !== undefined) payload.gstin = input.gstin;
    if (input.rating !== undefined) payload.rating = Number(input.rating);
    if (input.outstanding_balance !== undefined) payload.outstanding_balance = Number(input.outstanding_balance);

    const { data, error } = await supabase
      .from("vendors")
      .update(payload)
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .select()
      .single();

    if (error) throw error;
    if (!data) return { success: false, message: "Vendor not found" };
    return { success: true, message: "Vendor updated", data };
  }

  async delete(id: string, companyId: string): Promise<ServiceResponse> {
    const { data, error } = await supabase
      .from("vendors")
      .update({ is_deleted: true })
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .select()
      .single();

    if (error) throw error;
    if (!data) return { success: false, message: "Vendor not found" };
    return { success: true, message: "Vendor deleted", data };
  }
}

export const vendorService = new VendorService();
