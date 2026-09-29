// =====================================================
// SHIVINFRA — SERVER-SIDE JWT REVOCATION SERVICE
//
// Minimal revocation store for logout. Tokens are stateless
// JWTs; this table lets the server reject a specific token
// (by jti) after logout without invalidating every token
// issued to the user.
//
// Access: service-role client only. RLS blocks all direct
// client access (USING false / WITH CHECK false).
// =====================================================

import { supabaseAdmin as supabase } from "../config/supabase.ts";

export interface RevokedToken {
    id: string;
    jti: string;
    user_id: string | null;
    revoked_at: string;
    expires_at: string;
}

const REVOKED_TTL_MS = 8 * 60 * 60 * 1000; // matches JWT expiresIn

export class RevokedTokenService {
    // =================================================
    // REVOKE A TOKEN
    //
    // Idempotent: revoking an already-revoked jti is a
    // no-op (ON CONFLICT DO NOTHING).
    // =================================================
    static async revoke(
        jti: string,
        userId: string | null,
        expiresAt: Date
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from("revoked_tokens")
                .insert({
                    jti,
                    user_id: userId,
                    revoked_at: new Date().toISOString(),
                    expires_at: expiresAt.toISOString(),
                });
            if (error) {
                console.error("[REVOCATION] Revoke failed:", error.message);
                return false;
            }
            return true;
        } catch (error: any) {
            console.error("[REVOCATION] Revoke error:", error.message);
            return false;
        }
    }

    // =================================================
    // CHECK WHETHER A jti IS REVOKED
    //
    // Single point query on idx_revoked_tokens_jti.
    // =================================================
    static async isRevoked(jti: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from("revoked_tokens")
                .select("jti")
                .eq("jti", jti)
                .maybeSingle();
            if (error) {
                console.error("[REVOCATION] Lookup failed:", error.message);
                return false;
            }
            return !!data;
        } catch (error: any) {
            console.error("[REVOCATION] Lookup error:", error.message);
            return false;
        }
    }

    // =================================================
    // CLEANUP EXPIRED REVOCATIONS
    //
    // A revoked token is only meaningful until its natural
    // JWT expiry. After that the JWT itself is rejected, so
    // the revocation row can be safely deleted.
    // =================================================
    static async cleanupExpired(): Promise<number> {
        try {
            const { data, error } = await supabase
                .from("revoked_tokens")
                .delete()
                .lt("expires_at", new Date().toISOString())
                .select("jti");
            if (error) {
                console.error("[REVOCATION] Cleanup failed:", error.message);
                return 0;
            }
            return data?.length || 0;
        } catch (error: any) {
            console.error("[REVOCATION] Cleanup error:", error.message);
            return 0;
        }
    }
}

export default RevokedTokenService;