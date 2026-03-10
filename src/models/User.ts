import mongoose, { Schema, Document } from 'mongoose';
import { IRoute, IPushSubscription } from '../types';

export interface UserDocument extends Document {
  email: string;
  passwordHash?: string;
  googleId?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  displayName: string;
  homeAddress?: string;
  routes: IRoute[];
  pushSubscriptions: IPushSubscription[];
  calendarConnected: boolean;
  freeSlot: boolean;
  subscriptionStatus: 'free' | 'active' | 'cancelled';
  createdAt: Date;
}

const RouteSchema = new Schema({
  name: { type: String, required: true },
  fromAddress: { type: String, required: true },
  toAddress: { type: String, required: true },
  waypoints: [{ lat: Number, lng: Number }],
  scheduleMode: { type: String, enum: ['manual', 'calendar'], default: 'manual' },
  manualSchedule: {
    morningFrom: String,
    morningTo: String,
    afternoonFrom: String,
    afternoonTo: String,
    activeDays: [Number],
  },
  active: { type: Boolean, default: true },
});

const PushSubscriptionSchema = new Schema({
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userAgent: String,
  createdAt: { type: Date, default: Date.now },
});

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: String,
  googleId: { type: String, sparse: true },
  googleAccessToken: String,
  googleRefreshToken: String,
  displayName: { type: String, required: true },
  homeAddress: String,
  routes: [RouteSchema],
  pushSubscriptions: [PushSubscriptionSchema],
  calendarConnected: { type: Boolean, default: false },
  freeSlot: { type: Boolean, default: false },
  subscriptionStatus: {
    type: String,
    enum: ['free', 'active', 'cancelled'],
    default: 'free',
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<UserDocument>('User', UserSchema);
