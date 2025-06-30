export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const PRODUCTS: Record<string, StripeProduct> = {
  MONTHLY_SUBSCRIPTION: {
    priceId: 'price_1RfI93DBQ23Gbj5CiqTXSOek',
    name: 'Monthly Subscription',
    description: 'Monthly subscription to promptby.me',
    mode: 'subscription'
  },
  BASIC_SUBSCRIPTION: {
    priceId: 'price_1RfI93DBQ23Gbj5CiqTXSOek',
    name: 'Basic Plan',
    description: 'Basic subscription to promptby.me',
    mode: 'subscription'
  },
  PRO_SUBSCRIPTION: {
    priceId: 'price_1RfJa3DBQ23Gbj5CXYTXSOek',
    name: 'Pro Plan',
    description: 'Pro subscription to promptby.me',
    mode: 'subscription'
  }
};