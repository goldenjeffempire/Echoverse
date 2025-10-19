/**
 * Email Service
 * Supports multiple email providers: SMTP, SendGrid, AWS SES, Mailgun
 */
import { config } from '../config';
import { logger } from '../logger';
class SMTPEmailService {
    async sendEmail(options) {
        try {
            // @ts-ignore - nodemailer is an optional dependency based on email provider config
            const nodemailer = await import('nodemailer').catch(() => {
                throw new Error('nodemailer package not installed. Run: npm install nodemailer');
            });
            const transporter = nodemailer.createTransport({
                host: config.smtpHost,
                port: config.smtpPort,
                secure: config.smtpSecure,
                auth: config.smtpUser && config.smtpPass ? {
                    user: config.smtpUser,
                    pass: config.smtpPass,
                } : undefined,
            });
            await transporter.sendMail({
                from: `${config.emailFromName} <${config.emailFrom}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || options.html.replace(/<[^>]*>/g, ''),
            });
            logger.info('Email sent via SMTP', { to: options.to, subject: options.subject });
        }
        catch (error) {
            logger.error('SMTP email failed', error instanceof Error ? error : undefined);
            throw error;
        }
    }
}
class SendGridEmailService {
    async sendEmail(options) {
        if (!config.sendgridApiKey) {
            throw new Error('SendGrid API key not configured');
        }
        try {
            // @ts-ignore - @sendgrid/mail is an optional dependency based on email provider config
            const sgMail = await import('@sendgrid/mail').catch(() => {
                throw new Error('@sendgrid/mail package not installed. Run: npm install @sendgrid/mail');
            });
            sgMail.default.setApiKey(config.sendgridApiKey);
            await sgMail.default.send({
                from: `${config.emailFromName} <${config.emailFrom}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || options.html.replace(/<[^>]*>/g, ''),
            });
            logger.info('Email sent via SendGrid', { to: options.to, subject: options.subject });
        }
        catch (error) {
            logger.error('SendGrid email failed', error instanceof Error ? error : undefined);
            throw error;
        }
    }
}
class SESEmailService {
    async sendEmail(options) {
        if (!config.awsSesRegion || !config.awsSesAccessKeyId || !config.awsSesSecretAccessKey) {
            throw new Error('AWS SES credentials not configured');
        }
        try {
            // @ts-ignore - aws-sdk is an optional dependency based on email provider config
            const AWS = await import('aws-sdk').catch(() => {
                throw new Error('aws-sdk package not installed. Run: npm install aws-sdk');
            });
            const ses = new AWS.SES({
                region: config.awsSesRegion,
                accessKeyId: config.awsSesAccessKeyId,
                secretAccessKey: config.awsSesSecretAccessKey,
            });
            await ses.sendEmail({
                Source: `${config.emailFromName} <${config.emailFrom}>`,
                Destination: { ToAddresses: [options.to] },
                Message: {
                    Subject: { Data: options.subject },
                    Body: {
                        Html: { Data: options.html },
                        Text: { Data: options.text || options.html.replace(/<[^>]*>/g, '') },
                    },
                },
            }).promise();
            logger.info('Email sent via AWS SES', { to: options.to, subject: options.subject });
        }
        catch (error) {
            logger.error('AWS SES email failed', error instanceof Error ? error : undefined);
            throw error;
        }
    }
}
class MockEmailService {
    async sendEmail(options) {
        logger.info('📧 Mock Email (not actually sent)', {
            to: options.to,
            subject: options.subject,
            html: options.html.substring(0, 200) + '...',
        });
    }
}
function createEmailService() {
    if (config.mockEmail) {
        return new MockEmailService();
    }
    switch (config.emailProvider) {
        case 'smtp':
            return new SMTPEmailService();
        case 'sendgrid':
            return new SendGridEmailService();
        case 'ses':
            return new SESEmailService();
        case 'mailgun':
            throw new Error('Mailgun email service not yet implemented');
        default:
            throw new Error(`Unknown email provider: ${config.emailProvider}`);
    }
}
export const emailService = createEmailService();
export async function sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${config.appUrl}/reset-password?token=${resetToken}`;
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>We received a request to reset your password for your EchoVerse account. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p><strong>If you didn't request a password reset, you can safely ignore this email.</strong> Your password won't change unless you click the link above and create a new one.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} EchoVerse Platform. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
    </html>
  `;
    await emailService.sendEmail({
        to: email,
        subject: 'Reset Your Password - EchoVerse',
        html,
    });
}
export async function sendEmailVerificationEmail(email, verificationToken) {
    const verificationUrl = `${config.appUrl}/verify-email?token=${verificationToken}`;
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Welcome to EchoVerse!</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p>If you didn't create an account with EchoVerse, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} EchoVerse Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
    await emailService.sendEmail({
        to: email,
        subject: 'Verify Your Email - EchoVerse',
        html,
    });
}
export async function send2FAEmail(email, code) {
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: white; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Two-Factor Authentication</h1>
          </div>
          <div class="content">
            <p>Your two-factor authentication code is:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, please secure your account immediately.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} EchoVerse Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
    await emailService.sendEmail({
        to: email,
        subject: 'Your 2FA Code - EchoVerse',
        html,
    });
}
// PHASE 3: Magic Link Email
export async function sendMagicLinkEmail(email, token) {
    const appUrl = config.appUrl || 'http://localhost:5000';
    const magicLink = `${appUrl}/auth/magic-link?token=${token}`;
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 15px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .link { word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-size: 12px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Sign in to Your Account</h1>
          </div>
          <div class="content">
            <p>Click the button below to sign in securely:</p>
            <div style="text-align: center;">
              <a href="${magicLink}" class="button">Sign In</a>
            </div>
            <p>Or copy and paste this link:</p>
            <div class="link">${magicLink}</div>
            <p><strong>This link expires in 15 minutes.</strong></p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} EchoVerse Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
    await emailService.sendEmail({
        to: email,
        subject: 'Your Magic Sign-in Link - EchoVerse',
        html,
    });
}
