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
    description: 'Perfect for individual creators with unlimited prompts and API access',
    mode: 'subscription'
  },
  PRO_SUBSCRIPTION: {
    priceId: 'price_1RfX9LDBQ23Gbj5Chxtu1qWh',
    name: 'Pro Plan',
    description: 'For teams and power users with advanced features and collaboration',
    mode: 'subscription'
  }
};