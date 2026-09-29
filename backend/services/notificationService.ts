import { supabaseAdmin as supabase } from "../config/supabase.ts";
import WhatsAppService from "./whatsappService.ts";
import { userService } from "./userService.ts";
import { v4 as uuidv4 } from "uuid";

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

export interface NotificationRecord {
  id: string;
  company_id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export class NotificationService {
  static async getAllNotifications(companyId: string, userId?: string): Promise<NotificationRecord[]> {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...row,
      is_read: row.is_read || false,
    }));
  }

  static async markAsRead(id: string, companyId: string, userId?: string): Promise<boolean> {
    let query = supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("company_id", companyId);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query.select("id").maybeSingle();

    if (error) throw error;
    return !!data;
  }

  static async markAllAsRead(companyId: string, userId?: string): Promise<boolean> {
    let query = supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("company_id", companyId)
      .eq("is_read", false);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { error } = await query;

    if (error) throw error;
    return true;
  }

  static async deleteNotification(id: string, companyId: string, userId?: string): Promise<boolean> {
    let query = supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { error } = await query;

    if (error) throw error;
    return true;
  }

  static async triggerCustomerActionNotification(
    type: string,
    customerData: {
      name: string;
      phone: string;
      project?: string;
      location?: string;
      budget?: string;
      requirement?: string;
      date?: string;
      time?: string;
      filename?: string;
      size?: string;
      category?: string;
      amount?: string;
      complaintText?: string;
    },
    companyId: string,
    userId?: string
  ): Promise<{ success: boolean; notification: NotificationRecord; waDispatched: boolean }> {
    const {
      name,
      phone,
      project = "Project",
      location = "Location",
      budget = "Budget",
      requirement = "Requirement",
      date = "",
      time = "",
      filename = "",
      size = "",
      category = "",
      amount = "",
      complaintText = "",
    } = customerData;

    let title = "🔔 System Event Alert";
    let message = `Customer ${name} executed action of type: ${type}`;
    let waMessage = "";

    switch (type) {
      case "enquiry":
        title = "🔔 New Project Enquiry";
        message = `Customer ${name} submitted an enquiry for ${project} (${requirement}). Budget: ${budget}, Location: ${location}.`;
        waMessage = `🔔 *New Project Enquiry Received*\n\n*Customer Details*\nName: ${name}\nPhone: ${phone}\n\n*Requirement Details*\nProject: ${project}\nLocation: ${location}\nBudget: ${budget}\nRequirement: ${requirement}\n\n_SHIV INFRA CRM SYSTEM_`;
        break;

      case "interested":
        title = "🔥 Customer Marked Interested";
        message = `Customer ${name} expressed deep interest in project ${project}.`;
        waMessage = `🔥 *Customer Project Interested*\n\nName: ${name}\nPhone: ${phone}\nProject: ${project}\nLocation: ${location}\n\n_CRM Dashboard link: https://shivinfra.erp/leads_`;
        break;

      case "visit":
        title = "📅 New Site Visit Booked";
        message = `Customer ${name} booked site visit for ${project} on ${date} at ${time}.`;
        waMessage = `🔔 *New Site Visit Booked*\n\n*Customer Name* : ${name}\n*Phone* : ${phone}\n*Project* : ${project}\n*Location* : ${location}\n*Visit Date* : ${date}\n*Time* : ${time}\n\n*Click below*:\n🔗 View Dashboard: https://shivinfra.erp/dashboard\n📞 Call Customer: tel:${phone}\n📍 Open Google Maps: https://maps.google.com/?q=${encodeURIComponent(location)}`;
        break;

      case "cancel_visit":
        title = "❌ Site Visit Cancelled";
        message = `Customer ${name} cancelled site visit schedule for ${project}.`;
        waMessage = `❌ *Site Visit Cancelled Alert*\n\n*Customer Name* : ${name}\n*Phone* : ${phone}\n*Project* : ${project}\n*Scheduled Date* : ${date}\n\n_CRM Dashboard updated._`;
        break;

      case "reschedule_visit":
        title = "🔄 Site Visit Rescheduled";
        message = `Customer ${name} rescheduled site visit to ${date} at ${time}.`;
        waMessage = `🔄 *Site Visit Rescheduled Alert*\n\n*Customer Name* : ${name}\n*Phone* : ${phone}\n*Project* : ${project}\n*New Date* : ${date}\n*New Time* : ${time}\n\n🔗 Dashboard View: https://shivinfra.erp/site-visits`;
        break;

      case "call_request":
        title = "📞 Call Me Request";
        message = `Customer ${name} requested a call. Wants callback at ${phone} regarding ${project}.`;
        waMessage = `📞 *Customer Requested a Call*\n\n*Customer Details*\nName: ${name}\nPhone: ${phone}\nProject: ${project}\n\n_Action Required: Immediate Sales Callback._`;
        break;

      case "whatsapp_chat":
        title = "💬 WhatsApp Inbound Message";
        message = `Customer ${name} started a new chat thread.`;
        waMessage = `💬 *New WhatsApp Chat Thread*\n\nFrom: ${name} (${phone})\n\n🔗 Reply inside Center: https://shivinfra.erp/whatsapp`;
        break;

      case "lead_created":
        title = "👤 New Lead Registered";
        message = `New lead ${name} registered from source: Google Search.`;
        waMessage = `👤 *New Lead Pipeline Registered*\n\nName: ${name}\nPhone: ${phone}\nRequirement: ${requirement}\nSource: Google Search`;
        break;

      case "document":
        title = "📂 New Document Uploaded";
        message = `Customer ${name} uploaded legal document: "${filename}" (${size}) under category: ${category}.`;
        waMessage = `📂 *New Customer Document Uploaded*\n\n*Customer*: ${name}\n*Filename*: ${filename}\n*Size*: ${size}\n*Category*: ${category}\n\n🔗 Verification link: https://shivinfra.erp/documents`;
        break;

      case "payment":
        title = "💳 New Payment Done";
        message = `Customer ${name} uploaded payment receipt screenshot of ${amount} for booking confirmation.`;
        waMessage = `💳 *New Payment Done Notification*\n\n*Customer Name*: ${name}\n*Phone*: ${phone}\n*Amount paid*: ${amount}\n*Attached*: Payment Screenshot Received\n\n🔗 Approve Payment: https://shivinfra.erp/bills`;
        break;

      case "bill_uploaded":
        title = "🧾 Engineer Uploaded Bill";
        message = `Site engineer uploaded purchase bill: "${filename}" (${amount}) for cement procurement.`;
        waMessage = `🧾 *Engineer Bill Uploaded*\n\n*Uploaded By*: Site Engineer\n*Amount*: ${amount}\n*Material*: Cement Procurement\n*File*: ${filename}\n\n🔗 Audit Ledgers: https://shivinfra.erp/bills`;
        break;

      case "complaint":
        title = "⚠️ Customer Complaint Registered";
        message = `Customer ${name} filed a complaint: "${complaintText}"`;
        waMessage = `⚠️ *New Complaint Filed*\n\n*Customer*: ${name}\n*Phone*: ${phone}\n*Complaint*: "${complaintText}"\n\n_Priority: Immediate Redressal_`;
        break;

      case "support":
        title = "🛠️ Customer Support Request";
        message = `Customer ${name} submitted support query: "Need structural plan copies for level 2 floor."`;
        waMessage = `🛠️ *New Customer Support Request*\n\n*Customer*: ${name}\n*Phone*: ${phone}\n*Query*: "Need structural plan copies for level 2 floor."`;
        break;

      default:
        waMessage = `🔔 *SHIV INFRA Alert*\n\nCustomer: ${name}\nAction: ${type}`;
    }

    const newRecord: NotificationRecord = {
      id: uuidv4(),
      company_id: companyId,
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("notifications")
      .insert({
        id: newRecord.id,
        company_id: newRecord.company_id,
        user_id: newRecord.user_id,
        title: newRecord.title,
        message: newRecord.message,
        is_read: false,
      });

    if (error) throw error;

    // Resolve admin WhatsApp numbers from database for this company
    const adminPhones = await getAdminWhatsAppNumbers(companyId);
    let waDispatched = false;

    if (adminPhones.length > 0) {
      for (const adminPhone of adminPhones) {
        const sent = await WhatsAppService.sendTextMessage(adminPhone, waMessage);
        waDispatched = waDispatched || sent;
      }
    } else {
      console.error("[SHIVINFRA NOTIFICATION] Admin WhatsApp skipped — no admin users with phone numbers configured for this company.");
    }

    return {
      success: true,
      notification: newRecord,
      waDispatched,
    };
  }
}
export default NotificationService;
