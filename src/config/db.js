import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Error] ${error.message}`);
  }
};
