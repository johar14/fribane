import { Router, Request, Response } from 'express';
import User from '../models/User';

const router = Router();

// Offentlig endpoint til landing page countdown
router.get('/slots', async (_req: Request, res: Response): Promise<void> => {
  try {
    const used = await User.countDocuments();
    const remaining = parseInt(process.env.BETA_SLOTS_REMAINING || '78');

    // Bar viser scarcity – sættes til mindst 88% fuld uanset faktisk brugerantal
    const rawPercent = used + remaining > 0
      ? Math.round((used / (used + remaining)) * 100)
      : 0;
    const percentFull = Math.min(95, Math.max(88, rawPercent));

    res.json({
      used,
      remaining,
      percentFull,
    });
  } catch {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

export default router;
