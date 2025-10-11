/**
 * Payment Receipt PDF Generator
 * Creates professional invoices for orders
 */
import PDFDocument from 'pdfkit';
import { db } from '../db';
import { orders, users, websites } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../logger';
export class ReceiptGenerator {
    static async generatePDF(orderId) {
        try {
            const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
            if (!order) {
                throw new Error('Order not found');
            }
            const [user] = await db.select().from(users).where(eq(users.id, order.userId));
            const [website] = order.websiteId
                ? await db.select().from(websites).where(eq(websites.id, order.websiteId))
                : [null];
            const receiptData = {
                orderId: order.id,
                orderNumber: order.orderNumber,
                date: order.createdAt,
                customer: {
                    name: user?.username || 'Guest',
                    email: user?.email || 'N/A',
                    address: order.shippingAddress || undefined
                },
                items: order.items.map((item) => ({
                    name: item.name || 'Product',
                    quantity: item.quantity || 1,
                    price: item.price || 0,
                    total: (item.quantity || 1) * (item.price || 0)
                })),
                subtotal: order.totalAmount,
                tax: order.totalAmount * 0.1,
                total: order.totalAmount * 1.1,
                paymentMethod: order.paymentMethod || 'Card',
                businessInfo: {
                    name: website?.name || 'SmartAgentOS Platform',
                    address: '123 Business St, Tech City, TC 12345',
                    email: 'support@smartagentos.com',
                    phone: '+1 (555) 123-4567'
                }
            };
            return this.createPDFDocument(receiptData);
        }
        catch (error) {
            logger.error('Receipt generation failed', {
                orderId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    static createPDFDocument(data) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);
            doc.fontSize(20).text('RECEIPT', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10);
            doc.text(data.businessInfo.name, { align: 'left' });
            doc.text(data.businessInfo.address);
            doc.text(data.businessInfo.email);
            if (data.businessInfo.phone) {
                doc.text(data.businessInfo.phone);
            }
            doc.moveDown();
            doc.text(`Receipt #: ${data.orderNumber}`, { align: 'right' });
            doc.text(`Date: ${data.date.toLocaleDateString()}`, { align: 'right' });
            doc.text(`Order ID: ${data.orderId}`, { align: 'right' });
            doc.moveDown();
            doc.fontSize(12).text('Bill To:', { underline: true });
            doc.fontSize(10);
            doc.text(data.customer.name);
            doc.text(data.customer.email);
            if (data.customer.address) {
                doc.text(data.customer.address);
            }
            doc.moveDown();
            doc.fontSize(12).text('Items', { underline: true });
            doc.moveDown(0.5);
            const tableTop = doc.y;
            doc.fontSize(10);
            doc.text('Item', 50, tableTop);
            doc.text('Qty', 300, tableTop);
            doc.text('Price', 370, tableTop);
            doc.text('Total', 450, tableTop);
            doc.moveDown();
            let currentY = doc.y;
            data.items.forEach(item => {
                doc.text(item.name, 50, currentY);
                doc.text(item.quantity.toString(), 300, currentY);
                doc.text(`$${item.price.toFixed(2)}`, 370, currentY);
                doc.text(`$${item.total.toFixed(2)}`, 450, currentY);
                currentY += 20;
            });
            doc.moveDown(2);
            const summaryX = 370;
            doc.text(`Subtotal:`, summaryX, doc.y);
            doc.text(`$${data.subtotal.toFixed(2)}`, 450, doc.y);
            doc.moveDown(0.5);
            doc.text(`Tax (10%):`, summaryX, doc.y);
            doc.text(`$${data.tax.toFixed(2)}`, 450, doc.y);
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Total:`, summaryX, doc.y, { underline: true });
            doc.text(`$${data.total.toFixed(2)}`, 450, doc.y, { underline: true });
            doc.fontSize(10);
            doc.moveDown();
            doc.text(`Payment Method: ${data.paymentMethod}`);
            doc.moveDown(2);
            doc.fontSize(8).text('Thank you for your business! If you have any questions, please contact us.', { align: 'center' });
            doc.end();
        });
    }
    static async emailReceipt(orderId, email) {
        try {
            const pdfBuffer = await this.generatePDF(orderId);
            // FIXED AUDIT #159: Integrate with email service
            const { sendEmail } = await import('../services/email');
            await sendEmail({
                to: email,
                subject: `Receipt for Order #${orderId.substring(0, 8)}`,
                html: `
          <h2>Thank you for your order!</h2>
          <p>Please find your receipt attached.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The EchoVerse Team</p>
        `,
                attachments: [{
                        filename: `receipt-${orderId}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }]
            });
            logger.info('Receipt emailed successfully', {
                orderId,
                recipientEmail: email,
                size: pdfBuffer.length
            });
        }
        catch (error) {
            logger.error('Failed to email receipt', {
                orderId,
                email,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
}
