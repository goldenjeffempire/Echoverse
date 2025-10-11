/**
 * Report Export Utilities (CSV/PDF)
 * Issue #69: Add report export using json2csv and pdfkit
 */
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { logger } from '../logger';
/**
 * Export data as CSV
 */
export function exportCSV(res, report) {
    try {
        const parser = new Parser({
            fields: report.fields,
            header: true
        });
        const csv = parser.parse(report.data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${report.title}.csv"`);
        res.send(csv);
    }
    catch (error) {
        logger.error('CSV export error', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({ error: 'Failed to export CSV' });
    }
}
/**
 * Export data as PDF
 */
export function exportPDF(res, report) {
    try {
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${report.title}.pdf"`);
        doc.pipe(res);
        // Title
        doc.fontSize(20).text(report.title, { align: 'center' });
        doc.moveDown();
        // Date
        doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown(2);
        // Table headers
        if (report.fields && report.data.length > 0) {
            const headers = report.headers || {};
            const columnWidth = 500 / report.fields.length;
            let xPos = 50;
            doc.fontSize(12).fillColor('black');
            report.fields.forEach((field) => {
                doc.text(headers[field] || field, xPos, doc.y, {
                    width: columnWidth,
                    align: 'left'
                });
                xPos += columnWidth;
            });
            doc.moveDown();
            doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);
            // Table rows
            doc.fontSize(10);
            report.data.forEach((row, idx) => {
                xPos = 50;
                const yStart = doc.y;
                report.fields.forEach((field) => {
                    const value = row[field]?.toString() || '';
                    doc.text(value, xPos, yStart, {
                        width: columnWidth,
                        align: 'left'
                    });
                    xPos += columnWidth;
                });
                doc.moveDown(0.5);
                // Add page break if needed
                if (doc.y > 700) {
                    doc.addPage();
                }
            });
        }
        // Footer
        doc.fontSize(8).fillColor('gray');
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.text(`Page ${i + 1} of ${pageCount}`, 50, 750, { align: 'center' });
        }
        doc.end();
    }
    catch (error) {
        logger.error('PDF export error', error instanceof Error ? error : new Error(String(error)));
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to export PDF' });
        }
    }
}
/**
 * Export data based on format parameter
 */
export function exportReport(res, report, format = 'csv') {
    if (format === 'pdf') {
        exportPDF(res, report);
    }
    else {
        exportCSV(res, report);
    }
}
