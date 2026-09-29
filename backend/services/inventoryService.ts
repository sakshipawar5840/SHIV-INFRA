import { supabaseAdmin as supabase } from "../config/supabase.ts";

export interface InventoryItem {
  id: string;
  company_id: string;
  project_id?: string | null;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  minimum_stock: number;
  unit_price: number;
  supplier_id?: string | null;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface InventoryCreateInput {
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  minimum_stock: number;
  unit_price: number;
}

export interface InventoryUpdateInput {
  item_name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  minimum_stock?: number;
  unit_price?: number;
}

export interface ServiceResponse {
  success: boolean;
  message: string;
  data?: any;
  count?: number;
}

export class InventoryService {
  private table = "materials";

  async list(companyId: string, query?: string): Promise<ServiceResponse> {
    let q = supabase
      .from(this.table)
      .select("*", { count: "exact" })
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .order("item_name", { ascending: true });

    if (query) {
      q = q.or(`item_name.ilike.%${query}%,category.ilike.%${query}%`);
    }

    const { data, error, count } = await q;
    if (error) throw error;
    return { success: true, message: "Inventory items retrieved", data: data || [], count: count || 0 };
  }

  async getById(id: string, companyId: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .single();

    if (error || !data) return null;
    return data as InventoryItem;
  }

  async create(companyId: string, input: InventoryCreateInput, createdBy?: string): Promise<ServiceResponse> {
    const payload: any = {
      company_id: companyId,
      item_name: input.item_name,
      category: input.category,
      quantity: Number(input.quantity),
      unit: input.unit,
      minimum_stock: Number(input.minimum_stock),
      unit_price: Number(input.unit_price),
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return { success: true, message: "Inventory item created", data };
  }

  async update(id: string, companyId: string, input: InventoryUpdateInput): Promise<ServiceResponse> {
    const payload: any = {};
    if (input.item_name !== undefined) payload.item_name = input.item_name;
    if (input.category !== undefined) payload.category = input.category;
    if (input.quantity !== undefined) payload.quantity = Number(input.quantity);
    if (input.unit !== undefined) payload.unit = input.unit;
    if (input.minimum_stock !== undefined) payload.minimum_stock = Number(input.minimum_stock);
    if (input.unit_price !== undefined) payload.unit_price = Number(input.unit_price);

    const { data, error } = await supabase
      .from(this.table)
      .update(payload)
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .select()
      .single();

    if (error) throw error;
    if (!data) return { success: false, message: "Inventory item not found" };
    return { success: true, message: "Inventory item updated", data };
  }

  async delete(id: string, companyId: string): Promise<ServiceResponse> {
    const { data, error } = await supabase
      .from(this.table)
      .update({ is_deleted: true })
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .select()
      .single();

    if (error) throw error;
    if (!data) return { success: false, message: "Inventory item not found" };
    return { success: true, message: "Inventory item deleted", data };
  }
}

export const inventoryService = new InventoryService();
