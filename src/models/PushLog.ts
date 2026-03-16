import mongoose, { Schema, Document } from 'mongoose';

export interface PushLogDocument extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  title: string;
  message: string;
  sentAt: Date;
  type: 'traffic' | 'manual' | 'test';
}

const PushLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  type: { type: String, enum: ['traffic', 'manual', 'test'], required: true },
});

export default mongoose.model<PushLogDocument>('PushLog', PushLogSchema);
