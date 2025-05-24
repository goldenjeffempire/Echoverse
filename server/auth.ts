// server/auth.ts
import type { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from './email-service';
import { findUserByUsername, findUserById, createUser, updateUserVerification, findUserByEmail, updatePassword } from './db';

export function setupAuth(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'default_secret_key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 // 1 day
      }
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await findUserByUsername(username);
        if (!user) return done(null, false, { message: 'Incorrect username' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return done(null, false, { message: 'Incorrect password' });

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: '/auth/github/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await findUserByUsername(profile.username);
      if (!user) {
        user = await createUser({ username: profile.username, password: '', email: profile.emails?.[0]?.value || '' });
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await findUserByUsername(profile.id);
      if (!user) {
        user = await createUser({ username: profile.id, password: '', email: profile.emails?.[0]?.value || '' });
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await findUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post('/api/login', passport.authenticate('local'), (req: Request, res: Response) => {
    res.json({ user: req.user });
  });

  app.post('/api/logout', (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ error: 'Logout failed' });
      res.json({ success: true });
    });
  });

  app.get('/api/session', (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      res.json({ authenticated: true, user: req.user });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Email verification
  app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser({ username, password: hashed, email });
    const token = crypto.randomBytes(32).toString('hex');
    await updateUserVerification(user.id, token);
    await sendVerificationEmail(email, token);
    res.status(201).json({ message: 'User created. Verification email sent.' });
  });

  app.get('/api/verify/:token', async (req, res) => {
    const { token } = req.params;
    const verified = await updateUserVerification(null, token, true);
    if (verified) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid token' });
    }
  });

  // Password reset
  app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = crypto.randomBytes(32).toString('hex');
    await updateUserVerification(user.id, token);
    await sendPasswordResetEmail(email, token);
    res.json({ message: 'Password reset email sent' });
  });

  app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    const userId = await updateUserVerification(null, token);
    if (!userId) return res.status(400).json({ error: 'Invalid token' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await updatePassword(userId, hashed);
    res.json({ message: 'Password updated successfully' });
  });

  // OAuth callback routes
  app.get('/auth/github', passport.authenticate('github'));
  app.get('/auth/github/callback', passport.authenticate('github', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));

  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Unauthorized' });
}
