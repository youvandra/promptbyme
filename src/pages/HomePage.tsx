import React, { useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Zap, Shield, Layers, Users, Globe, ChevronDown } from 'lucide-react';
import { Section } from '../components/ui/Section';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { GlassPanel } from '../components/ui/GlassPanel';

export const HomePage: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  
  // Scroll to features section
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Features data
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-indigo-400" />,
      title: 'Lightning Fast',
      description: 'Optimized performance ensures your website loads quickly on all devices and connections.'
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-400" />,
      title: 'Secure by Design',
      description: 'Built with security best practices to keep your data and users safe.'
    },
    {
      icon: <Layers className="w-6 h-6 text-blue-400" />,
      title: 'Modern Stack',
      description: 'Leveraging the latest technologies for a future-proof and maintainable codebase.'
    },
    {
      icon: <Users className="w-6 h-6 text-pink-400" />,
      title: 'User Focused',
      description: 'Designed with real users in mind, creating intuitive and accessible experiences.'
    },
    {
      icon: <Globe className="w-6 h-6 text-emerald-400" />,
      title: 'Global Ready',
      description: 'Internationalization support built-in for reaching audiences worldwide.'
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: 'SEO Optimized',
      description: 'Structured for maximum visibility in search engines and social sharing.'
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      quote: "The glassmorphic design elements completely transformed our brand's online presence. Our conversion rates have increased by 40% since the redesign.",
      author: "Sarah Johnson",
      role: "Marketing Director, TechCorp",
      avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      quote: "I've never seen a website that adapts so perfectly to every screen size. From my ultrawide monitor to my phone, the experience is flawless.",
      author: "Michael Chen",
      role: "UX Designer, DesignHub",
      avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      quote: "The attention to detail in the animations and transitions makes the entire user journey feel premium and intentional. Absolutely worth the investment.",
      author: "Alex Rivera",
      role: "CEO, Startup Ventures",
      avatar: "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=150"
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10"
          style={{ opacity, y }}
        >
          <button 
            onClick={scrollToFeatures}
            className="flex flex-col items-center text-zinc-400 hover:text-white transition-colors"
          >
            <span className="text-sm mb-2">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown size={20} />
            </motion.div>
          </button>
        </motion.div>

        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                  Beautiful <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Glassmorphic</span> Web Design
                </h1>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <p className="text-xl md:text-2xl text-zinc-300 mb-8 md:mb-12 leading-relaxed">
                  Create stunning, responsive websites with modern glass effects that look amazing on any device.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button size="lg" to="/contact">
                  Get Started
                </Button>
                <Button size="lg" variant="outline" to="/features">
                  Learn More
                </Button>
              </motion.div>
            </div>
            
            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-16 md:mt-20 relative max-w-5xl mx-auto"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl filter blur-xl transform scale-105" />
                
                {/* Glass card */}
                <GlassPanel className="p-4 md:p-8">
                  <div className="aspect-[16/9] rounded-lg overflow-hidden">
                    <img 
                      src="https://images.pexels.com/photos/5926389/pexels-photo-5926389.jpeg?auto=compress&cs=tinysrgb&w=1280" 
                      alt="Dashboard interface with glassmorphism design" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </GlassPanel>
                
                {/* Floating elements */}
                <motion.div 
                  className="absolute -top-6 -right-6 md:-top-8 md:-right-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-3 md:p-4"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-500/30 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-indigo-300" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm md:text-base">Active Users</p>
                      <p className="text-indigo-300 text-xs md:text-sm">+28.4% this month</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="absolute -bottom-6 -left-6 md:-bottom-8 md:-left-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-3 md:p-4"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500/30 rounded-full flex items-center justify-center">
                      <Zap className="w-4 h-4 md:w-5 md:h-5 text-purple-300" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm md:text-base">Performance</p>
                      <p className="text-purple-300 text-xs md:text-sm">99/100 score</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Section id="features" className="bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Designed for the Modern Web
          </h2>
          <p className="text-zinc-400 text-lg">
            Our framework combines cutting-edge technologies with beautiful design principles to create websites that stand out.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
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
                  <p className="text-zinc-400 flex-grow">{feature.description}</p>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      icon={<ArrowRight size={14} />}
                      iconPosition="right"
                    >
                      Learn more
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Testimonials Section */}
      <Section id="testimonials" className="bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by Innovative Teams
          </h2>
          <p className="text-zinc-400 text-lg">
            See what our clients have to say about their experience with our glassmorphic designs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <GlassPanel className="h-full p-6 md:p-8" hoverEffect>
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.33333 21.3333C7.86667 21.3333 6.66667 20.8 5.73333 19.7333C4.8 18.6667 4.33333 17.3333 4.33333 15.7333C4.33333 14.2667 4.73333 12.9333 5.53333 11.7333C6.33333 10.5333 7.4 9.6 8.73333 8.93333C10.0667 8.26667 11.5333 7.93333 13.1333 7.93333V11.2667C12.2667 11.2667 11.5333 11.5333 10.9333 12.0667C10.3333 12.6 10.0667 13.3333 10.0667 14.2667H13.1333V21.3333H9.33333ZM21.3333 21.3333C19.8667 21.3333 18.6667 20.8 17.7333 19.7333C16.8 18.6667 16.3333 17.3333 16.3333 15.7333C16.3333 14.2667 16.7333 12.9333 17.5333 11.7333C18.3333 10.5333 19.4 9.6 20.7333 8.93333C22.0667 8.26667 23.5333 7.93333 25.1333 7.93333V11.2667C24.2667 11.2667 23.5333 11.5333 22.9333 12.0667C22.3333 12.6 22.0667 13.3333 22.0667 14.2667H25.1333V21.3333H21.3333Z" fill="url(#paint0_linear_1_2)" />
                      <defs>
                        <linearGradient id="paint0_linear_1_2" x1="4.33333" y1="7.93333" x2="25.1333" y2="21.3333" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#6366F1" />
                          <stop offset="1" stopColor="#A855F7" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  
                  <p className="text-zinc-300 mb-6 flex-grow">"{testimonial.quote}"</p>
                  
                  <div className="flex items-center">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.author} 
                      className="w-10 h-10 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <p className="text-white font-medium">{testimonial.author}</p>
                      <p className="text-zinc-400 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="bg-gradient-to-b from-zinc-950 to-zinc-900">
        <GlassPanel className="p-8 md:p-12 max-w-4xl mx-auto" glowEffect>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Web Presence?
            </h2>
            <p className="text-zinc-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of businesses creating stunning, responsive websites with our glassmorphic design system.
            </p>
            <Button size="lg" to="/contact" icon={<ArrowRight size={16} />} iconPosition="right">
              Get Started Today
            </Button>
          </div>
        </GlassPanel>
      </Section>
    </>
  );
};