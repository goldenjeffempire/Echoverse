/**
 * Production Email Service with SendGrid/SES Support
 * FIX: HIGH-006 - Configure production email service
 */

import sgMail from '@sendgrid/mail';
import { SES } from '@aws-sdk/client-ses';
import { logger } from '../logger';

type EmailProvider = 'sendgrid' | 'ses' | 'mock';

const EMAIL_CONFIG = {
  provider: (process.env.EMAIL_PROVIDER || 'mock') as EmailProvider,
  fromEmail: process.env.FROM_EMAIL || 'noreply@echoverse.app',
  fromName: process.env.FROM_NAME || 'EchoVerse',
  replyTo: process.env.REPLY_TO_EMAIL || 'support@echoverse.app',
};

// HIGH-001 FIX: Validate SendGrid API key on startup
if (EMAIL_CONFIG.provider === 'sendgrid') {
  if (!process.env.SENDGRID_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SENDGRID_API_KEY required for production email service');
    }
    logger.warn('SendGrid API key not configured - falling back to mock mode');
    EMAIL_CONFIG.provider = 'mock';
  } else {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    logger.info('SendGrid email provider initialized and validated');
  }
}

// AWS SES setup
const sesClient = EMAIL_CONFIG.provider === 'ses' ? new SES({
  region: process.env.AWS_SES_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY || ''
  }
}) : null;

if (sesClient) {
  logger.info('AWS SES email provider initialized');
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  replyTo?: string;
}

/**
 * HIGH-001 FIX: Send email with automatic fallback and retry queue
 */
