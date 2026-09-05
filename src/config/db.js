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
    // Ensure admin user and demo accounts exist after connection
    await ensureAdminExists();
    await ensureDemoAccounts();
  } catch (error) {
    console.error(`[MongoDB Error] ${error.message}`);
  }
};

/**
 * Idempotent: creates the admin account from ENV vars if not already present.
 * Safe to call on every startup — never overwrites an existing admin.
 */
async function ensureAdminExists() {
  try {
    // Dynamic import to avoid circular deps at module-load time
    const { User } = await import('../models/User.model.js');
    const existingAdmin = await User.findOne({ email: ENV.ADMIN_EMAIL });
    if (!existingAdmin) {
      await User.create({
        name: 'System Admin',
        email: ENV.ADMIN_EMAIL,
        password: ENV.ADMIN_PASSWORD, // hashed by pre-save hook
        role: 'admin',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      });
      console.log(`[Joventra] Admin account created: ${ENV.ADMIN_EMAIL}`);
    }
  } catch (err) {
    console.error('[Joventra] ensureAdminExists error:', err.message);
  }
}


/**
 * Idempotent: creates demo seeker/recruiter accounts if they don't exist.
 */
async function ensureDemoAccounts() {
  try {
    const { User } = await import('../models/User.model.js');
    const { SeekerProfile } = await import('../models/SeekerProfile.model.js');
    const { Subscription } = await import('../models/Subscription.model.js');

    const demoUsers = [
      { name: 'Alex Johnson', email: 'alex@example.com', password: 'password123', role: 'seeker' },
      { name: 'Sarah Jenkins', email: 'sarah@techcorp.io', password: 'password123', role: 'recruiter' },
    ];

    for (const demo of demoUsers) {
      const existing = await User.findOne({ email: demo.email });
      if (!existing) {
        const user = await User.create(demo);
        if (demo.role === 'seeker') {
          await SeekerProfile.create({ userId: user._id });
        }
        await Subscription.create({
          userId: user._id,
          userRole: demo.role,
          planType: 'free',
          status: 'active',
        });
        console.log('[Joventra] Demo account created: ' + demo.email);
      }
    }
  } catch (err) {
    console.error('[Joventra] ensureDemoAccounts error:', err.message);
  }
}
