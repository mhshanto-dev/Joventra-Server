import { createCheckoutSessionService, fulfillSubscription } from '../services/stripe.service.js';
import { Payment } from '../models/Payment.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { User } from '../models/User.model.js';
import { stripe } from '../config/stripe.js';
import { ENV } from '../config/env.js';
import { SEEKER_PLANS, RECRUITER_PLANS } from '../constants/plans.js';

export const createCheckoutSession = async (req, res) => {
  try {
    const { planId } = req.body;
    const user = req.user;

    const result = await createCheckoutSessionService({
      user,
      planId,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message,
    });
  }
};

export const activatePlanDirect = async (req, res) => {
  try {
    const { planId } = req.body;
    const user = req.user;

    const plans = user.role === 'seeker' ? SEEKER_PLANS : RECRUITER_PLANS;
    const selectedPlan = plans[planId?.toUpperCase()];

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected',
      });
    }

    const { subscription, payment } = await fulfillSubscription({
      userId: user._id,
      role: user.role,
      planId: selectedPlan.id,
      amount: selectedPlan.price,
      transactionId: `txn_sub_${Date.now()}_${Math.random().toString(36).substring(5)}`,
    });

    return res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${selectedPlan.name} plan!`,
      data: {
        subscription,
        payment,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to activate plan',
      error: error.message,
    });
  }
};

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (ENV.STRIPE_WEBHOOK_SECRET && !ENV.STRIPE_WEBHOOK_SECRET.includes('Mock')) {
      event = stripe.webhooks.constructEvent(req.body, sig, ENV.STRIPE_WEBHOOK_SECRET);
    } else {
      event = req.body;
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, role, planId } = session.metadata || {};
        if (userId && role && planId) {
          await fulfillSubscription({
            userId,
            role,
            planId,
            transactionId: session.payment_intent || session.id,
            amount: session.amount_total ? session.amount_total / 100 : 0,
          });
        }
        break;
      }
      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const payments = await Payment.find({ userId })
      .sort({ paidAt: -1 });

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message,
    });
  }
};

export const getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    let subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      subscription = await Subscription.create({
        userId,
        userRole: req.user.role,
        planType: 'free',
        status: 'active',
      });
    }

    const plans = req.user.role === 'seeker' ? SEEKER_PLANS : RECRUITER_PLANS;
    const planDetails = plans[(subscription.planType || 'free').toUpperCase()] || plans.FREE;

    return res.status(200).json({
      success: true,
      data: {
        subscription,
        planDetails,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription',
      error: error.message,
    });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Payment.countDocuments();
    const payments = await Payment.find()
      .populate('userId', 'name email avatarUrl role')
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalRevenueAgg = await Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenueAgg = await Payment.aggregate([
      { $match: { status: 'succeeded', paidAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyRevenue = monthlyRevenueAgg.length > 0 ? monthlyRevenueAgg[0].total : 0;

    const activeSeekerSubs = await Subscription.countDocuments({
      userRole: 'seeker',
      planType: { $in: ['pro', 'premium'] },
      status: 'active'
    });

    const activeRecruiterSubs = await Subscription.countDocuments({
      userRole: 'recruiter',
      planType: { $in: ['growth', 'enterprise'] },
      status: 'active'
    });

    return res.status(200).json({
      success: true,
      data: payments,
      summary: {
        totalRevenue,
        monthlyRevenue,
        activeSeekerSubscriptions: activeSeekerSubs,
        activeRecruiterSubscriptions: activeRecruiterSubs,
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin payments',
      error: error.message,
    });
  }
};
