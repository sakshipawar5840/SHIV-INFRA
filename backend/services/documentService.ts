import { supabaseAdmin as supabase } from "../config/supabase.ts";

export interface DocumentItem {
  id: string;
  company_id: string;
  project_id?: string;
  uploaded_by?: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_size: number;
  created_at?: string;
}

export interface DocumentCreateInput {
  company_id: string;
  project_id?: string;
  uploaded_by?: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_size: number;
}

export interface DocumentUpdateInput {
  document_name?: string;
  document_type?: string;
  project_id?: string | null;
}

export interface ServiceResponse {
  success: boolean;
  message: string;
  data?: any;
  count?: number;
}

export class DocumentService {
  async list(companyId: string, projectId?: string): Promise<ServiceResponse> {
    let q = supabase
      .from("documents")
      .select("*", { count: "exact" })
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (projectId) q = q.eq("project_id", projectId);

    const { data, error, count } = await q;
    if (error) throw error;
    return { success: true, message: "Documents retrieved", data: data || [], count: count || 0 };
  }

  async getById(id: string, companyId: string): Promise<DocumentItem | null> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();

    if (error || !data) return null;
    return data as DocumentItem;
  }

  async create(input: DocumentCreateInput): Promise<ServiceResponse> {
    const { data, error } = await supabase
      .from("documents")
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return { success: true, message: "Document uploaded", data };
  }

  async update(id: string, companyId: string, input: DocumentUpdateInput): Promise<ServiceResponse> {
    const payload: any = {};
    if (input.document_name !== undefined) payload.document_name = input.document_name;
    if (input.document_type !== undefined) payload.document_type = input.document_type;
    if (input.project_id !== undefined) payload.project_id = input.project_id;

    const { data, error } = await supabase
      .from("documents")
      .update(payload)
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return { success: false, message: "Document not found" };
    return { success: true, message: "Document updated", data };
  }

  async delete(id: string, companyId: string): Promise<ServiceResponse> {
    const { data, error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return { success: false, message: "Document not found" };

    const path = (data as any).file_url;
    if (path) {
      await supabase.storage.from("documents").remove([path]);
    }

    return { success: true, message: "Document deleted", data };
  }

  async getSignedUrl(path: string, bucketName = "documents"): Promise<string> {
    const { data } = await supabase.storage.from(bucketName).createSignedUrl(path, 3600);
    if (!data || !data.signedUrl) throw new Error("Failed to create signed URL");
    return data.signedUrl;
  }

  async uploadFile(buffer: Buffer, path: string, bucketName = "documents", contentType?: string): Promise<string> {
    const { error } = await supabase.storage.from(bucketName).upload(path, buffer, {
      contentType,
      upsert: true,
    });
    if (error) throw error;
    return path;
  }
}

export const documentService = new DocumentService();
