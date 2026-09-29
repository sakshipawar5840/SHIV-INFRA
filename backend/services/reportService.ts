import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export class ReportService {
  static async generatePDF(reportName: string, data: any): Promise<string> {
    const reportsDir = path.join(process.cwd(), "uploads", "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filePath = path.join(reportsDir, `${Date.now()}-${reportName}.pdf`);
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    doc
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("SHIV INFRASTRUCTURES", { align: "center" });

    doc
      .fontSize(10)
      .fillColor("#4b5563")
      .text("Enterprise CRM & Construction ERP Management System", { align: "center" })
      .moveDown(1);

    doc
      .moveTo(50, doc.y)
      .lineTo(560, doc.y)
      .strokeColor("#e5e7eb")
      .lineWidth(1)
      .stroke()
      .moveDown(1);

    doc
      .fillColor("#0284c7")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(data.title || "Operations and Procurement Ledger Report", { align: "left" })
      .moveDown(0.5);

    doc
      .fontSize(9)
      .fillColor("#1f2937")
      .font("Helvetica-Bold")
      .text(`Generated At: `, { continued: true })
      .font("Helvetica")
      .text(new Date().toLocaleString());

    if (data.filters) {
      const filterParts = Object.entries(data.filters)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`);
      if (filterParts.length) {
        doc.moveDown(0.3);
        doc.font("Helvetica-Bold").text("Filters: ");
        doc.font("Helvetica").text(filterParts.join(" | "));
      }
    }

    doc.moveDown(1);

    if (Array.isArray(data.items) && data.items.length > 0 && data.columns) {
      const colKeys = data.columns.map((c: any) => c.key);
      const colHeaders = data.columns.map((c: any) => c.header);
      const colWidths = data.columns.map((c: any) => c.width || 15);
      const pageWidth = 510;
      const scale = pageWidth / colWidths.reduce((a: number, b: number) => a + b, 0);

      doc.font("Helvetica-Bold").fontSize(9);
      let x = 50;
      colHeaders.forEach((header: string, i: number) => {
        const w = colWidths[i] * scale;
        doc.text(header, x, doc.y, { width: w, align: "left" });
        x += w;
      });
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor("#d1d5db").stroke();
      doc.moveDown(0.3);

      doc.font("Helvetica").fontSize(8);
      data.items.forEach((item: any) => {
        x = 50;
        colKeys.forEach((key: string, i: number) => {
          const w = colWidths[i] * scale;
          const val = key === "amount" ? `INR ${Number(item[key] || 0).toLocaleString()}` : String(item[key] || "");
          doc.text(val, x, doc.y, { width: w, align: "left" });
          x += w;
        });
        doc.moveDown(0.3);
        if (doc.y > 700) doc.addPage();
      });
    } else if (Array.isArray(data.items)) {
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

    doc.moveDown(2);
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

  static async generateExcel(reportName: string, columns: any[], items: any[]): Promise<string> {
    const reportsDir = path.join(process.cwd(), "uploads", "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filePath = path.join(reportsDir, `${Date.now()}-${reportName}.xlsx`);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }));

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0284C7" },
    };

    items.forEach((item) => {
      worksheet.addRow(item);
    });

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

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
