// server/email-service.ts

import { UserRole, User } from "@shared/schema";
import { Resend } from "resend";
import nodemailer from "nodemailer";

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
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      console.log("Email service initialized with Resend");
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      console.log("Email service initialized with Nodemailer (Gmail)");
    } else {
      console.warn("No email service credentials set, emails will be logged to console.");
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
      } else if (this.transporter) {
        await this.transporter.sendMail({
          from: this.fromEmail,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
      } else {
        console.log("========== EMAIL SENT ==========");
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Text content: ${options.text}`);
        console.log("===============================");
      }

      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  async sendParentApprovalEmail(childUsername: string, parentEmail: string, approvalToken: string): Promise<boolean> {
    const approvalLink = `${process.env.BASE_URL || "http://localhost:5000"}/api/approve-minor/${approvalToken}`;
    const subject = `Echoverse: Parental Approval Required for ${childUsername}`;

    const text = `Hello,

Your child ${childUsername} has requested to create an account on Echoverse.
To approve their account, click the following link:
${approvalLink}

If you did not request this, contact us at ${this.supportEmail}.

Thank you, Echoverse Team`;

    const html = `<!DOCTYPE html>
<html><body><div><h2>Echoverse: Parental Approval Required</h2>
<p>Your child <strong>${childUsername}</strong> requested an account.</p>
<p>Click the button to approve:</p>
<a href="${approvalLink}" style="padding:10px 20px;background:#7c3aed;color:white;text-decoration:none;border-radius:5px;">Approve Account</a>
<p>If the button doesn't work, paste this URL into your browser:</p>
<p>${approvalLink}</p>
<p>Contact: ${this.supportEmail}</p>
</div></body></html>`;

    return this.sendEmail({ to: parentEmail, subject, text, html });
  }

  async sendWelcomeEmail(user: User): Promise<boolean> {
    const subject = `Welcome to Echoverse, ${user.username}!`;

    let roleSpecificContent = "";
    switch (user.role) {
      case UserRole.SCHOOL:
        roleSpecificContent = "We've prepared educational tools for your learning journey.";
        break;
      case UserRole.WORK:
        roleSpecificContent = "Your business workspace is ready with productivity tools.";
        break;
      case UserRole.PERSONAL:
        roleSpecificContent = "Your AI assistant is ready for your projects and tasks.";
        break;
      default:
        roleSpecificContent = "Explore the power of AI in your workflow.";
    }

    const dashboardUrl = `${process.env.BASE_URL || "http://localhost:5000"}/dashboard`;

    const text = `Welcome to Echoverse, ${user.username}!

${roleSpecificContent}

Visit your dashboard: ${dashboardUrl}

Questions? Contact: ${this.supportEmail}`;

    const html = `<!DOCTYPE html>
<html><body><div><h2>Welcome to Echoverse!</h2>
<p>Hello ${user.username},</p>
<p>${roleSpecificContent}</p>
<p><a href="${dashboardUrl}" style="padding:10px 20px;background:#7c3aed;color:white;text-decoration:none;border-radius:5px;">Go to Dashboard</a></p>
<p>Questions? Contact us at ${this.supportEmail}</p>
</div></body></html>`;

    return this.sendEmail({ to: user.username, subject, text, html });
  }
}

export const emailService = new EmailService();
