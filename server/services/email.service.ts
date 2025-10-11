import nodemailer from 'nodemailer';
import { logger } from '../logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  data?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
}

interface EmailDeliveryStatus {
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending: string[];
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private enabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        } : undefined
      };

      if (smtpConfig.auth) {
        this.transporter = nodemailer.createTransport(smtpConfig);
        await this.transporter.verify();
        this.enabled = true;
        logger.info('Email service initialized successfully');
      } else {
        logger.warn('Email service not configured - emails will be logged only');
        this.enabled = false;
      }
    } catch (error) {
      logger.error('Failed to initialize email service', error as Error);
      this.enabled = false;
    }
  }

  async send(options: EmailOptions): Promise<EmailDeliveryStatus | null> {
    try {
      const from = process.env.EMAIL_FROM || 'noreply@echoverse.com';
      const fromName = process.env.EMAIL_FROM_NAME || 'EchoVerse Platform';

      const mailOptions = {
        from: `"${fromName}" <${from}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments
      };

      if (!this.enabled || !this.transporter) {
        logger.info('Email would be sent (disabled):', mailOptions);
        return null;
      }

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to: mailOptions.to,
        subject: options.subject
      });

      return {
        messageId: info.messageId,
        accepted: info.accepted as string[],
        rejected: info.rejected as string[],
        pending: info.pending as string[]
      };
    } catch (error) {
      logger.error('Failed to send email', error as Error, {
        to: options.to,
        subject: options.subject
      });
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, username: string) {
    return this.send({
      to: email,
      subject: 'Welcome to EchoVerse!',
      html: `
        <h1>Welcome ${username}!</h1>
        <p>Thank you for joining EchoVerse Platform.</p>
        <p>Get started by exploring our AI-powered features.</p>
        <a href="${process.env.APP_URL}/dashboard">Go to Dashboard</a>
      `,
      text: `Welcome ${username}! Thank you for joining EchoVerse Platform.`
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    
    return this.send({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      text: `Password reset link: ${resetUrl} (expires in 1 hour)`
    });
  }

  async sendOrderConfirmation(email: string, orderId: string, orderDetails: any) {
    return this.send({
      to: email,
      subject: `Order Confirmation #${orderId}`,
      html: `
        <h2>Order Confirmed!</h2>
        <p>Thank you for your order #${orderId}</p>
        <p>Order total: $${orderDetails.total}</p>
        <p>We'll send you a shipping confirmation when your order ships.</p>
      `,
      text: `Order #${orderId} confirmed. Total: $${orderDetails.total}`
    });
  }

  async trackBounce(email: string) {
    logger.warn('Email bounced', { email });
    // TODO: Mark email as bounced in database
    // TODO: Implement bounce handling logic
  }

  async handleUnsubscribe(email: string) {
    logger.info('User unsubscribed', { email });
    // TODO: Update user preferences in database
    // TODO: Add to unsubscribe list
  }
}

export const emailService = new EmailService();
