
import { UserRole, User } from "@shared/schema";
import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export class EmailService {
  private readonly fromEmail = "noreply@echoverse.ai";
  private readonly supportEmail = "support@echoverse.ai";
  private resend: Resend | null = null;
  
  constructor() {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set, email functionality will be limited to console logs");
    } else {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      console.log("Email service initialized with Resend");
    }
  }
  
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (this.resend) {
        await this.resend.emails.send({
          from: this.fromEmail,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
      } else {
        // Fallback to console logging for development
        console.log("========== EMAIL SENT ==========");
        console.log(`To: ${options.to}`);
        console.log(`From: ${this.fromEmail}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Text content: ${options.text}`);
        console.log("===============================");
      }
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendParentApprovalEmail(childUsername: string, parentEmail: string, approvalToken: string): Promise<boolean> {
    const approvalLink = `${process.env.BASE_URL || 'http://localhost:5000'}/api/approve-minor/${approvalToken}`;
    
    const subject = `Echoverse: Parental Approval Required for ${childUsername}`;
    
    const text = `
      Hello,
      
      Your child ${childUsername} has requested to create an account on Echoverse, an AI-powered workspace platform.
      
      As they are under 18, we require your approval before they can use our services.
      
      To approve their account, please click on the following link:
      ${approvalLink}
      
      If you did not request this approval or have any questions, please contact our support team at ${this.supportEmail}.
      
      Thank you,
      The Echoverse Team
    `;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #7c3aed; color: white; padding: 10px 20px; border-radius: 5px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
          .button { display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; 
                   text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Echoverse: Parental Approval Required</h2>
          </div>
          
          <p>Hello,</p>
          
          <p>Your child <strong>${childUsername}</strong> has requested to create an account on Echoverse, an AI-powered workspace platform.</p>
          
          <p>As they are under 18, we require your approval before they can use our services.</p>
          
          <p>To approve their account, please click the button below:</p>
          
          <a href="${approvalLink}" class="button">Approve Account</a>
          
          <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
          <p>${approvalLink}</p>
          
          <p>If you did not request this approval or have any questions, please contact our support team at ${this.supportEmail}.</p>
          
          <div class="footer">
            <p>Thank you,<br>The Echoverse Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail({
      to: parentEmail,
      subject,
      text,
      html
    });
  }
  
  async sendWelcomeEmail(user: User): Promise<boolean> {
    const subject = `Welcome to Echoverse, ${user.username}!`;
    
    let roleSpecificContent = '';
    
    switch (user.role) {
      case UserRole.SCHOOL:
        roleSpecificContent = 'We\'ve prepared a set of educational tools to help you in your learning journey.';
        break;
      case UserRole.WORK:
        roleSpecificContent = 'Your business workspace is ready with productivity tools to enhance your workflow.';
        break;
      case UserRole.PERSONAL:
        roleSpecificContent = 'Your personal AI assistant is ready to help you with creative projects and daily tasks.';
        break;
      default:
        roleSpecificContent = 'We look forward to helping you explore the power of AI in your workflow.';
    }
    
    const text = `
      Welcome to Echoverse, ${user.username}!
      
      Thank you for joining our AI-powered workspace platform. Your account is now active.
      
      ${roleSpecificContent}
      
      Visit your dashboard to get started: ${process.env.BASE_URL || 'http://localhost:5000'}/dashboard
      
      If you have any questions, please contact our support team at ${this.supportEmail}.
      
      Best regards,
      The Echoverse Team
    `;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #7c3aed; color: white; padding: 10px 20px; border-radius: 5px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
          .button { display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; 
                   text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Welcome to Echoverse!</h2>
          </div>
          
          <p>Hello ${user.username},</p>
          
          <p>Thank you for joining our AI-powered workspace platform. Your account is now active.</p>
          
          <p>${roleSpecificContent}</p>
          
          <p>To get started with your new workspace:</p>
          
          <a href="${process.env.BASE_URL || 'http://localhost:5000'}/dashboard" class="button">Go to Dashboard</a>
          
          <p>If you have any questions, please contact our support team at ${this.supportEmail}.</p>
          
          <div class="footer">
            <p>Best regards,<br>The Echoverse Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail({
      to: user.username, // In a real app, this would be user.email
      subject,
      text,
      html
    });
  }
}

export const emailService = new EmailService();
