export interface IUser {
  _id: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  displayName: string;
  routes: IRoute[];
  pushSubscriptions: IPushSubscription[];
  calendarConnected: boolean;
  freeSlot: boolean;
  subscriptionStatus: 'free' | 'active' | 'cancelled';
  createdAt: Date;
}

export interface IRoute {
  _id: string;
  name: string;
  // Bounding box der definerer ruten
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
  // Manuel tidsvindue
  manualSchedule?: {
    morningFrom: string; // "07:00"
    morningTo: string;   // "09:00"
    afternoonFrom: string;
    afternoonTo: string;
    activeDays: number[]; // [1,2,3,4,5] = man-fre
  };
  active: boolean;
}

export interface IPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: Date;
}

export interface ITrafficEvent {
  tag: string;
  heading: string;
  description: string;
  entityType: string; // ACCIDENT, ROADWORK, etc.
  bounds?: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  };
  timestamp: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}
