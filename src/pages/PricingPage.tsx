import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, CreditCard, Shield, Zap, Users, ArrowRight, Crown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { SideNavbar } from '../components/navigation/SideNavbar';
import { BoltBadge } from '../components/ui/BoltBadge';

interface Subscription {
  id: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'inactive';
  current_period_end?: string;
}

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted: boolean;
  buttonText: string;
  buttonLink: string;
  icon: React.ReactNode;
}

export const PricingPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { user, loading: authLoading } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        // If no subscription found, create a free one
        if (error.code === 'PGRST116') {
          await createFreeSubscription();
        }
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error in subscription fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFreeSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([{
          user_id: user.id,
          plan: 'free',
          status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating free subscription:', error);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error in create subscription:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isCurrentPlan = (plan: string) => {
    return subscription?.plan === plan && subscription?.status === 'active';
  };

  const getButtonText = (tier: PricingTier) => {
    if (isCurrentPlan(tier.name.toLowerCase())) {
      return 'Current Plan';
    }
    
    if (subscription?.status === 'active') {
      return tier.name.toLowerCase() === 'free' ? 'Downgrade' : 'Upgrade';
    }
    
    return tier.buttonText;
  };

  const pricingTiers: PricingTier[] = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for getting started',
      features: [
        '5 prompts',
        'Basic version control',
        'Public sharing',
        'Limited API access'
      ],
      highlighted: false,
      buttonText: 'Get Started',
      buttonLink: '#',
      icon: <Zap className="w-6 h-6 text-indigo-400" />
    },
    {
      name: 'Basic',
      price: '$9.99',
      description: 'For individual creators',
      features: [
        '50 prompts',
        'Full version control',
        'Private sharing',
        'API access',
        'Priority support'
      ],
      highlighted: true,
      buttonText: 'Upgrade to Basic',
      buttonLink: 'https://app.revenuecat.com/buy/basic',
      icon: <Shield className="w-6 h-6 text-blue-400" />
    },
    {
      name: 'Pro',
      price: '$19.99',
      description: 'For power users and small teams',
      features: [
        'Unlimited prompts',
        'Team collaboration',
        'Advanced analytics',
        'Priority support',
        'Custom variables',
        'Unlimited API calls'
      ],
      highlighted: false,
      buttonText: 'Upgrade to Pro',
      buttonLink: 'https://app.revenuecat.com/buy/pro',
      icon: <Crown className="w-6 h-6 text-purple-400" />
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For organizations with advanced needs',
      features: [
        'Custom solutions',
        'Dedicated support',
        'SLA guarantees',
        'Custom integrations',
        'Advanced security',
        'User management'
      ],
      highlighted: false,
      buttonText: 'Contact Us',
      buttonLink: 'https://app.revenuecat.com/contact/enterprise',
      icon: <Users className="w-6 h-6 text-emerald-400" />
    }
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      {/* Layout Container */}
      <div className="flex min-h-screen lg:pl-64">
        {/* Side Navbar - Only shows when user is logged in */}
        {user && <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header for logged users */}
          {user && (
            <header className="lg:hidden relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <button
                    data-menu-button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-zinc-400 hover:text-white transition-colors p-1"
                  >
                    <Menu size={20} />
                  </button>
                  
                  <h1 className="text-lg font-semibold">
                    Pricing
                  </h1>
                  
                  <div className="w-6" /> {/* Spacer for centering */}
                </div>
              </div>
            </header>
          )}

          {/* Main Content */}
          <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-white mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Choose Your Plan
              </motion.h1>
              <motion.p 
                className="text-xl text-zinc-300 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Unlock the full potential of promptby.me with our flexible pricing options
              </motion.p>
              
              {subscription && (
                <motion.div
                  className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 mb-8 inline-block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-indigo-400" size={20} />
                    <div className="text-left">
                      <p className="text-zinc-300">
                        <span className="font-medium">Current Plan:</span>{' '}
                        <span className={`${
                          subscription.plan === 'free' ? 'text-zinc-400' :
                          subscription.plan === 'basic' ? 'text-blue-400' :
                          subscription.plan === 'pro' ? 'text-purple-400' :
                          'text-emerald-400'
                        } font-semibold`}>
                          {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                        </span>
                      </p>
                      <p className="text-sm text-zinc-500">
                        {subscription.status === 'active' 
                          ? `Renews: ${formatDate(subscription.current_period_end)}`
                          : `Status: ${subscription.status}`
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Pricing Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {pricingTiers.map((tier, index) => (
                <motion.div
                  key={tier.name}
                  className={`relative bg-zinc-900/50 border ${
                    tier.highlighted 
                      ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                      : 'border-zinc-800/50'
                  } rounded-2xl overflow-hidden`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                >
                  {tier.highlighted && (
                    <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white text-xs font-bold py-1 text-center">
                      MOST POPULAR
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        tier.name === 'Free' ? 'bg-indigo-600/20' :
                        tier.name === 'Basic' ? 'bg-blue-600/20' :
                        tier.name === 'Pro' ? 'bg-purple-600/20' :
                        'bg-emerald-600/20'
                      }`}>
                        {tier.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-white">{tier.price}</span>
                      {tier.name !== 'Free' && tier.name !== 'Enterprise' && (
                        <span className="text-zinc-400 text-sm">/month</span>
                      )}
                    </div>
                    
                    <p className="text-zinc-400 mb-6">{tier.description}</p>
                    
                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-zinc-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      onClick={() => window.open(tier.buttonLink, '_blank')}
                      disabled={isCurrentPlan(tier.name.toLowerCase())}
                      className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        isCurrentPlan(tier.name.toLowerCase())
                          ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                          : tier.name === 'Free'
                            ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                            : tier.name === 'Basic'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : tier.name === 'Pro'
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {getButtonText(tier)}
                      {!isCurrentPlan(tier.name.toLowerCase()) && <ArrowRight size={16} />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Feature Comparison */}
            <div className="mt-20 max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-white text-center mb-10">Feature Comparison</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="py-4 px-6 text-left text-zinc-400 font-medium">Feature</th>
                      {pricingTiers.map(tier => (
                        <th key={tier.name} className="py-4 px-6 text-center">
                          <span className={`font-bold ${
                            tier.name === 'Free' ? 'text-zinc-300' :
                            tier.name === 'Basic' ? 'text-blue-400' :
                            tier.name === 'Pro' ? 'text-purple-400' :
                            'text-emerald-400'
                          }`}>
                            {tier.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-4 px-6 text-zinc-300">Prompts</td>
                      <td className="py-4 px-6 text-center text-zinc-400">5</td>
                      <td className="py-4 px-6 text-center text-zinc-400">50</td>
                      <td className="py-4 px-6 text-center text-zinc-400">Unlimited</td>
                      <td className="py-4 px-6 text-center text-zinc-400">Unlimited</td>
                    </tr>
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-4 px-6 text-zinc-300">Version Control</td>
                      <td className="py-4 px-6 text-center text-zinc-400">Basic</td>
                      <td className="py-4 px-6 text-center text-zinc-400">Full</td>
                      <td className="py-4 px-6 text-center text-zinc-400">Full</td>
                      <td className="py-4 px-6 text-center text-zinc-400">Full</td>
                    </tr>
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-4 px-6 text-zinc-300">Public Sharing</td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-4 px-6 text-zinc-300">Private Sharing</td>
                      <td className="py-4 px-6 text-center"><X size={18} className="text-red-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-4 px-6 text-zinc-300">API Access</td>
                      <td className="py-4 px-6 text-center text-zinc-400">Limited</td>
                      <td className="py-4 px-6 text-center text-zinc-400">Full</td>
                      <td className="py-4 px-6 text-center text-zinc-400">Unlimited</td>
                      <td className="py-4 px-6 text-center text-zinc-400">Unlimited</td>
                    </tr>
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-4 px-6 text-zinc-300">Team Collaboration</td>
                      <td className="py-4 px-6 text-center"><X size={18} className="text-red-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><X size={18} className="text-red-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-4 px-6 text-zinc-300">Priority Support</td>
                      <td className="py-4 px-6 text-center"><X size={18} className="text-red-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-4 px-6 text-zinc-300">Custom Variables</td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-4 px-6 text-zinc-300">Custom Integrations</td>
                      <td className="py-4 px-6 text-center"><X size={18} className="text-red-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><X size={18} className="text-red-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><X size={18} className="text-red-400 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check size={18} className="text-emerald-400 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-20 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-white text-center mb-10">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">How do I upgrade my plan?</h3>
                  <p className="text-zinc-400">
                    Simply click on the "Upgrade" button for your desired plan. You'll be redirected to our secure payment processor where you can complete your purchase.
                  </p>
                </div>
                
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Can I cancel my subscription anytime?</h3>
                  <p className="text-zinc-400">
                    Yes, you can cancel your subscription at any time. Your plan will remain active until the end of your current billing period.
                  </p>
                </div>
                
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Do you offer refunds?</h3>
                  <p className="text-zinc-400">
                    We offer a 7-day money-back guarantee for all new subscriptions. If you're not satisfied with your purchase, contact our support team within 7 days for a full refund.
                  </p>
                </div>
                
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">What payment methods do you accept?</h3>
                  <p className="text-zinc-400">
                    We accept all major credit cards, including Visa, Mastercard, American Express, and Discover. We also support Apple Pay and Google Pay.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <BoltBadge />
    </div>
  );
};

export default PricingPage;