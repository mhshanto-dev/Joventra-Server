import { stripe } from '../config/stripe.js';
import { ENV } from '../config/env.js';
import { Subscription } from '../models/Subscription.model.js';
import { Payment } from '../models/Payment.model.js';
import { User } from '../models/User.model.js';
import { SEEKER_PLANS, RECRUITER_PLANS } from '../constants/plans.js';

export const createCheckoutSessionService = async ({ user, planId, role }) => {
  const plans = role === 'seeker' ? SEEKER_PLANS : RECRUITER_PLANS;
  const selectedPlan = plans[planId.toUpperCase()];

  if (!selectedPlan) {
    throw new Error('Invalid subscription plan selected');
  }

  // If testing with mock key, generate simulated checkout response
  if (!ENV.STRIPE_SECRET_KEY || ENV.STRIPE_SECRET_KEY.startsWith('sk_test_mock') || ENV.STRIPE_SECRET_KEY.includes('Mock')) {
    const mockSessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return {
      url: `${ENV.CLIENT_URL}/dashboard/${role}/billing?success=true&session_id=${mockSessionId}&plan=${planId}`,
      sessionId: mockSessionId,
      mock: true,
      amount: selectedPlan.price,
      plan: selectedPlan.name,
    };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: selectedPlan.price === 0 ? 'setup' : 'subscription',
    customer_email: user.email,
    client_reference_id: user._id.toString(),
    metadata: {
      userId: user._id.toString(),
      role,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
    },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `HireLoop ${selectedPlan.name} Plan (${role === 'seeker' ? 'Seeker' : 'Recruiter'})`,
            description: selectedPlan.features.join(' • '),
          },
          unit_amount: selectedPlan.price * 100,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${ENV.CLIENT_URL}/dashboard/${role}/billing?session_id={CHECKOUT_SESSION_ID}&success=true&plan=${selectedPlan.id}`,
    cancel_url: `${ENV.CLIENT_URL}/dashboard/${role}/billing?canceled=true`,
  });

  return {
    url: session.url,
    sessionId: session.id,
    mock: false,
  };
};

export const fulfillSubscription = async ({ userId, role, planId, transactionId, amount }) => {
  const plans = role === 'seeker' ? SEEKER_PLANS : RECRUITER_PLANS;
  const selectedPlan = plans[planId.toUpperCase()] || plans.FREE;

  const currentPeriodEnd = new Date();
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

  const subscription = await Subscription.findOneAndUpdate(
    { userId },
    {
      userRole: role,
      planType: selectedPlan.id,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd,
      applicationsUsedThisMonth: 0,
      lastApplicationReset: new Date(),
    },
    { new: true, upsert: true }
  );

  const finalAmount = amount !== undefined ? amount : selectedPlan.price;

  let payment = null;
  if (finalAmount > 0) {
    payment = await Payment.create({
      userId,
      subscriptionId: subscription._id,
      amount: finalAmount,
      currency: 'USD',
      plan: `${selectedPlan.name} (${role})`,
      transactionId: transactionId || `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: 'succeeded',
      paidAt: new Date(),
    });
  }

  return { subscription, payment };
};
