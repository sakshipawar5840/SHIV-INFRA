import { createWorker } from "tesseract.js";
import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

const NODE_ENV = process.env.NODE_ENV || "development";

export interface OCRExtractionResult {
  vendor: string;
  gst_number: string;
  invoice_number: string;
  amount: number;
  bill_date: string;
  material: string;
  text: string;
  ocr_status: "Success" | "Failed";
}

export class OCRService {
  /**
   * Processes a file (image or pdf) to extract billing elements
   */
  static async extractInvoiceData(filePath: string): Promise<OCRExtractionResult> {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === ".pdf") {
      console.log(`[SHIVINFRA OCR] Extracting text from PDF: ${filePath}`);
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const uint8Data = new Uint8Array(dataBuffer);
        const parser = new PDFParse(uint8Data);
        const result = await parser.getText();
        const text = result.text || "";
        
        console.log("[SHIVINFRA OCR] PDF text extracted successfully:", text.substring(0, 150));
        
        if (!text || text.trim().length === 0) {
          return {
            vendor: "",
            gst_number: "",
            invoice_number: "",
            amount: 0,
            bill_date: "",
            material: "",
            text: "",
            ocr_status: "Failed"
          };
        }
        
        return this.parseExtractedText(text);
      } catch (error) {
        console.error("[SHIVINFRA OCR] PDF extraction failed:", error);
        return {
          vendor: "",
          gst_number: "",
          invoice_number: "",
          amount: 0,
          bill_date: "",
          material: "",
          text: "",
          ocr_status: "Failed"
        };
      }
    }

    try {
      console.log(`[SHIVINFRA OCR] Executing OCR on image: ${filePath}`);
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(filePath);
      await worker.terminate();

      console.log("[SHIVINFRA OCR] Text extracted successfully:", text.substring(0, 150));
      const parsed = this.parseExtractedText(text);
      parsed.text = text;
      return parsed;
    } catch (error) {
      console.error("[SHIVINFRA OCR] Error processing image with Tesseract:", error);
      return {
        vendor: "",
        gst_number: "",
        invoice_number: "",
        amount: 0,
        bill_date: "",
        material: "",
        text: "",
        ocr_status: "Failed"
      };
    }
  }

  /**
   * Parses raw OCR string structures using regular expressions
   */
  private static parseExtractedText(text: string): OCRExtractionResult {
    const lines = text.split("\n");
    
    let vendor = "";
    let gst_number = "";
    let invoice_number = "";
    let amount = 0;
    let bill_date = "";
    let material = "";

    // 1. Parse GSTIN (Standard Indian GSTIN format)
    const gstMatch = text.match(/\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/i);
    if (gstMatch) {
      gst_number = gstMatch[0].toUpperCase();
    }

    // 2. Parse Vendor / Company names from common prefixes
    for (const line of lines) {
      if (line.toLowerCase().includes("cement") || line.toLowerCase().includes("steel") || line.toLowerCase().includes("infra") || line.toLowerCase().includes("sand")) {
        vendor = line.trim();
        break;
      }
    }

    // 3. Parse Invoice Numbers
    const invMatch = text.match(/(?:invoice|bill|challan|inv)(?:\s*(?:no|num|#))?\s*[:\-]?\s*([A-Za-z0-9\-/\\]+)/i);
    if (invMatch) {
      invoice_number = invMatch[1];
    }

    // 4. Parse Total amount values
    const amountMatch = text.match(/(?:total|amount|net|sum|payable|gros)\s*[:\-]?\s*(?:inr|rs|₹)?\s*([0-9,]+(?:\.\d{2})?)/i);
    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ""));
    }

    // 5. Material categorization
    const textLower = text.toLowerCase();
    if (textLower.includes("cement")) {
      material = "Cement 53 Grade";
    } else if (textLower.includes("steel") || textLower.includes("tmt")) {
      material = "TMT Steel Bars";
    } else if (textLower.includes("sand") || textLower.includes("river")) {
      material = "River Sand";
    } else if (textLower.includes("brick") || textLower.includes("block")) {
      material = "Red Clay Bricks";
    }

    // 6. Parse Date formats
    const dateMatch = text.match(/(?:date|dt|invoice date)\s*[:\-]?\s*(\d{2}[/\-]\d{2}[/\-]\d{4}|\d{4}[/\-]\d{2}[/\-]\d{2})/i);
    if (dateMatch) {
      bill_date = dateMatch[1];
    }

    return {
      vendor,
      gst_number,
      invoice_number,
      amount,
      bill_date,
      material,
      text,
      ocr_status: "Success"
    };
  }

  /**
   * Generates mock fallback data for material invoices
   * ONLY FOR DEVELOPMENT/TESTING - NOT FOR PRODUCTION
   */
  static simulateOCR(filePath: string, type: "PDF" | "IMAGE"): OCRExtractionResult {
    if (NODE_ENV === "production") {
      console.error("[SHIVINFRA OCR] simulateOCR called in production - returning empty result");
      return {
        vendor: "",
        gst_number: "",
        invoice_number: "",
        amount: 0,
        bill_date: "",
        material: "",
        text: "",
        ocr_status: "Failed"
      };
    }
    
    const filename = path.basename(filePath).toLowerCase();
    
    let vendor = "Maha Cement Industries";
    let material = "Cement 53 Grade";
    let amount = 385000;
    let gst_number = "27AAACM4815K1Z8";

    if (filename.includes("steel") || filename.includes("tata")) {
      vendor = "Tata Tiscon Steel Dealers";
      material = "Steel Reinforcement";
      amount = 750000;
      gst_number = "27AAACT9012J2Z9";
    } else if (filename.includes("sand") || filename.includes("aggregate")) {
      vendor = "Sahyadri Stone Crushers";
      material = "River Sand Aggregates";
      amount = 125000;
      gst_number = "27AAACS1029C1Z3";
    }

    return {
      vendor,
      gst_number,
      invoice_number: "INV-2026-" + Math.floor(1000 + Math.random() * 9000),
      amount,
      bill_date: new Date().toISOString().split("T")[0],
      material,
      text: "",
      ocr_status: "Success"
    };
  }
}
export default OCRService;
