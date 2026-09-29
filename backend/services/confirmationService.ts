// =====================================================
// SHIVINFRA PERSISTENT CONFIRMATION SERVICE
// Production-safe confirmation storage using Supabase
// =====================================================

import { supabaseAdmin as supabase } from "../config/supabase.ts";

export interface ConfirmationPayload {
    intent: any;
    userId: string;
    role: string;
    channel: string;
    originalMessage: string;
}

export interface PendingConfirmation {
    id: string;
    company_id: string;
    phone: string | null;
    user_id: string | null;
    intent: string;
    intent_data: ConfirmationPayload;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
    created_at: string;
    expires_at: string;
    confirmed_at?: string;
    cancelled_at?: string;
    action_executed?: boolean;
}

const CONFIRMATION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export class ConfirmationService {
    // =================================================
    // CREATE PENDING CONFIRMATION
    // =================================================
    static async createConfirmation(
        companyId: string,
        phone: string,
        payload: ConfirmationPayload
    ): Promise<PendingConfirmation | null> {
        try {
            // Cancel any existing pending confirmation for this phone/company
            await this.cancelPendingConfirmations(companyId, phone);

            const expiresAt = new Date(Date.now() + CONFIRMATION_TTL_MS).toISOString();

            const { data, error } = await supabase
                .from("pending_confirmations")
                .insert({
                    company_id: companyId,
                    phone,
                    intent: payload.intent.name,
                    intent_data: payload,
                    status: "PENDING",
                    expires_at: expiresAt,
                    action_executed: false,
                })
                .select()
                .single();

            if (error) {
                console.error("[CONFIRMATION] Create failed:", error);
                return null;
            }

            return data as PendingConfirmation;
        } catch (error: any) {
            console.error("[CONFIRMATION] Create error:", error);
            return null;
        }
    }

    // =================================================
    // GET PENDING CONFIRMATION
    // =================================================
    static async getPendingConfirmation(
        companyId: string,
        phone: string
    ): Promise<PendingConfirmation | null> {
        try {
            const { data, error } = await supabase
                .from("pending_confirmations")
                .select("*")
                .eq("company_id", companyId)
                .eq("phone", phone)
                .eq("status", "PENDING")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                return null;
            }

            // Check if expired
            const expiresAt = new Date(data.expires_at).getTime();
            if (Date.now() > expiresAt) {
                await this.expireConfirmation(data.id);
                return null;
            }

            return data as PendingConfirmation;
        } catch (error) {
            return null;
        }
    }

    // =================================================
    // CONFIRM (YES) - ATOMIC OPERATION
    // Returns the confirmation only if THIS call successfully confirmed it
    // Returns null if already confirmed/cancelled/expired
    // =================================================
    static async confirmPending(
        companyId: string,
        phone: string
    ): Promise<PendingConfirmation | null> {
        try {
            // Atomically update from PENDING to CONFIRMED
            // This ensures only ONE request can confirm
            const { data, error } = await supabase
                .from("pending_confirmations")
                .update({
                    status: "CONFIRMED",
                    confirmed_at: new Date().toISOString(),
                })
                .eq("company_id", companyId)
                .eq("phone", phone)
                .eq("status", "PENDING")
                .gt("expires_at", new Date().toISOString()) // Not expired
                .order("created_at", { ascending: false })
                .limit(1)
                .select()
                .single();

            if (error || !data) {
                // Either no pending confirmation, or another request already confirmed it
                return null;
            }

            return data as PendingConfirmation;
        } catch (error) {
            return null;
        }
    }

    // =================================================
    // CREATE PENDING CONFIRMATION (REST / user-scoped)
    //
    // Reuses the same pending_confirmations table.
    // REST rows set phone = NULL and user_id = authenticated
    // server identity (req.user.id). Never client-supplied.
    // =================================================
    static async createConfirmationByUser(
        companyId: string,
        userId: string,
        payload: ConfirmationPayload
    ): Promise<PendingConfirmation | null> {
        try {
            // Cancel any existing pending confirmation for this user/company
            await this.cancelPendingByUser(companyId, userId);

            const expiresAt = new Date(Date.now() + CONFIRMATION_TTL_MS).toISOString();

            const { data, error } = await supabase
                .from("pending_confirmations")
                .insert({
                    company_id: companyId,
                    phone: null,
                    user_id: userId,
                    intent: payload.intent.name,
                    intent_data: payload,
                    status: "PENDING",
                    expires_at: expiresAt,
                    action_executed: false,
                })
                .select()
                .single();

            if (error) {
                console.error("[CONFIRMATION] Create by user failed:", error);
                return null;
            }

            return data as PendingConfirmation;
        } catch (error: any) {
            console.error("[CONFIRMATION] Create by user error:", error);
            return null;
        }
    }

    // =================================================
    // GET PENDING CONFIRMATION BY USER ID
    // =================================================
    static async getPendingConfirmationByUser(
        companyId: string,
        userId: string
    ): Promise<PendingConfirmation | null> {
        try {
            const { data, error } = await supabase
                .from("pending_confirmations")
                .select("*")
                .eq("company_id", companyId)
                .eq("user_id", userId)
                .eq("status", "PENDING")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                return null;
            }

            // Check if expired
            const expiresAt = new Date(data.expires_at).getTime();
            if (Date.now() > expiresAt) {
                await this.expireConfirmation(data.id);
                return null;
            }

            return data as PendingConfirmation;
        } catch (error) {
            return null;
        }
    }

    // =================================================
    // CONFIRM (YES) BY USER - ATOMIC OPERATION
    // =================================================
    static async confirmPendingByUser(
        companyId: string,
        userId: string
    ): Promise<PendingConfirmation | null> {
        try {
            // Atomically update from PENDING to CONFIRMED.
            // Only ONE request can win this update.
            const { data, error } = await supabase
                .from("pending_confirmations")
                .update({
                    status: "CONFIRMED",
                    confirmed_at: new Date().toISOString(),
                })
                .eq("company_id", companyId)
                .eq("user_id", userId)
                .eq("status", "PENDING")
                .gt("expires_at", new Date().toISOString()) // Not expired
                .order("created_at", { ascending: false })
                .limit(1)
                .select()
                .single();

            if (error || !data) {
                // Either no pending confirmation, or another request already confirmed it
                return null;
            }

            return data as PendingConfirmation;
        } catch (error) {
            return null;
        }
    }

    // =================================================
    // CANCEL (NO) BY USER
    // =================================================
    static async cancelPendingByUser(
        projectId: string,
        userId: string
    ): Promise<boolean> {
        try {
            // Delete old non-PENDING records first to avoid unique constraint conflicts
            await supabase
                .from("pending_confirmations")
                .delete()
                .eq("company_id", projectId)
                .eq("user_id", userId)
                .neq("status", "PENDING");

            const { error } = await supabase
                .from("pending_confirmations")
                .update({
                    status: "CANCELLED",
                    cancelled_at: new Date().toISOString(),
                })
                .eq("company_id", projectId)
                .eq("user_id", userId)
                .eq("status", "PENDING");

            if (error) {
                console.error("[CONFIRMATION] Cancel by user failed:", error);
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    // =================================================
    // GET CONFIRMATION BY ID (thin lookup)
    //
    // Used by the confirmation execution endpoint to load
    // a row by confirmationId and enforce ownership before
    // any destructive action runs.
    // =================================================
    static async getConfirmationById(
        confirmationId: string
    ): Promise<PendingConfirmation | null> {
        try {
            const { data, error } = await supabase
                .from("pending_confirmations")
                .select("*")
                .eq("id", confirmationId)
                .single();

            if (error || !data) {
                return null;
            }

            return data as PendingConfirmation;
        } catch (error) {
            return null;
        }
    }

    // =================================================
    // MARK ACTION AS EXECUTED
    // =================================================
    static async markActionExecuted(
        confirmationId: string,
        companyId: string
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from("pending_confirmations")
                .update({ action_executed: true })
                .eq("id", confirmationId)
                .eq("company_id", companyId);

            return !error;
        } catch (error) {
            return false;
        }
    }

    // =================================================
    // CANCEL (NO)
    // =================================================
    static async cancelPending(
        companyId: string,
        phone: string
    ): Promise<boolean> {
        try {
            // Delete old non-PENDING records first to avoid unique constraint conflicts
            await supabase
                .from("pending_confirmations")
                .delete()
                .eq("company_id", companyId)
                .eq("phone", phone)
                .neq("status", "PENDING");

            const { error } = await supabase
                .from("pending_confirmations")
                .update({
                    status: "CANCELLED",
                    cancelled_at: new Date().toISOString(),
                })
                .eq("company_id", companyId)
                .eq("phone", phone)
                .eq("status", "PENDING");

            if (error) {
                console.error("[CONFIRMATION] Cancel failed:", error);
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    // =================================================
    // EXPIRE CONFIRMATION
    // =================================================
    static async expireConfirmation(id: string): Promise<void> {
        try {
            await supabase
                .from("pending_confirmations")
                .update({ status: "EXPIRED" })
                .eq("id", id)
                .eq("status", "PENDING");
        } catch (error) {
            console.error("[CONFIRMATION] Expire error:", error);
        }
    }

    // =================================================
    // CANCEL ALL PENDING (helper for cleanup)
    // =================================================
    static async cancelPendingConfirmations(
        companyId: string,
        phone: string
    ): Promise<void> {
        try {
            // Delete old non-PENDING records first to avoid unique constraint conflicts
            await supabase
                .from("pending_confirmations")
                .delete()
                .eq("company_id", companyId)
                .eq("phone", phone)
                .neq("status", "PENDING");

            // Cancel any remaining PENDING confirmations
            await supabase
                .from("pending_confirmations")
                .update({
                    status: "CANCELLED",
                    cancelled_at: new Date().toISOString(),
                })
                .eq("company_id", companyId)
                .eq("phone", phone)
                .eq("status", "PENDING");
        } catch (error) {
            console.error("[CONFIRMATION] Cancel pending error:", error);
        }
    }

    // =================================================
    // CLEANUP EXPIRED CONFIRMATIONS
    // =================================================
    static async cleanupExpired(): Promise<number> {
        try {
            const { data, error } = await supabase
                .from("pending_confirmations")
                .update({ status: "EXPIRED" })
                .eq("status", "PENDING")
                .lt("expires_at", new Date().toISOString())
                .select("id");

            if (error) {
                console.error("[CONFIRMATION] Cleanup error:", error);
                return 0;
            }

            return data?.length || 0;
        } catch (error) {
            console.error("[CONFIRMATION] Cleanup error:", error);
            return 0;
        }
    }
}

export default ConfirmationService;
