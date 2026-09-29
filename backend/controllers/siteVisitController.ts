import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { supabaseAdmin as supabase } from "../config/supabase.ts";
import WhatsAppService from "../services/whatsappService.ts";
import { createFollowUp, getPendingFollowUpByRef } from "../services/followUpService.ts";
import { userService } from "../services/userService.ts";

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

export class SiteVisitController {
  static async getVisits(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const companyId = req.user!.company_id;

    try {
      const { data, error } = await supabase
        .from("site_visits")
        .select(`
          *,
          leads!inner(
            id,
            requirement,
            preferred_location,
            customer_id,
            project_id,
            customers!inner(full_name, phone),
            projects!inner(project_name, location)
          ),
          customers!inner(full_name, phone),
          projects!inner(project_name, location)
        `)
        .eq("company_id", companyId)
        .eq("is_deleted", false)
        .order("visit_date", { ascending: true });

      if (error) throw error;
      return res.status(200).json({ success: true, count: data?.length || 0, data: data || [] });
    } catch (err) {
      next(err);
    }
  }

  static async createVisit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const companyId = req.user!.company_id;
    const { lead_id, customer_id, project_id, visit_date, notes } = req.body;

    try {
      const newVisit: any = {
        company_id: companyId,
        lead_id: lead_id || null,
        customer_id: customer_id || null,
        project_id: project_id || null,
        visit_date,
        status: "Scheduled",
        notes: notes || "",
      };

      const { data, error } = await supabase
        .from("site_visits")
        .insert(newVisit)
        .select()
        .single();

      if (error) throw error;

      const createdVisit = data as any;

      let customerPhone = "";
      let customerName = "Valued Customer";
      let projectName = "Your Project";
      let location = "";

      if (lead_id) {
        const leadRes = await supabase
          .from("leads")
          .select("customer_id, customers!inner(phone, full_name), projects(project_name, location)")
          .eq("id", lead_id)
          .single();

        const leadData = leadRes.data as any;
        customerPhone = leadData?.customers?.phone || "";
        customerName = leadData?.customers?.full_name || customerName;
        projectName = leadData?.projects?.project_name || projectName;
        location = leadData?.projects?.location || "";
      }

      if (!customerPhone && customer_id) {
        const custRes = await supabase
          .from("customers")
          .select("phone, full_name")
          .eq("id", customer_id)
          .single();

        const custData = custRes.data as any;
        customerPhone = custData?.phone || "";
        customerName = custData?.full_name || customerName;
      }

      if (project_id && !location) {
        const projRes = await supabase
          .from("projects")
          .select("project_name, location")
          .eq("id", project_id)
          .single();
        const projData = projRes.data as any;
        projectName = projData?.project_name || projectName;
        location = projData?.location || "";
      }

      const visitDate = new Date(visit_date);
      const dateStr = visitDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = visitDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      let waCustomerSent = false;
      let customerReminderCreated = false;

      if (customerPhone) {
        const waMessage = `📅 *Site Visit Confirmation*\n\n*Customer Name*: ${customerName}\n*Project*: ${projectName}\n*Date*: ${dateStr}\n*Time*: ${timeStr}\n*Location*: ${location || 'As discussed'}\n\nThank you for booking. Our team will contact you 1 hour before the scheduled visit.\n\n_SHIV INFRA Construction ERP`;
        waCustomerSent = await WhatsAppService.sendTextMessage(customerPhone, waMessage);
        if (!waCustomerSent) {
          console.error("[SHIVINFRA SITE-VISIT] Customer WhatsApp not sent — credentials may not be configured.");
        }

        // Customer day-before reminder (scheduled)
        const reminderDate = new Date(visitDate);
        reminderDate.setDate(reminderDate.getDate() - 1);
        const customerReminderMessage = `🔔 *Site Visit Reminder*\n\nDear ${customerName},\n\nYour site visit is scheduled for tomorrow:\n*Project*: ${projectName}\n*Date*: ${dateStr}\n*Time*: ${timeStr}\n*Location*: ${location || 'As discussed'}\n\nPlease be ready. Our team will contact you 1 hour before the visit.\n\n_SHIV INFRA Construction ERP_`;

        const existingCustomerReminder = await getPendingFollowUpByRef(
          companyId,
          "site_visit_customer",
          createdVisit.id
        );
        if (!existingCustomerReminder) {
          await createFollowUp({
            company_id: companyId,
            lead_id: null,
            phone: customerPhone,
            message: customerReminderMessage,
            scheduled_at: reminderDate.toISOString(),
            reference_id: createdVisit.id,
            reference_type: "site_visit_customer",
          });
          customerReminderCreated = true;
        }
      }

      // Fetch admin users with phone numbers for reminders
      const adminPhones = await getAdminWhatsAppNumbers(companyId);
      let adminReminderCreated = false;
      let adminReminderSkipped = false;

      if (adminPhones.length > 0) {
        const reminderDate = new Date(visitDate);
        reminderDate.setDate(reminderDate.getDate() - 1);

        const reminderMessage = `🔔 *Site Visit Reminder*\n\nCustomer: ${customerName}\nProject: ${projectName}\nDate: ${dateStr}\nTime: ${timeStr}\nLocation: ${location || 'As discussed'}\n\nConfirm before the appointment.\n\n_SHIV INFRA Construction ERP_`;

        // Idempotency: skip if a pending reminder already exists for this visit
        const existing = await getPendingFollowUpByRef(
          companyId,
          "site_visit",
          createdVisit.id
        );
        if (!existing) {
          for (const adminPhone of adminPhones) {
            await createFollowUp({
              company_id: companyId,
              lead_id: null,
              phone: adminPhone,
              message: reminderMessage,
              scheduled_at: reminderDate.toISOString(),
              reference_id: createdVisit.id,
              reference_type: "site_visit",
            });
          }
          adminReminderCreated = true;
        }
      } else {
        adminReminderSkipped = true;
        console.error("[SHIVINFRA SITE-VISIT] Admin WhatsApp reminder skipped — no admin users with phone numbers configured.");
      }

      await supabase
        .from("notifications")
        .insert({
          company_id: companyId,
          user_id: req.user!.id,
          title: "📅 New Site Visit Booked",
          message: `Site visit scheduled for ${customerName} on ${dateStr} at ${timeStr} for ${projectName}.`,
          type: "site_visit",
          is_read: false,
        });

      return res.status(201).json({
        success: true,
        message: "Site Visit created in Supabase.",
        data: createdVisit,
        whatsapp_customer_sent: waCustomerSent,
        customer_reminder_created: customerReminderCreated,
        admin_reminder_created: adminReminderCreated,
        admin_reminder_skipped: adminReminderSkipped,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateVisit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const companyId = req.user!.company_id;
    const { id } = req.params;
    const updateData = req.body;

    try {
      // If visit_date is being updated, we need to reschedule reminders
      const isVisitDateChanged = updateData.visit_date !== undefined;

      let existingVisit: any = null;
      let customerPhone = "";
      let customerName = "Valued Customer";
      let projectName = "Your Project";
      let location = "";

      if (isVisitDateChanged) {
        // Fetch existing visit to get customer/project details for rescheduling
        const { data: visitData } = await supabase
          .from("site_visits")
          .select("lead_id, customer_id, project_id")
          .eq("id", id)
          .eq("company_id", companyId)
          .single();

        if (visitData) {
          existingVisit = visitData;

          if (visitData.lead_id) {
            const leadRes = await supabase
              .from("leads")
              .select("customer_id, customers!inner(phone, full_name), projects(project_name, location)")
              .eq("id", visitData.lead_id)
              .single();

            const leadData = leadRes.data as any;
            customerPhone = leadData?.customers?.phone || "";
            customerName = leadData?.customers?.full_name || customerName;
            projectName = leadData?.projects?.project_name || projectName;
            location = leadData?.projects?.location || "";
          }

          if (!customerPhone && visitData.customer_id) {
            const custRes = await supabase
              .from("customers")
              .select("phone, full_name")
              .eq("id", visitData.customer_id)
              .single();

            const custData = custRes.data as any;
            customerPhone = custData?.phone || "";
            customerName = custData?.full_name || customerName;
          }

          if (visitData.project_id && !location) {
            const projRes = await supabase
              .from("projects")
              .select("project_name, location")
              .eq("id", visitData.project_id)
              .single();
            const projData = projRes.data as any;
            projectName = projData?.project_name || projectName;
            location = projData?.location || "";
          }
        }
      }

      const { data, error } = await supabase
        .from("site_visits")
        .update(updateData)
        .eq("id", id)
        .eq("company_id", companyId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        return res.status(404).json({ success: false, error: "Site visit booking not found." });
      }

      // If visit_date changed, reschedule reminders
      if (isVisitDateChanged && existingVisit) {
        const newVisitDate = new Date(updateData.visit_date);
        const newDateStr = newVisitDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const newTimeStr = newVisitDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const newReminderDate = new Date(newVisitDate);
        newReminderDate.setDate(newReminderDate.getDate() - 1);

        // Delete existing pending followups for this visit (both admin and customer)
        await supabase
          .from("followups")
          .delete()
          .eq("company_id", companyId)
          .eq("reference_id", id)
          .in("reference_type", ["site_visit", "site_visit_customer"])
          .eq("sent", false);

        // Reschedule admin reminder
        const adminPhones = await getAdminWhatsAppNumbers(companyId);
        if (adminPhones.length > 0) {
          const adminReminderMessage = `🔔 *Site Visit Reminder*\n\nCustomer: ${customerName}\nProject: ${projectName}\nDate: ${newDateStr}\nTime: ${newTimeStr}\nLocation: ${location || 'As discussed'}\n\nConfirm before the appointment.\n\n_SHIV INFRA Construction ERP_`;

          for (const adminPhone of adminPhones) {
            await createFollowUp({
              company_id: companyId,
              lead_id: null,
              phone: adminPhone,
              message: adminReminderMessage,
              scheduled_at: newReminderDate.toISOString(),
              reference_id: id,
              reference_type: "site_visit",
            });
          }
        }

        // Reschedule customer reminder
        if (customerPhone) {
          const customerReminderMessage = `🔔 *Site Visit Reminder*\n\nDear ${customerName},\n\nYour site visit is scheduled for tomorrow:\n*Project*: ${projectName}\n*Date*: ${newDateStr}\n*Time*: ${newTimeStr}\n*Location*: ${location || 'As discussed'}\n\nPlease be ready. Our team will contact you 1 hour before the visit.\n\n_SHIV INFRA Construction ERP_`;

          await createFollowUp({
            company_id: companyId,
            lead_id: null,
            phone: customerPhone,
            message: customerReminderMessage,
            scheduled_at: newReminderDate.toISOString(),
            reference_id: id,
            reference_type: "site_visit_customer",
          });
        }
      }

      return res.status(200).json({ success: true, message: "Site visit updated in Supabase.", data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteVisit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const companyId = req.user!.company_id;
    const { id } = req.params;

    try {
      const { data, error } = await supabase
        .from("site_visits")
        .update({ is_deleted: true })
        .eq("id", id)
        .eq("company_id", companyId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        return res.status(404).json({ success: false, error: "Site visit booking not found." });
      }
      return res.status(200).json({ success: true, message: "Site visit appointment canceled successfully." });
    } catch (err) {
      next(err);
    }
  }
}

export default SiteVisitController;
