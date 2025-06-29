import { loadStripe } from '@stripe/stripe-js';

// Make sure to add your publishable key in the .env file
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('Missing Stripe publishable key. Make sure to add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.');
}

export const stripePromise = loadStripe(stripePublishableKey || '');

// Price IDs from your Stripe dashboard
export const PRICE_IDS = {
  BASIC: import.meta.env.VITE_STRIPE_PRICE_BASIC || 'price_basic',
  PRO: import.meta.env.VITE_STRIPE_PRICE_PRO || 'price_pro',
  ENTERPRISE: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || 'price_enterprise'
};

// Product names
export const PRODUCT_NAMES = {
  BASIC: 'Basic',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise'
};

// Product features
export const PRODUCT_FEATURES = {
  BASIC: [
    '10 prompts per month',
    'Basic prompt templates',
    'Email support'
  ],
  PRO: [
    'Unlimited prompts',
    'Advanced prompt templates',
    'Priority email support',
    'Team collaboration (up to 3 members)'
  ],
  ENTERPRISE: [
    'Unlimited prompts',
    'Custom prompt templates',
    'Dedicated support',
    'Team collaboration (unlimited members)',
    'API access'
  ]
};

// Product prices (fallback values if env vars not set)
export const PRODUCT_PRICES = {
  BASIC: import.meta.env.VITE_PRICE_BASIC || '$9.99',
  PRO: import.meta.env.VITE_PRICE_PRO || '$19.99',
  ENTERPRISE: import.meta.env.VITE_PRICE_ENTERPRISE || '$49.99'
};