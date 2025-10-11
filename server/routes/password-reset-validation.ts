
import { Router } from 'express';
import { authenticateToken } from '../auth';
import type { AuthenticatedRequest } from '../auth';
import { emailVerificationRateLimiter } from '../middleware/rate-limit-enhanced';

export const emailVerificationRouter = Router();

// Resend verification email
emailVerificationRouter.post('/resend-verification', authenticateToken, emailVerificationRateLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;

    if (user.isEmailVerified) {
      res.status(400).json({ message: "Email is already verified" });
      return;
    }

    const { resendVerificationEmail } = await import("../services/email-verification");
    const result = await resendVerificationEmail(user.id, user.email, req.ip, req.get('user-agent'));

    if (result.success) {
      res.json({ message: "Verification email sent successfully" });
    } else {
      res.status(400).json({ message: result.error || "Failed to send verification email" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error sending verification email" });
  }
});

// Verify email with token
emailVerificationRouter.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ message: "Verification token is required" });
      return;
    }

    const { verifyEmailToken } = await import("../services/email-verification");
    const result = await verifyEmailToken(token, req.ip, req.get('user-agent'));

    if (result.success) {
      res.json({ message: "Email verified successfully" });
    } else {
      res.status(400).json({ message: result.error || "Email verification failed" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error verifying email" });
  }
});
