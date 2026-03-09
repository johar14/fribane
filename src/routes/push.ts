import { Router, Response } from 'express';
import User from '../models/User';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { sendPushToUser } from '../services/pushService';

const router = Router();

// Gem push subscription
router.post('/subscribe', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { endpoint, keys, userAgent } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ error: 'Ugyldig subscription' });
      return;
    }

    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }

    // Undgå duplikater
    const exists = user.pushSubscriptions.find(s => s.endpoint === endpoint);
    if (!exists) {
      user.pushSubscriptions.push({
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        userAgent,
        createdAt: new Date(),
      });
      await user.save();
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// Fjern push subscription
router.post('/unsubscribe', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { endpoint } = req.body;
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }

    user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== endpoint);
    await user.save();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// Send test-push
router.post('/test', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }

    if (!user.pushSubscriptions.length) {
      res.status(400).json({ error: 'Ingen push-subscription registreret' });
      return;
    }

    await sendPushToUser(
      user,
      '🚨 Test fra Fribane',
      'Push-notifikationer virker! Du vil nu få besked om uheld på din rute.'
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// Hent VAPID public key
router.get('/vapid-public-key', (_req, res: Response): void => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

export default router;
