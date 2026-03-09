import mongoose, { Schema, Document } from 'mongoose';

export interface TrafficEventDocument extends Document {
  tag: string;
  heading: string;
  description: string;
  entityType: string;
  swLat?: number;
  swLng?: number;
  neLat?: number;
  neLng?: number;
  firstSeen: Date;
  lastSeen: Date;
  notifiedUsers: string[]; // user IDs der har fået push
}

const TrafficEventSchema = new Schema({
  tag: { type: String, required: true, unique: true },
  heading: String,
  description: String,
  entityType: String,
  swLat: Number,
  swLng: Number,
  neLat: Number,
  neLng: Number,
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  notifiedUsers: [String],
});

export default mongoose.model<TrafficEventDocument>('TrafficEvent', TrafficEventSchema);
