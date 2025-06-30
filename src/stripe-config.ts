export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const PRODUCTS: Record<string, StripeProduct> = {
  MONTHLY_SUBSCRIPTION: {
    priceId: 'price_1RfI93DBQ23Gbj5CiqTXSOek',
    name: 'Monthly Subs',
    description: 'Monthly subscription to promptby.me',
    mode: 'subscription'
  }
};