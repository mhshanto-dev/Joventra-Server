import mongoose from 'mongoose';
import { ROLES } from '../constants/roles.js';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  userRole: {
    type: String,
    enum: [ROLES.SEEKER, ROLES.RECRUITER],
    required: true,
  },
  planType: {
    type: String,
    default: 'free',
  },
  stripeSubscriptionId: {
    type: String,
    default: null,
  },
  stripeCustomerId: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'trialing'],
    default: 'active',
  },
  currentPeriodStart: {
    type: Date,
    default: Date.now,
  },
  currentPeriodEnd: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  applicationsUsedThisMonth: {
    type: Number,
    default: 0,
  },
  lastApplicationReset: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
