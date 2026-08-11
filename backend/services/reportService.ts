import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export class ReportService {
  /**
   * Generates a corporate PDF document compiling project and billing analytics
   */
  static async generatePDF(reportName: string, data: any): Promise<string> {
    const reportsDir = path.join(process.cwd(), "uploads", "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filePath = path.join(reportsDir, `${Date.now()}-${reportName}.pdf`);
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // 1. Draw Brand Header
    doc
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .fontSize(24)
      .text("SHIV INFRASTRUCTURES", { align: "center" });
    
    doc
      .fontSize(10)
      .fillColor("#4b5563")
      .text("Enterprise CRM & Construction ERP Management System", { align: "center" })
      .moveDown(1.5);

    // 2. Draw Decorative Border Line
    doc
      .moveTo(50, 110)
      .lineTo(560, 110)
      .strokeColor("#e5e7eb")
      .lineWidth(1)
      .stroke()
      .moveDown(2);

    // 3. Document Title
    doc
      .fillColor("#0284c7")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(data.title || "Operations and Procurement Ledger Report", { align: "left" })
      .moveDown(1);

    // 4. Metadata Details Block
    doc
      .fontSize(10)
      .fillColor("#1f2937")
      .font("Helvetica-Bold")
      .text(`Generated At: `, { continued: true })
      .font("Helvetica")
      .text(new Date().toLocaleString())
      .font("Helvetica-Bold")
      .text(`Corporate Identity: `, { continued: true })
      .font("Helvetica")
      .text("shivinfra55@gmail.com")
      .font("Helvetica-Bold")
      .text(`Active Tenant: `, { continued: true })
      .font("Helvetica")
      .text("SHIVINFRA Developers Ltd")
      .moveDown(2);

    // 5. Render Core Data Tables
    doc
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Audit Roster Summary Table:", { underline: true })
      .moveDown(0.5);

    if (Array.isArray(data.items)) {
      doc.font("Helvetica-Bold").fontSize(10);
      doc.text("ID            Description                          Total Amount", { wordSpacing: 10 });
      doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor("#d1d5db").stroke();
      doc.font("Helvetica").fontSize(9).moveDown(0.5);

      data.items.forEach((item: any, idx: number) => {
        const idCol = String(item.id || idx).padEnd(12);
        const descCol = String(item.name || item.vendor || item.category || "Item").padEnd(36).substring(0, 36);
        const amtCol = "INR " + (item.price || item.amount || 0).toLocaleString();
        
        doc.text(`${idCol}  ${descCol}  ${amtCol}`);
        if (doc.y > 700) doc.addPage();
      });
    }

    // Footer signature lines
    doc.moveDown(3);
    doc
      .fontSize(9)
      .fillColor("#6b7280")
      .text("Authorized Executive Signatory: ________________________", { align: "right" });

    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => resolve(filePath));
      writeStream.on("error", (err) => reject(err));
    });
  }

  /**
   * Generates a standard Excel spreadsheet compiling dataset records
   */
  static async generateExcel(reportName: string, columns: any[], items: any[]): Promise<string> {
    const reportsDir = path.join(process.cwd(), "uploads", "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filePath = path.join(reportsDir, `${Date.now()}-${reportName}.xlsx`);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Operational Ledger");

    // Configure Excel Headers
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }));

    // Insert Item Rows
    items.forEach((item) => {
      worksheet.addRow(item);
    });

    // Style headers cleanly
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0284C7" }, // Sky corporate blue
    };

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  /**
   * Generates raw CSV formatted strings
   */
  static generateCSV(columns: any[], items: any[]): string {
    const headerRow = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(",");
    const bodyRows = items.map((item) => {
      return columns
        .map((col) => {
          const val = item[col.key] !== undefined ? String(item[col.key]) : "";
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",");
    });

    return [headerRow, ...bodyRows].join("\n");
  }
}
export default ReportService;
