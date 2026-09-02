import Stripe from 'stripe';
import { ENV } from './env.js';

export const stripe = new Stripe(ENV.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});
