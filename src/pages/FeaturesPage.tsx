import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Layers, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Laptop, 
  ArrowRight, 
  Check, 
  Code, 
  Palette, 
  Shield, 
  Globe, 
  Cpu, 
  RefreshCw 
} from 'lucide-react';
import { Section } from '../components/ui/Section';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { GlassPanel } from '../components/ui/GlassPanel';

export const FeaturesPage: React.FC = () => {
  // Core features
  const coreFeatures = [
    {
      icon: <Layers className="w-6 h-6 text-indigo-400" />,
      title: 'Glassmorphic UI Components',
      description: 'Beautiful glass-effect components with backdrop blur, subtle transparency, and elegant borders.'
    },
    {
      icon: <Smartphone className="w-6 h-6 text-purple-400" />,
      title: 'Fully Responsive',
      description: 'Designs that look perfect on every device, from mobile phones to ultrawide monitors.'
    },
    {
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      title: 'Performance Optimized',
      description: 'Lightweight and fast-loading components that don't sacrifice visual quality.'
    },
    {
      icon: <Code className="w-6 h-6 text-pink-400" />,
      title: 'Clean, Modern Code',
      description: 'Well-structured, maintainable code following best practices and modern standards.'
    },
    {
      icon: <Palette className="w-6 h-6 text-emerald-400" />,
      title: 'Customizable Design',
      description: 'Easily adapt colors, effects, and components to match your brand identity.'
    },
    {
      icon: <Shield className="w-6 h-6 text-amber-400" />,
      title: 'Accessibility Built-in',
      description: 'WCAG compliant components ensuring your site works for everyone.'
    }
  ];

  // Responsive features
  const responsiveFeatures = [
    {
      icon: <Monitor className="w-6 h-6 text-indigo-400" />,
      title: 'Ultrawide Support',
      description: 'Optimized layouts for ultrawide monitors (2560px+) with proper content distribution.'
    },
    {
      icon: <Laptop className="w-6 h-6 text-purple-400" />,
      title: 'Desktop Perfect',
      description: 'Ideal viewing experience on standard desktop screens (1440px).'
    },
    {
      icon: <Tablet className="w-6 h-6 text-blue-400" />,
      title: 'Tablet Friendly',
      description: 'Responsive layouts for tablets in both portrait and landscape orientations (768-1024px).'
    },
    {
      icon: <Smartphone className="w-6 h-6 text-pink-400" />,
      title: 'Mobile Optimized',
      description: 'Carefully crafted mobile experience for small screens (below 480px).'
    }
  ];

  // Integration features
  const integrationFeatures = [
    {
      title: 'CMS Integration',
      description: 'Seamlessly connect with popular content management systems.'
    },
    {
      title: 'E-commerce Ready',
      description: 'Compatible with leading e-commerce platforms and payment gateways.'
    },
    {
      title: 'Analytics Support',
      description: 'Built-in support for tracking and analytics tools.'
    },
    {
      title: 'Marketing Tools',
      description: 'Easy integration with email marketing and CRM systems.'
    },
    {
      title: 'Social Media',
      description: 'Connect and share content across all major social platforms.'
    },
    {
      title: 'API Connectivity',
      description: 'Flexible API integration for custom data sources and services.'
    }
  ];

  // Enterprise features
  const enterpriseFeatures = [
    {
      icon: <Globe className="w-5 h-5 text-indigo-400" />,
      title: 'Global CDN',
      description: 'Lightning-fast content delivery worldwide'
    },
    {
      icon: <Shield className="w-5 h-5 text-purple-400" />,
      title: 'Advanced Security',
      description: 'Enterprise-grade protection for your data'
    },
    {
      icon: <Cpu className="w-5 h-5 text-blue-400" />,
      title: 'Dedicated Infrastructure',
      description: 'Optimized servers for maximum performance'
    },
    {
      icon: <RefreshCw className="w-5 h-5 text-pink-400" />,
      title: '99.9% Uptime',
      description: 'Reliable service with minimal downtime'
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
              Powerful Features for Modern Websites
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
              Discover the tools and technologies that make our glassmorphic design system stand out from the crowd.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button size="lg" to="/contact">
              Get Started
            </Button>
          </motion.div>
        </div>
      </Section>

      {/* Core Features Section */}
      <Section id="core" className="bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Core Features
          </h2>
          <p className="text-zinc-400 text-lg">
            Everything you need to create stunning, modern websites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {coreFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="flex flex-col h-full">
                  <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Responsive Design Section */}
      <Section className="bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Responsive Across All Devices
            </h2>
            <p className="text-zinc-300 mb-8 leading-relaxed">
              Our design system ensures your website looks perfect on every screen size, from ultrawide monitors to mobile phones. We've carefully crafted responsive behaviors for each component to provide the optimal user experience regardless of device.
            </p>
            
            <div className="space-y-4">
              {responsiveFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-lg flex-shrink-0 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-zinc-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl filter blur-xl transform scale-105" />
            
            {/* Responsive devices mockup */}
            <GlassPanel className="p-6 relative">
              <div className="relative">
                {/* Desktop */}
                <div className="bg-zinc-800 rounded-lg p-3 shadow-xl">
                  <div className="bg-zinc-900 rounded-md aspect-[16/9] overflow-hidden">
                    <img 
                      src="https://images.pexels.com/photos/5926382/pexels-photo-5926382.jpeg?auto=compress&cs=tinysrgb&w=1280" 
                      alt="Desktop view" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Tablet */}
                <div className="absolute -bottom-10 -right-10 w-1/2 bg-zinc-800 rounded-lg p-2 shadow-xl">
                  <div className="bg-zinc-900 rounded-md aspect-[4/3] overflow-hidden">
                    <img 
                      src="https://images.pexels.com/photos/5926382/pexels-photo-5926382.jpeg?auto=compress&cs=tinysrgb&w=600" 
                      alt="Tablet view" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Mobile */}
                <div className="absolute -bottom-5 -left-5 w-1/4 bg-zinc-800 rounded-lg p-1.5 shadow-xl">
                  <div className="bg-zinc-900 rounded-md aspect-[9/16] overflow-hidden">
                    <img 
                      src="https://images.pexels.com/photos/5926382/pexels-photo-5926382.jpeg?auto=compress&cs=tinysrgb&w=300" 
                      alt="Mobile view" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>
      </Section>

      {/* Integrations Section */}
      <Section id="integrations" className="bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Seamless Integrations
          </h2>
          <p className="text-zinc-400 text-lg">
            Connect with your favorite tools and platforms without any hassle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {integrationFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 h-full hover:border-white/20 transition-colors">
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Button 
            variant="outline" 
            icon={<ArrowRight size={16} />} 
            iconPosition="right"
            to="/contact"
          >
            View All Integrations
          </Button>
        </div>
      </Section>

      {/* Enterprise Section */}
      <Section id="enterprise" className="bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Enterprise-Grade Solutions
            </h2>
            <p className="text-zinc-300 mb-6 leading-relaxed">
              For businesses that need more power, security, and support, our enterprise solutions offer enhanced features and dedicated resources.
            </p>
            <p className="text-zinc-300 mb-8 leading-relaxed">
              Our enterprise clients receive priority support, custom development services, and advanced security features to ensure their websites perform flawlessly at scale.
            </p>
            <Button 
              size="lg" 
              to="/contact"
              icon={<ArrowRight size={16} />}
              iconPosition="right"
            >
              Contact Sales
            </Button>
          </div>
          
          <div className="lg:col-span-3">
            <GlassPanel className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {enterpriseFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 bg-white/5 rounded-lg flex-shrink-0 flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-zinc-400">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">Enterprise Plan Includes:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Dedicated account manager',
                    'Custom development',
                    'SLA guarantees',
                    'Advanced security',
                    'Priority support',
                    'Regular performance audits',
                    'Custom integrations',
                    'Team training'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-400 flex-shrink-0" />
                      <span className="text-zinc-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="bg-gradient-to-b from-zinc-950 to-zinc-900">
        <GlassPanel className="p-8 md:p-12 max-w-4xl mx-auto text-center" glowEffect>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-zinc-300 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of businesses creating stunning, responsive websites with our glassmorphic design system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" to="/contact">
              Contact Us
            </Button>
            <Button size="lg" variant="outline" to="/pricing">
              View Pricing
            </Button>
          </div>
        </GlassPanel>
      </Section>
    </>
  );
};