import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { supabaseAdmin as supabase, isSupabaseConfigured } from "../config/supabase.ts";
import { mockSiteVisits, SiteVisit } from "../database/mockDB.ts";
import { GoogleService } from "../services/googleService.ts";

export class SiteVisitController {
  /**
   * List scheduled visits
   */
  static async getVisits(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const companyId = req.user!.company_id;

    try {
      let visits: SiteVisit[] = [];

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from("site_visits")
          .select("*")
          .eq("company_id", companyId)
          .eq("is_deleted", false);

        if (error) throw error;
        visits = data || [];
      } else {
        visits = mockSiteVisits.filter((v) => v.company_id === companyId);
      }

      return res.status(200).json({ success: true, count: visits.length, data: visits });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Book a physical property visit
   */
  static async createVisit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const companyId = req.user!.company_id;
    const { lead_id, customer_id, project_id, visit_date, notes } = req.body;

    try {
      // 1. Synchronize onto Google Calendar
      const eventId = await GoogleService.createCalendarEvent(
        `SHIVINFRA Walkthrough: Project ID ${project_id}`,
        new Date(visit_date),
        notes || "Walkthrough inspection with sales consultant."
      );

      const newVisit: Partial<SiteVisit> = {
        company_id: companyId,
        lead_id: lead_id || null,
        customer_id: customer_id || null,
        project_id,
        visit_date,
        status: "Scheduled",
        notes: notes || "",
        google_event_id: eventId,
        created_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from("site_visits")
          .insert(newVisit)
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json({ success: true, message: "Site Visit synced with Supabase & Google Calendar.", data });
      } else {
        const id = "v_" + Date.now();
        const created: SiteVisit = { id, ...(newVisit as Omit<SiteVisit, "id">) };
        mockSiteVisits.push(created);
        return res.status(201).json({ success: true, message: "Site Visit successfully scheduled.", data: created });
      }
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reschedule site walkthrough
   */
  static async updateVisit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const companyId = req.user!.company_id;
    const { id } = req.params;
    const updateData = req.body;

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from("site_visits")
          .update(updateData)
          .eq("id", id)
          .eq("company_id", companyId)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json({ success: true, message: "Site visit updated in Supabase.", data });
      } else {
        const idx = mockSiteVisits.findIndex((v) => v.id === id && v.company_id === companyId);
        if (idx === -1) {
          return res.status(404).json({ success: false, error: "Site visit booking not found." });
        }

        mockSiteVisits[idx] = { ...mockSiteVisits[idx], ...updateData };
        return res.status(200).json({ success: true, message: "Walkthrough rescheduled successfully.", data: mockSiteVisits[idx] });
      }
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel site visit
   */
  static async deleteVisit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const companyId = req.user!.company_id;
    const { id } = req.params;

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from("site_visits")
          .update({ is_deleted: true })
          .eq("id", id)
          .eq("company_id", companyId);

        if (error) throw error;
      } else {
        const idx = mockSiteVisits.findIndex((v) => v.id === id && v.company_id === companyId);
        if (idx === -1) {
          return res.status(404).json({ success: false, error: "Site visit booking not found." });
        }
        mockSiteVisits.splice(idx, 1);
      }

      return res.status(200).json({ success: true, message: "Site visit appointment canceled successfully." });
    } catch (err) {
      next(err);
    }
  }
}
export default SiteVisitController;
