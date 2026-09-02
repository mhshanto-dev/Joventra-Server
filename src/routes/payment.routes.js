import express, { Router } from 'express';
import {
  createCheckoutSession,
  activatePlanDirect,
  handleStripeWebhook,
  getPaymentHistory,
  getCurrentSubscription,
  getAllPayments,
} from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Stripe Webhook (raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Protected routes
router.post('/create-checkout', authenticate, createCheckoutSession);
router.post('/activate-plan', authenticate, activatePlanDirect);
router.get('/history', authenticate, getPaymentHistory);
router.get('/subscription', authenticate, getCurrentSubscription);

// Admin routes
router.get('/admin/all', authenticate, authorize(ROLES.ADMIN), getAllPayments);

export default router;
