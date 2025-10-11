/**
 * LOW-025: Export to PDF - Backend Integration
 */
import PDFDocument from 'pdfkit';
import { Response } from 'express';

export interface ReportData {
  title: string;
  generatedAt: Date;
  sections: ReportSection[];
  metadata?: Record<string, any>;
}

export interface ReportSection {
  heading: string;
  content: string | string[];
  data?: any[];
}

export async function generatePDFReport(data: ReportData, res: Response) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${data.title.replace(/\s+/g, '_')}.pdf"`);

  doc.pipe(res);

  // Header
  doc.fontSize(24).text(data.title, { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Generated: ${data.generatedAt.toLocaleString()}`, { align: 'center' });
  doc.moveDown(2);

  // Sections
  for (const section of data.sections) {
    doc.fontSize(16).text(section.heading, { underline: true });
    doc.moveDown(0.5);

    if (typeof section.content === 'string') {
      doc.fontSize(12).text(section.content);
    } else {
      section.content.forEach(line => {
        doc.fontSize(12).text(`• ${line}`);
      });
    }

    if (section.data && section.data.length > 0) {
      doc.moveDown(0.5);
      
      // Simple table rendering
      const headers = Object.keys(section.data[0]);
      const colWidth = (doc.page.width - 100) / headers.length;
      
      let y = doc.y;
      
      // Table headers
      headers.forEach((header, i) => {
        doc.fontSize(10).text(header, 50 + i * colWidth, y, { width: colWidth, continued: i < headers.length - 1 });
      });
      
      doc.moveDown();
      y = doc.y;
      
      // Table rows
      section.data.forEach(row => {
        headers.forEach((header, i) => {
          doc.fontSize(10).text(String(row[header] || ''), 50 + i * colWidth, y, { width: colWidth, continued: i < headers.length - 1 });
        });
        doc.moveDown();
        y = doc.y;
      });
    }

    doc.moveDown(1.5);
  }

  // Footer
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).text(
      `Page ${i + 1} of ${pages.count}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
  }

  doc.end();
}

export async function generateExcelReport(data: any[], filename: string, res: Response) {
  // Note: This would require xlsx library
  // For now, generate CSV format which Excel can open
  const headers = Object.keys(data[0] || {});
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send(csv);
}
