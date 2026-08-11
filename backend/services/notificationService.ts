import WhatsAppService from "./whatsappService.ts";
import { v4 as uuidv4 } from "uuid";

export interface NotificationRecord {
  id: string;
  company_id: string;
  user_id: string;
  customer_id: string;
  title: string;
  message: string;
  type: string;
  status: "read" | "unread";
  created_at: string;
}

// In-memory simulation of the notifications database table
export const notificationsTable: NotificationRecord[] = [
  {
    id: "not_1",
    company_id: "74834208-4783-4783-4783-420847834208",
    user_id: "88888888-8888-8888-8888-888888888888",
    customer_id: "c1",
    title: "🔔 New Site Visit Booked",
    message: "Customer Rahul Patil booked site visit for Sky Heights on 15 July 2026, 11:00 AM. Location: Baner.",
    type: "visit",
    status: "unread",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "not_2",
    company_id: "74834208-4783-4783-4783-420847834208",
    user_id: "88888888-8888-8888-8888-888888888888",
    customer_id: "c2",
    title: "📞 Call Me Request Received",
    message: "Customer Ramesh Patil clicked 'Call Me' request. Wants urgent callback about Wakad flat specifications.",
    type: "call",
    status: "unread",
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  }
];

export class NotificationService {
  /**
   * Retrieves all notifications
   */
  static async getAllNotifications(): Promise<NotificationRecord[]> {
    return [...notificationsTable].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Marks a notification as read
   */
  static async markAsRead(id: string): Promise<boolean> {
    const found = notificationsTable.find((n) => n.id === id);
    if (found) {
      found.status = "read";
      return true;
    }
    return false;
  }

  /**
   * Marks all notifications as read
   */
  static async markAllAsRead(): Promise<boolean> {
    notificationsTable.forEach((n) => {
      n.status = "read";
    });
    return true;
  }

  /**
   * Deletes a notification
   */
  static async deleteNotification(id: string): Promise<boolean> {
    const idx = notificationsTable.findIndex((n) => n.id === id);
    if (idx !== -1) {
      notificationsTable.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Dispatches and stores a customer notification
   */
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
    }
  ): Promise<{ success: boolean; notification: NotificationRecord; waDispatched: boolean }> {
    const {
      name,
      phone,
      project = "Green Valley",
      location = "Baner, Pune",
      budget = "₹ 65.0 Lakhs",
      requirement = "2 BHK Apartment",
      date = "15 July 2026",
      time = "11:00 AM",
      filename = "blueprint.pdf",
      size = "4.2 MB",
      category = "Blueprints",
      amount = "₹ 10,00,000",
      complaintText = "Water connection leakage on level 4.",
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
        message = `Customer ${name} started a new chat thread: "Hello, I am interested in Green Valley layouts."`;
        waMessage = `💬 *New WhatsApp Chat Thread*\n\nFrom: ${name} (${phone})\nLast Message: "Hello, I am interested in Green Valley layouts."\n\n🔗 Reply inside Center: https://shivinfra.erp/whatsapp`;
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

    // Save to table simulation
    const newRecord: NotificationRecord = {
      id: "not_" + Date.now(),
      company_id: "74834208-4783-4783-4783-420847834208",
      user_id: "88888888-8888-8888-8888-888888888888",
      customer_id: "c_" + Date.now(),
      title,
      message,
      type,
      status: "unread",
      created_at: new Date().toISOString(),
    };

    notificationsTable.unshift(newRecord);

    // Call WhatsApp API Helper to notify Admin
    // Admin WhatsApp is +91 98765 43210
    const ADMIN_WA = "+919876543210";
    const waDispatched = await WhatsAppService.sendTextMessage(ADMIN_WA, waMessage);

    return {
      success: true,
      notification: newRecord,
      waDispatched,
    };
  }
}
export default NotificationService;
