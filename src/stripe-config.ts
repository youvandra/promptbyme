export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const PRODUCTS: Record<string, StripeProduct> = {
  BASIC_SUBSCRIPTION: {
    priceId: 'price_1RfI93DBQ23Gbj5CiqTXSOek',
    name: 'Basic Plan',
    description: 'Monthly subscription to promptby.me',
    mode: 'subscription'
  },
  PRO_SUBSCRIPTION: {
    priceId: 'price_1RfI93DBQ23Gbj5CiqTXSOek',
    name: 'Pro Plan',
    description: 'Pro subscription to promptby.me',
    mode: 'subscription'
   }
};