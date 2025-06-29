import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as Purchases from '@revenuecat/purchases-js';
import { Check, X, HelpCircle, ArrowRight, Zap } from 'lucide-react';
import { Section } from '../components/ui/Section';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { GlassPanel } from '../components/ui/GlassPanel';
import { useAuthStore } from '../store/authStore';

export const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const { user } = useAuthStore();
  
  // Initialize RevenueCat SDK
  useEffect(() => {
    if (user) {
      try {
        // Configure RevenueCat with the user's ID as the appUserId
        Purchases.configure({
          apiKey: 'rcb_utECfCCZVOJKVPQcrykYAIchIDaO',
          appUserId: user.id,
        });
        
        console.log('RevenueCat SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize RevenueCat SDK:', error);
      }
    }
  }, [user]);
  
  // Pricing plans
  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small projects and personal websites',
      monthlyPrice: 29,
      annualPrice: 290, // 10 months price (2 months free)
      features: [
        { included: true, name: 'Basic glassmorphic components' },
        { included: true, name: 'Responsive design' },
        { included: true, name: 'Standard support' },
        { included: true, name: '1 website' },
        { included: false, name: 'Custom branding' },
        { included: false, name: 'Advanced components' },
        { included: false, name: 'Priority support' },
        { included: false, name: 'Multiple websites' },
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Professional',
      description: 'Ideal for businesses and professional websites',
      monthlyPrice: 79,
      annualPrice: 790, // 10 months price (2 months free)
      features: [
        { included: true, name: 'All glassmorphic components' },
        { included: true, name: 'Responsive design' },
        { included: true, name: 'Priority support' },
        { included: true, name: 'Up to 3 websites' },
        { included: true, name: 'Custom branding' },
        { included: true, name: 'Advanced components' },
        { included: false, name: 'API access' },
        { included: false, name: 'White labeling' },
      ],
      cta: 'Get Started',
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with complex needs',
      monthlyPrice: 199,
      annualPrice: 1990, // 10 months price (2 months free)
      features: [
        { included: true, name: 'All glassmorphic components' },
        { included: true, name: 'Responsive design' },
        { included: true, name: 'Dedicated support' },
        { included: true, name: 'Unlimited websites' },
        { included: true, name: 'Custom branding' },
        { included: true, name: 'Advanced components' },
        { included: true, name: 'API access' },
        { included: true, name: 'White labeling' },
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  // FAQ items
  const faqItems = [
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for annual plans. Enterprise customers can also pay by invoice.'
    },
    {
      question: 'Can I upgrade or downgrade my plan later?',
      answer: 'Yes, you can upgrade your plan at any time. Downgrades will take effect at the end of your current billing cycle.'
    },
    {
      question: 'Is there a free trial available?',
      answer: 'We offer a 14-day free trial for all plans. No credit card required to start your trial.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee. If you\'re not satisfied with our service, contact us within 30 days of purchase for a full refund.'
    },
    {
      question: 'What kind of support is included?',
      answer: 'All plans include email support. Professional plans include priority email support with faster response times. Enterprise plans include dedicated support with phone and email options.'
    },
    {
      question: 'Can I use the components for client projects?',
      answer: 'Yes, depending on your plan. Professional plans allow usage on up to 3 websites, while Enterprise plans offer unlimited usage.'
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <Section className="pt-32 md:pt-40">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
              Choose the perfect plan for your needs. All plans include our core glassmorphic components and responsive design.
            </p>
          </motion.div>
          
          {/* Billing toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center bg-white/5 backdrop-blur-sm rounded-full p-1 mb-12"
          >
            <button
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'monthly' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'annual' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
              onClick={() => setBillingCycle('annual')}
            >
              Annual <span className="text-xs opacity-75">(Save 20%)</span>
            </button>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="flex"
            >
              <Card className={`flex flex-col h-full relative ${plan.popular ? 'border-indigo-500/50' : ''}`}>
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <CardHeader className={`text-center ${plan.popular ? 'bg-indigo-600/10' : ''}`}>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-zinc-400 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">
                      ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                    </span>
                    <span className="text-zinc-400 ml-2">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3 my-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-zinc-600 mr-3 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-zinc-300' : 'text-zinc-500'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button 
                    fullWidth 
                    variant={plan.popular ? 'primary' : 'secondary'}
                    to="/contact"
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Enterprise Section */}
      <Section className="bg-gradient-to-b from-zinc-950 to-zinc-900">
        <GlassPanel className="p-8 md:p-12" glowEffect>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Enterprise Solutions</h3>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Need a custom solution?
              </h2>
              <p className="text-zinc-300 mb-6 leading-relaxed">
                Our enterprise plans offer additional features, dedicated support, and custom development to meet the specific needs of larger organizations.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Custom component development',
                  'Dedicated account manager',
                  'Service level agreements (SLAs)',
                  'Advanced security features',
                  'Custom integrations',
                  'On-premise deployment options'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" />
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                size="lg" 
                icon={<ArrowRight size={16} />} 
                iconPosition="right"
                to="/contact"
              >
                Contact Sales
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl filter blur-xl transform scale-105" />
              <img 
                src="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1280" 
                alt="Enterprise team" 
                className="relative z-10 rounded-xl w-full h-full object-cover"
              />
            </div>
          </div>
        </GlassPanel>
      </Section>

      {/* FAQ Section */}
      <Section className="bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-400 text-lg">
            Find answers to common questions about our pricing and plans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {faqItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 h-full hover:border-white/20 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <HelpCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-1" />
                  <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                </div>
                <p className="text-zinc-400 pl-8">{item.answer}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-zinc-400 mb-6">
            Still have questions? We're here to help.
          </p>
          <Button 
            variant="outline" 
            to="/contact"
            icon={<ArrowRight size={16} />}
            iconPosition="right"
          >
            Contact Support
          </Button>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="bg-gradient-to-b from-zinc-950 to-zinc-900">
        <GlassPanel className="p-8 md:p-12 max-w-4xl mx-auto text-center" glowEffect>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-zinc-300 text-lg mb-8 max-w-2xl mx-auto">
            Choose the plan that's right for you and start creating beautiful, responsive websites today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" to="/contact">
              Get Started
            </Button>
            <Button size="lg" variant="outline" to="/features">
              Learn More
            </Button>
          </div>
        </GlassPanel>
      </Section>
    </>
  );
};