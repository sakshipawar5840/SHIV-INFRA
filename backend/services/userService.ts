import { supabaseAdmin as supabase } from "../config/supabase.ts";

export interface SystemUser {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface UserCreateInput {
  company_id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  password_hash: string;
  status?: string;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
}

export interface ServiceResponse {
  success: boolean;
  message: string;
  data?: any;
  count?: number;
}

export class UserService {
  async list(companyId: string, query?: string): Promise<ServiceResponse> {
    let q = supabase
      .from("users")
      .select("id, company_id, full_name, email, phone, role, status, created_at, updated_at", { count: "exact" })
      .eq("company_id", companyId)
      .order("full_name", { ascending: true });

    if (query) {
      q = q.or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);
    }

    const { data, error, count } = await q;
    if (error) throw error;
    const mapped = (data || []).map((u: any) => ({ ...u, name: u.full_name }));
    return { success: true, message: "Users retrieved", data: mapped, count: count || 0 };
  }

  async getById(id: string, companyId: string): Promise<SystemUser | null> {
    const { data, error } = await supabase
      .from("users")
      .select("id, company_id, full_name, email, phone, role, status, created_at, updated_at")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();

    if (error || !data) return null;
    return { ...(data as any), name: data.full_name } as SystemUser;
  }

  async create(input: UserCreateInput): Promise<ServiceResponse> {
    const payload: any = {
      company_id: input.company_id,
      full_name: input.name,
      email: input.email,
      phone: input.phone || null,
      role: input.role,
      password: input.password_hash,
      status: input.status || "active",
    };

    const { data, error } = await supabase
      .from("users")
      .insert(payload)
      .select("id, company_id, full_name, email, phone, role, status, created_at, updated_at")
      .single();

    if (error) throw error;
    return { success: true, message: "User created", data: { ...data, name: data.full_name } };
  }

  async update(id: string, companyId: string, input: UserUpdateInput): Promise<ServiceResponse> {
    const payload: any = {};
    if (input.name !== undefined) payload.full_name = input.name;
    if (input.email !== undefined) payload.email = input.email;
    if (input.phone !== undefined) payload.phone = input.phone;
    if (input.role !== undefined) payload.role = input.role;
    if (input.status !== undefined) payload.status = input.status;

    const { data, error } = await supabase
      .from("users")
      .update(payload)
      .eq("id", id)
      .eq("company_id", companyId)
      .select("id, company_id, full_name, email, phone, role, status, created_at, updated_at")
      .single();

    if (error) throw error;
    if (!data) return { success: false, message: "User not found" };
    return { success: true, message: "User updated", data: { ...data, name: data.full_name } };
  }

  async delete(id: string, companyId: string): Promise<ServiceResponse> {
    const { data, error } = await supabase
      .from("users")
      .update({ status: "inactive" })
      .eq("id", id)
      .eq("company_id", companyId)
      .select("id, company_id, full_name, email, phone, role, status, created_at, updated_at")
      .single();

    if (error) throw error;
    if (!data) return { success: false, message: "User not found" };
    return { success: true, message: "User deactivated", data: { ...data, name: data.full_name } };
  }
}

export const userService = new UserService();
