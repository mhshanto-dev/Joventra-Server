import app from '../src/server.js';
import { connectDB } from '../src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel Handler DB Error]', err);
  }
  return app(req, res);
}
