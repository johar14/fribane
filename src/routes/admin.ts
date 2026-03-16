import { Router, Response } from 'express';
import path from 'path';
import User from '../models/User';
import PushLog from '../models/PushLog';
import { adminAuth, adminApiAuth } from '../middleware/adminAuth';
import { AuthRequest } from '../middleware/auth';
import { sendPushToUser } from '../services/pushService';

const router = Router();

// Serve admin HTML
router.get('/', adminAuth, (_req, res: Response): void => {
  res.sendFile(path.join(__dirname, '../../public/pages/admin.html'));
});

// --- Stats ---
router.get('/api/admin/stats', adminApiAuth, async (_req, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const minus7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const minus30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newLast7,
      newLast30,
      allUsers,
      totalPushSent,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: minus7 } }),
      User.countDocuments({ createdAt: { $gte: minus30 } }),
      User.find({}, 'routes pushSubscriptions createdAt'),
      PushLog.countDocuments(),
    ]);

    let usersWithActiveRoutes = 0;
    let totalRouteCount = 0;
    let usersWithPushEnabled = 0;

    for (const u of allUsers) {
      const activeRoutes = u.routes.filter(r => r.active);
      if (activeRoutes.length > 0) usersWithActiveRoutes++;
      totalRouteCount += u.routes.length;
      if (u.pushSubscriptions.length > 0) usersWithPushEnabled++;
    }

    // Brugere per uge de sidste 8 uger
    const weeklyData: { week: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const count = await User.countDocuments({
        createdAt: { $gte: weekStart, $lt: weekEnd },
      });
      const label = weekStart.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
      weeklyData.push({ week: label, count });
    }

    res.json({
      totalUsers,
      newUsersLast7Days: newLast7,
      newUsersLast30Days: newLast30,
      usersWithActiveRoutes,
      totalRouteCount,
      totalPushSent,
      usersWithPushEnabled,
      weeklySignups: weeklyData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// --- Brugerliste ---
router.get('/api/admin/users', adminApiAuth, async (_req, res: Response): Promise<void> => {
  try {
    const users = await User.find(
      {},
      '_id email displayName createdAt routes pushSubscriptions'
    ).sort({ createdAt: -1 });

    const result = users.map(u => ({
      _id: u._id,
      email: u.email,
      displayName: u.displayName,
      createdAt: u.createdAt,
      routeCount: u.routes.length,
      pushEnabled: u.pushSubscriptions.length > 0,
      scheduleMode: u.routes.find(r => r.active)?.scheduleMode ?? u.routes[0]?.scheduleMode ?? null,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// --- Bruger detaljer ---
router.get('/api/admin/user/:id', adminApiAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id, '-passwordHash -googleAccessToken -googleRefreshToken');
    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }

    const pushLogs = await PushLog.find({ userId: user._id })
      .sort({ sentAt: -1 })
      .limit(20);

    res.json({ user, pushLogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// --- Manuel push til bruger ---
router.post('/api/admin/notify/:userId', adminApiAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      res.status(400).json({ error: 'Besked mangler' });
      return;
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }

    if (!user.pushSubscriptions.length) {
      res.status(400).json({ error: 'Brugeren har ingen push-subscription' });
      return;
    }

    await sendPushToUser(user, 'fribane.io', message.trim(), { type: 'manual' });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// --- Push log (seneste 50) ---
router.get('/api/admin/pushlogs', adminApiAuth, async (_req, res: Response): Promise<void> => {
  try {
    const logs = await PushLog.find()
      .sort({ sentAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

export default router;
