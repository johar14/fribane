import webpush from 'web-push';
import { UserDocument } from '../models/User';
import PushLog from '../models/PushLog';

export function initWebPush(): void {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;

  if (!publicKey || !privateKey || publicKey === 'din-vapid-public-key') {
    console.warn('⚠️  VAPID nøgler ikke sat – push notifikationer virker ikke');
    return;
  }

  webpush.setVapidDetails(email!, publicKey, privateKey);
  console.log('✅ Web Push initialiseret');
}

export async function sendPushToUser(
  user: UserDocument,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!user.pushSubscriptions?.length) return;

  const type = (data?.type as 'traffic' | 'manual' | 'test') || 'traffic';

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: data || {},
    timestamp: Date.now(),
  });

  const failedEndpoints: string[] = [];
  let sent = false;

  for (const sub of user.pushSubscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        },
        payload
      );
      sent = true;
    } catch (err: unknown) {
      const error = err as { statusCode?: number };
      if (error.statusCode === 410) {
        failedEndpoints.push(sub.endpoint);
      } else {
        console.error('Push fejl:', err);
      }
    }
  }

  if (sent) {
    await PushLog.create({
      userId: user._id,
      email: user.email,
      title,
      message: body,
      type,
    });
  }

  if (failedEndpoints.length > 0) {
    user.pushSubscriptions = user.pushSubscriptions.filter(
      sub => !failedEndpoints.includes(sub.endpoint)
    );
    await user.save();
  }
}