export async function sendEmail(options: EmailOptions, retryCount = 0): Promise<void> {
  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  const MAX_RETRIES = 3;

  try {
    // Try primary provider
    if (EMAIL_CONFIG.provider === 'sendgrid') {
      await sendWithSendGrid(options);
    } else if (EMAIL_CONFIG.provider === 'ses') {
      await sendWithSES(options);
    } else {
      // Mock mode for development
      logger.info('Mock email sent', {
        to: recipients,
        subject: options.subject
      });
    }

    logger.info('Email sent successfully', {
      provider: EMAIL_CONFIG.provider,
      to: recipients,
      subject: options.subject,
      retryCount
    });
  } catch (error) {
    logger.error('Email send failed', error instanceof Error ? error : undefined, {
      provider: EMAIL_CONFIG.provider,
      to: recipients,
      subject: options.subject,
      retryCount
    });

    // HIGH-001 FIX: Automatic fallback to alternative provider
    if (EMAIL_CONFIG.provider === 'sendgrid' && sesClient && retryCount === 0) {
      logger.warn('Falling back to SES email provider');
      EMAIL_CONFIG.provider = 'ses';
      return sendEmail(options, retryCount + 1);
    } else if (EMAIL_CONFIG.provider === 'ses' && process.env.SENDGRID_API_KEY && retryCount === 0) {
      logger.warn('Falling back to SendGrid email provider');
      EMAIL_CONFIG.provider = 'sendgrid';
      return sendEmail(options, retryCount + 1);
    }

    // HIGH-001 FIX: Queue for retry if both providers fail
    if (retryCount < MAX_RETRIES) {
      logger.warn(`Queueing email for retry (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await queueEmailForRetry(options, retryCount + 1);
    } else {
      // Move to dead letter queue after max retries
      logger.error('Email failed after max retries - moving to DLQ', error instanceof Error ? error : undefined);
      await moveEmailToDeadLetterQueue(options, error);
    }
    
    throw error;
  }
}

/**
 * HIGH-001 FIX: Queue email for retry with exponential backoff
 */
async function queueEmailForRetry(options: EmailOptions, retryCount: number): Promise<void> {
  const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Cap at 30 seconds
  
  setTimeout(async () => {
    try {
      await sendEmail(options, retryCount);
    } catch (error) {
      logger.error('Retry email send failed', error instanceof Error ? error : undefined);
    }
  }, delay);
  
  logger.info('Email queued for retry', { delay, retryCount });
}

/**
 * HIGH-001 FIX: Move failed emails to dead letter queue for manual review
 */
async function moveEmailToDeadLetterQueue(options: EmailOptions, error: unknown): Promise<void> {
  // In production, this would write to database or external queue
  logger.error('Email moved to Dead Letter Queue', error instanceof Error ? error : undefined, {
    to: options.to,
    subject: options.subject,
    timestamp: new Date().toISOString()
  });
  
  // TODO: Store in database table for admin UI visibility
}

/**
 * Send email via SendGrid
 */
async function sendWithSendGrid(options: EmailOptions): Promise<void> {
  const msg: any = {
    to: options.to,
    from: {
      email: EMAIL_CONFIG.fromEmail,
      name: EMAIL_CONFIG.fromName
    },
    subject: options.subject,
    text: options.text,
    html: options.html,
    replyTo: options.replyTo || EMAIL_CONFIG.replyTo,
    attachments: options.attachments?.map(att => ({
      filename: att.filename,
      content: att.content.toString('base64'),
      type: att.contentType,
      disposition: 'attachment'
    }))
  };

  await sgMail.send(msg);
}

/**
 * Send email via AWS SES
 */
async function sendWithSES(options: EmailOptions): Promise<void> {
  if (!sesClient) {
    throw new Error('SES client not initialized');
  }

  const destinations = Array.isArray(options.to) ? options.to : [options.to];

  const params = {
    Source: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`,
    Destination: {
      ToAddresses: destinations
    },
    Message: {
      Subject: {
        Data: options.subject,
        Charset: 'UTF-8'
      },
      Body: {
        Text: options.text ? {
          Data: options.text,
          Charset: 'UTF-8'
        } : undefined,
        Html: options.html ? {
          Data: options.html,
          Charset: 'UTF-8'
        } : undefined
      }
    },
    ReplyToAddresses: [options.replyTo || EMAIL_CONFIG.replyTo]
  };

  await sesClient.sendEmail(params);
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(to: string, userName: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Welcome to EchoVerse!',
    html: `
      <h1>Welcome to EchoVerse, ${userName}!</h1>
      <p>We're excited to have you on board.</p>
      <p>Get started by exploring our features:</p>
      <ul>
        <li>AI Website Builder</li>
        <li>E-commerce Platform</li>
        <li>Content Management System</li>
        <li>Community Hub</li>
        <li>Marketing Automation</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Happy building!</p>
    `,
    text: `Welcome to EchoVerse, ${userName}! We're excited to have you on board.`
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  expiresInMinutes: number
): Promise<void> {
  const resetUrl = `${process.env.PUBLIC_URL}/auth/reset-password?token=${resetToken}`;

  await sendEmail({
    to,
    subject: 'Reset Your Password',
    html: `
      <h1>Password Reset Request</h1>
      <p>We received a request to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in ${expiresInMinutes} minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
    text: `Password reset requested. Visit: ${resetUrl} (expires in ${expiresInMinutes} minutes)`
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  to: string,
  orderDetails: {
    orderId: string;
    total: number;
    items: Array<{ name: string; quantity: number; price: number }>;
  }
): Promise<void> {
  const itemsList = orderDetails.items
    .map(item => `<li>${item.name} x${item.quantity} - $${item.price.toFixed(2)}</li>`)
    .join('');

  await sendEmail({
    to,
    subject: `Order Confirmation #${orderDetails.orderId}`,
    html: `
      <h1>Order Confirmed!</h1>
      <p>Thank you for your order. Here are the details:</p>
      <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
      <h3>Items:</h3>
      <ul>${itemsList}</ul>
      <p><strong>Total:</strong> $${orderDetails.total.toFixed(2)}</p>
      <p>We'll send you another email when your order ships.</p>
    `,
    text: `Order confirmed! Order ID: ${orderDetails.orderId}. Total: $${orderDetails.total.toFixed(2)}`
  });
}

/**
 * Validate email configuration
 */
export function validateEmailConfig(): {
  valid: boolean;
  provider: EmailProvider;
  errors: string[];
} {
  const errors: string[] = [];

  if (EMAIL_CONFIG.provider === 'sendgrid' && !process.env.SENDGRID_API_KEY) {
    errors.push('SENDGRID_API_KEY not configured');
  }

  if (EMAIL_CONFIG.provider === 'ses') {
    if (!process.env.AWS_SES_REGION) errors.push('AWS_SES_REGION not configured');
    if (!process.env.AWS_SES_ACCESS_KEY_ID) errors.push('AWS_SES_ACCESS_KEY_ID not configured');
    if (!process.env.AWS_SES_SECRET_ACCESS_KEY) errors.push('AWS_SES_SECRET_ACCESS_KEY not configured');
  }

  if (!EMAIL_CONFIG.fromEmail) {
    errors.push('FROM_EMAIL not configured');
  }

  return {
    valid: errors.length === 0,
    provider: EMAIL_CONFIG.provider,
    errors
  };
}
