import { supabaseAdmin as supabase } from "../config/supabase.ts";
import { createFollowUp, getPendingFollowUpByRef } from "../services/followUpService.ts";
import { userService } from "./userService.ts";

async function getAdminWhatsAppNumbers(companyId: string): Promise<string[]> {
  try {
    const result = await userService.list(companyId);
    if (!result.success || !result.data) return [];
    return result.data
      .filter((u: any) => (u.role === 'Admin' || u.role === 'Super Admin') && u.phone)
      .map((u: any) => u.phone);
  } catch {
    return [];
  }
}

export interface TaskItem {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  due_date: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  assigned_to?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  due_date: string;
  priority: 'High' | 'Medium' | 'Low';
  assigned_to?: string;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: 'High' | 'Medium' | 'Low';
  status?: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  assigned_to?: string;
}

export interface ServiceResponse {
  success: boolean;
  message: string;
  data?: any;
  count?: number;
}

export class TaskService {
  async list(companyId: string, query?: string): Promise<ServiceResponse> {
    let q = supabase
      .from("tasks")
      .select("*", { count: "exact" })
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .order("due_date", { ascending: true });

    if (query) {
      q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const { data, error, count } = await q;
    if (error) throw error;
    return { success: true, message: "Tasks retrieved", data: data || [], count: count || 0 };
  }

  async getById(id: string, companyId: string): Promise<TaskItem | null> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .single();

    if (error || !data) return null;
    return data as TaskItem;
  }

  async create(companyId: string, input: TaskCreateInput, createdBy?: string): Promise<ServiceResponse> {
    const payload: any = {
      company_id: companyId,
      title: input.title,
      description: input.description || null,
      due_date: input.due_date,
      priority: input.priority,
      status: "Pending",
      assigned_to: input.assigned_to || null,
      created_by: createdBy || null,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    const taskData = data as TaskItem;

    if (taskData.due_date && taskData.status !== 'Completed') {
      const dueDate = new Date(taskData.due_date);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      const dateStr = dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const assignedName = taskData.assigned_to || 'Unassigned';
      
      // Fetch admin users with phone numbers for reminders
      const adminPhones = await getAdminWhatsAppNumbers(companyId);
      if (adminPhones.length === 0) {
        console.error("[SHIVINFRA TASK] Admin WhatsApp reminder skipped — no admin users with phone numbers configured.");
      } else {
        const reminderMessage = `🔔 *Task Due Reminder*\n\nTask: ${taskData.title}\nAssigned: ${assignedName}\nDue Date: ${dateStr}\nPriority: ${taskData.priority}\n\nPlease review this pending task.\n\n_SHIV INFRA Construction ERP_`;

        // Idempotency: skip if a pending reminder already exists for this task
        const existing = await getPendingFollowUpByRef(
          companyId,
          "task",
          taskData.id
        );
        if (!existing) {
          for (const adminPhone of adminPhones) {
            await createFollowUp({
              company_id: companyId,
              lead_id: null,
              phone: adminPhone,
              message: reminderMessage,
              scheduled_at: reminderDate.toISOString(),
              reference_id: taskData.id,
              reference_type: "task",
            });
          }
        }
      }
    }

    return { success: true, message: "Task created", data };
  }

  async update(id: string, companyId: string, input: TaskUpdateInput): Promise<ServiceResponse> {
    const payload: any = {};
    if (input.title !== undefined) payload.title = input.title;
    if (input.description !== undefined) payload.description = input.description;
    if (input.due_date !== undefined) payload.due_date = input.due_date;
    if (input.priority !== undefined) payload.priority = input.priority;
    if (input.status !== undefined) payload.status = input.status;
    if (input.assigned_to !== undefined) payload.assigned_to = input.assigned_to;

    const { data, error } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .select()
      .single();

    if (error) throw error;
    if (!data) return { success: false, message: "Task not found" };
    const taskData = data as TaskItem;

    if (input.due_date && taskData.status !== 'Completed') {
      const dueDate = new Date(taskData.due_date);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      const dateStr = dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const assignedName = taskData.assigned_to || 'Unassigned';
      
      // Fetch admin users with phone numbers for reminders
      const adminPhones = await getAdminWhatsAppNumbers(companyId);
      if (adminPhones.length === 0) {
        console.error("[SHIVINFRA TASK] Admin WhatsApp reminder skipped — no admin users with phone numbers configured.");
      } else {
        const reminderMessage = `🔔 *Task Due Reminder*\n\nTask: ${taskData.title}\nAssigned: ${assignedName}\nDue Date: ${dateStr}\nPriority: ${taskData.priority}\n\nPlease review this pending task.\n\n_SHIV INFRA Construction ERP_`;

        // Idempotency: skip if a pending reminder already exists for this task
        const existing = await getPendingFollowUpByRef(
          companyId,
          "task",
          taskData.id
        );
        if (!existing) {
          for (const adminPhone of adminPhones) {
            await createFollowUp({
              company_id: companyId,
              lead_id: null,
              phone: adminPhone,
              message: reminderMessage,
              scheduled_at: reminderDate.toISOString(),
              reference_id: taskData.id,
              reference_type: "task",
            });
          }
        }
      }
    }

    return { success: true, message: "Task updated", data };
  }

  async delete(id: string, companyId: string): Promise<ServiceResponse> {
    const { data, error } = await supabase
      .from("tasks")
      .update({ is_deleted: true })
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .select()
      .single();

    if (error) throw error;
    if (!data) return { success: false, message: "Task not found" };
    return { success: true, message: "Task deleted", data };
  }
}

export const taskService = new TaskService();
