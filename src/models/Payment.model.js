import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  plan: {
    type: String,
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  stripePaymentIntentId: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['succeeded', 'pending', 'failed', 'refunded'],
    default: 'succeeded',
  },
  paidAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

paymentSchema.index({ userId: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
