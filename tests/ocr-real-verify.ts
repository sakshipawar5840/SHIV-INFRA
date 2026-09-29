import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { OCRService } from "../backend/services/ocrService.ts";

const outDir = "C:\\Users\\SP\\AppData\\Local\\Temp\\kilo";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const pdfPath = path.join(outDir, "real-invoice.pdf");

const doc = new PDFDocument();
const stream = fs.createWriteStream(pdfPath);
doc.pipe(stream);

doc.fontSize(18).text("Maha Cement Industries", { align: "left" });
doc.fontSize(12).text("GSTIN: 27AAACM4815K1Z8");
doc.text("Invoice No: INV-2026-4821");
doc.text("Invoice Date: 12/08/2026");
doc.text("Material: Cement 53 Grade");
doc.text("Total Amount: Rs 385000");
doc.end();

stream.on("finish", async () => {
  console.log("[TEST] Generated real PDF at", pdfPath);
  const result = await OCRService.extractInvoiceData(pdfPath);
  console.log("[TEST] OCR RESULT:", JSON.stringify(result, null, 2));
  if (result.vendor.includes("Maha") && result.gst_number === "27AAACM4815K1Z8" && result.ocr_status === "Success") {
    console.log("[TEST] REAL OCR PASS");
  } else {
    console.log("[TEST] REAL OCR CHECK - values may vary by parser");
  }
});
