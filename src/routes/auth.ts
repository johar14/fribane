import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generateToken, authenticateJWT, AuthRequest } from '../middleware/auth';
import { getGoogleAuthUrl, exchangeCodeForTokens } from '../services/calendarService';

const router = Router();

// Registrer ny bruger (email + password)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      res.status(400).json({ error: 'Email, password og navn er påkrævet' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ error: 'Email er allerede i brug' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Tjek om gratis pladser er opbrugt
    const freeCount = await User.countDocuments({ freeSlot: true });
    const maxFree = parseInt(process.env.MAX_FREE_SLOTS || '1000');
    const hasFreeSlot = freeCount < maxFree;

    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      displayName,
      freeSlot: hasFreeSlot,
      subscriptionStatus: hasFreeSlot ? 'free' : 'free',
    });

    await user.save();

    const token = generateToken({ userId: user._id.toString(), email: user.email });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: { email: user.email, displayName: user.displayName, freeSlot: user.freeSlot },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Ugyldig email eller password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Ugyldig email eller password' });
      return;
    }

    const token = generateToken({ userId: user._id.toString(), email: user.email });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: { email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// Logout
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Google OAuth – start
router.get('/google', (_req: Request, res: Response): void => {
  const url = getGoogleAuthUrl();
  res.redirect(url);
});

// Google OAuth – callback
router.get('/google/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      res.redirect('/app?error=google_failed');
      return;
    }

    const { accessToken, refreshToken, email, name } = await exchangeCodeForTokens(code);

    // Find eller opret bruger
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const freeCount = await User.countDocuments({ freeSlot: true });
      const maxFree = parseInt(process.env.MAX_FREE_SLOTS || '1000');

      user = new User({
        email: email.toLowerCase(),
        displayName: name,
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken,
        calendarConnected: true,
        freeSlot: freeCount < maxFree,
      });
    } else {
      user.googleAccessToken = accessToken;
      if (refreshToken) user.googleRefreshToken = refreshToken;
      user.calendarConnected = true;
    }

    await user.save();

    const token = generateToken({ userId: user._id.toString(), email: user.email });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect('/app');
  } catch (err) {
    console.error('Google callback fejl:', err);
    res.redirect('/app?error=google_failed');
  }
});

// Hent nuværende bruger
router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId).select('-passwordHash -googleAccessToken -googleRefreshToken');
    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

export default router;
