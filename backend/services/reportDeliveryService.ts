// =====================================================
// SHIVINFRA REPORT DELIVERY SERVICE
// Handles uploading reports to Supabase Storage
// and sending them via WhatsApp
// =====================================================

import { supabaseAdmin as supabase } from "../config/supabase.ts";
import { WhatsAppService } from "./whatsappService.ts";
import fs from "fs";

export interface ReportDeliveryResult {
    success: boolean;
    message: string;
    filePath?: string;
    publicUrl?: string;
    whatsappSent?: boolean;
    error?: string;
}

export class ReportDeliveryService {
    // =================================================
    // UPLOAD REPORT TO SUPABASE STORAGE
    // =================================================
    static async uploadReportToStorage(
        filePath: string,
        companyId: string
    ): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
        try {
            // Extract just the filename from any path (handles both / and \)
            const fileName = filePath.split(/[/\\]/).pop() || "report";
            const storagePath = `reports/${companyId}/${Date.now()}-${fileName}`;

            const fileBuffer = fs.readFileSync(filePath);

            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(storagePath, fileBuffer, {
                    contentType: this.getContentType(fileName),
                    upsert: true,
                });

            if (uploadError) {
                console.error("[REPORT DELIVERY] Storage upload failed:", uploadError);
                return { success: false, error: uploadError.message };
            }

            const { data: urlData } = supabase.storage
                .from("documents")
                .getPublicUrl(storagePath);

            return {
                success: true,
                publicUrl: urlData?.publicUrl || undefined,
            };
        } catch (error: any) {
            console.error("[REPORT DELIVERY] Upload error:", error);
            return { success: false, error: error?.message || "Upload failed" };
        }
    }

    // =================================================
    // SEND REPORT VIA WHATSAPP
    // =================================================
    static async sendReportViaWhatsApp(
        phone: string,
        publicUrl: string,
        fileName: string,
        reportType: string,
        fileFormat: string
    ): Promise<boolean> {
        try {
            const caption = `📊 ${reportType} Report\nFormat: ${fileFormat}\nGenerated: ${new Date().toLocaleString()}\n\n— SHIV INFRA AI`;

            const sent = await WhatsAppService.sendDocumentMessage(
                phone,
                publicUrl,
                fileName,
                caption
            );

            return sent;
        } catch (error: any) {
            console.error("[REPORT DELIVERY] WhatsApp send error:", error);
            return false;
        }
    }

    // =================================================
    // GENERATE + UPLOAD + SEND REPORT (FULL PIPELINE)
    // =================================================
    static async generateAndDeliverReport(
        filePath: string,
        companyId: string,
        phone: string,
        reportType: string,
        fileFormat: string
    ): Promise<ReportDeliveryResult> {
        try {
            // Step 1: Upload to Supabase Storage
            const uploadResult = await this.uploadReportToStorage(filePath, companyId);

            if (!uploadResult.success || !uploadResult.publicUrl) {
                return {
                    success: false,
                    message: "Failed to upload report to storage",
                    filePath,
                    error: uploadResult.error,
                };
            }

            // Step 2: Send via WhatsApp
            const fileName = filePath.split("/").pop() || filePath.split("\\").pop() || "report";
            const whatsappSent = await this.sendReportViaWhatsApp(
                phone,
                uploadResult.publicUrl,
                fileName,
                reportType,
                fileFormat
            );

            return {
                success: true,
                message: whatsappSent
                    ? "Report generated and sent via WhatsApp"
                    : "Report generated and stored (WhatsApp delivery pending)",
                filePath,
                publicUrl: uploadResult.publicUrl,
                whatsappSent,
            };
        } catch (error: any) {
            console.error("[REPORT DELIVERY] Pipeline error:", error);
            return {
                success: false,
                message: "Report delivery failed",
                error: error?.message || "Unknown error",
            };
        }
    }

    // =================================================
    // HELPER: GET CONTENT TYPE FROM FILE EXTENSION
    // =================================================
    private static getContentType(fileName: string): string {
        const ext = fileName.split(".").pop()?.toLowerCase();
        switch (ext) {
            case "pdf":
                return "application/pdf";
            case "xlsx":
                return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "csv":
                return "text/csv";
            default:
                return "application/octet-stream";
        }
    }
}

export default ReportDeliveryService;
