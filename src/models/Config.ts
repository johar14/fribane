import mongoose, { Schema, Document } from 'mongoose';

export interface ConfigDocument extends Document {
  key: string;
  value: number;
  lastDecrement: Date;
}

const ConfigSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true },
  lastDecrement: { type: Date, default: Date.now },
});

export default mongoose.model<ConfigDocument>('Config', ConfigSchema);
