export const emailTemplates = {
    welcome: (data) => ({
        subject: 'Welcome to EchoVerse',
        html: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome, ${data.name}!</h1>
          <p>Thank you for joining EchoVerse Platform.</p>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${data.verificationUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
          <p style="color: #666; margin-top: 20px; font-size: 12px;">This link expires in 24 hours.</p>
        </body>
      </html>
    `,
        text: `Welcome, ${data.name}!\n\nPlease verify your email: ${data.verificationUrl}\n\nThis link expires in 24 hours.`,
    }),
    passwordReset: (data) => ({
        subject: 'Password Reset Request',
        html: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Password Reset</h1>
          <p>Hi ${data.name},</p>
          <p>You requested a password reset. Click below to reset your password:</p>
          <a href="${data.resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          <p style="color: #666; margin-top: 20px; font-size: 12px;">This link expires in 24 hours. If you didn't request this, ignore this email.</p>
        </body>
      </html>
    `,
        text: `Password Reset\n\nHi ${data.name}, Reset your password: ${data.resetUrl}\n\nThis link expires in 24 hours.`,
    }),
    orderConfirmation: (data) => ({
        subject: `Order Confirmation #${data.orderNumber}`,
        html: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Order Confirmed!</h1>
          <p>Thank you for your order #${data.orderNumber}</p>
          <div style="background: #f5f5f5; padding: 16px; margin: 20px 0;">
            <h3>Order Total: $${data.total.toFixed(2)}</h3>
          </div>
        </body>
      </html>
    `,
        text: `Order Confirmed #${data.orderNumber}\n\nTotal: $${data.total.toFixed(2)}`,
    }),
};
export function renderEmailTemplate(templateName, data) {
    const template = emailTemplates[templateName];
    if (!template) {
        throw new Error(`Email template '${templateName}' not found`);
    }
    return template(data);
}
