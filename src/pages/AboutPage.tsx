import React from 'react';
import { motion } from 'framer-motion';
import { Users, Award, Calendar, Briefcase, ArrowRight } from 'lucide-react';
import { Section } from '../components/ui/Section';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { GlassPanel } from '../components/ui/GlassPanel';

export const AboutPage: React.FC = () => {
  // Team members data
  const teamMembers = [
    {
      name: 'Alex Morgan',
      role: 'Founder & CEO',
      bio: 'Former design lead at major tech companies with 15+ years of experience in UI/UX.',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
      name: 'Samantha Chen',
      role: 'Lead Developer',
      bio: 'Full-stack developer specializing in React and modern web technologies.',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Design Director',
      bio: 'Award-winning designer with a passion for creating beautiful, functional interfaces.',
      avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
      name: 'Emily Johnson',
      role: 'Marketing Lead',
      bio: 'Digital marketing expert with a background in growth strategy and brand development.',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300'
    }
  ];

  // Company milestones
  const milestones = [
    {
      year: '2020',
      title: 'Company Founded',
      description: 'Started with a vision to revolutionize web design with modern glass effects.'
    },
    {
      year: '2021',
      title: 'First Major Client',
      description: 'Partnered with a Fortune 500 company to redesign their digital presence.'
    },
    {
      year: '2022',
      title: 'Framework Launch',
      description: 'Released our open-source glassmorphic design framework to the public.'
    },
    {
      year: '2023',
      title: 'International Expansion',
      description: 'Opened offices in Europe and Asia to serve our growing global client base.'
    },
    {
      year: '2024',
      title: 'Design Award',
      description: 'Recognized with multiple industry awards for innovation in web design.'
    }
  ];

  // Open positions
  const openPositions = [
    {
      title: 'Senior Frontend Developer',
      location: 'Remote',
      type: 'Full-time'
    },
    {
      title: 'UX/UI Designer',
      location: 'San Francisco, CA',
      type: 'Full-time'
    },
    {
      title: 'Marketing Specialist',
      location: 'New York, NY',
      type: 'Full-time'
    },
    {
      title: 'Content Writer',
      location: 'Remote',
      type: 'Contract'
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
              Our Story
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
              We're a team of designers and developers passionate about creating beautiful, functional websites that push the boundaries of web design.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Mission Section */}
      <Section id="story" className="bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Our Mission
            </h2>
            <p className="text-zinc-300 mb-6 leading-relaxed">
              At Glassmorphic, we believe that great design should be accessible to everyone. Our mission is to democratize beautiful web design by providing tools, templates, and services that make it easy for businesses of all sizes to create stunning online experiences.
            </p>
            <p className="text-zinc-300 mb-6 leading-relaxed">
              We're committed to pushing the boundaries of what's possible on the web, embracing new technologies and design trends while maintaining a focus on performance, accessibility, and user experience.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-400" />
                <span className="text-white font-medium">20+ Team Members</span>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
                <Award className="w-5 h-5 text-purple-400" />
                <span className="text-white font-medium">15+ Awards</span>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">Since 2020</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl filter blur-xl transform scale-105" />
            
            {/* Glass card */}
            <GlassPanel className="p-4 md:p-6">
              <div className="aspect-[4/3] rounded-lg overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1280" 
                  alt="Our team collaborating" 
                  className="w-full h-full object-cover"
                />
              </div>
            </GlassPanel>
          </div>
        </div>
      </Section>

      {/* Timeline Section */}
      <Section className="bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our Journey
          </h2>
          <p className="text-zinc-400 text-lg">
            From humble beginnings to industry recognition, here's how we've grown over the years.
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-white/10 transform md:translate-x-px"></div>
          
          {/* Timeline events */}
          <div className="space-y-12 relative">
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5 }}
                className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 md:gap-0`}
              >
                <div className="md:w-1/2 md:pr-12 md:pl-0 pl-12 relative">
                  {/* Timeline dot */}
                  <div className="absolute left-0 md:left-auto md:right-0 top-0 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center transform translate-x-[-50%] md:translate-x-[50%]">
                    <div className="w-4 h-4 bg-zinc-950 rounded-full"></div>
                  </div>
                  
                  {index % 2 === 0 ? (
                    <div className="text-right hidden md:block">
                      <div className="inline-block bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2 text-indigo-300 font-medium mb-4">
                        {milestone.year}
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">{milestone.title}</h3>
                      <p className="text-zinc-400">{milestone.description}</p>
                    </div>
                  ) : (
                    <div className="md:hidden">
                      <div className="inline-block bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2 text-indigo-300 font-medium mb-4">
                        {milestone.year}
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">{milestone.title}</h3>
                      <p className="text-zinc-400">{milestone.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="md:w-1/2 md:pl-12 pl-12 relative">
                  {index % 2 === 1 ? (
                    <div className="text-left hidden md:block">
                      <div className="inline-block bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2 text-indigo-300 font-medium mb-4">
                        {milestone.year}
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">{milestone.title}</h3>
                      <p className="text-zinc-400">{milestone.description}</p>
                    </div>
                  ) : (
                    <div className="md:hidden">
                      <div className="inline-block bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2 text-indigo-300 font-medium mb-4">
                        {milestone.year}
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">{milestone.title}</h3>
                      <p className="text-zinc-400">{milestone.description}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Team Section */}
      <Section id="team" className="bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Meet Our Team
          </h2>
          <p className="text-zinc-400 text-lg">
            The talented people behind our success.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="p-0">
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-1">{member.name}</h3>
                    <p className="text-indigo-400 text-sm mb-3">{member.role}</p>
                    <p className="text-zinc-400">{member.bio}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Careers Section */}
      <Section id="careers" className="bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Join Our Team
            </h2>
            <p className="text-zinc-300 mb-6 leading-relaxed">
              We're always looking for talented individuals to join our growing team. If you're passionate about design, development, or helping businesses succeed online, we'd love to hear from you.
            </p>
            <p className="text-zinc-300 mb-8 leading-relaxed">
              We offer competitive salaries, flexible remote work options, continuous learning opportunities, and a collaborative, inclusive culture.
            </p>
            <Button 
              size="lg" 
              icon={<ArrowRight size={16} />} 
              iconPosition="right"
              to="/contact"
            >
              View All Positions
            </Button>
          </div>
          
          <div>
            <GlassPanel className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <span>Open Positions</span>
              </h3>
              
              <div className="space-y-4">
                {openPositions.map((position, index) => (
                  <div 
                    key={index}
                    className="p-4 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-medium mb-1">{position.title}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-400 text-sm">{position.location}</span>
                          <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                          <span className="text-zinc-400 text-sm">{position.type}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="bg-gradient-to-b from-zinc-950 to-zinc-900">
        <GlassPanel className="p-8 md:p-12 max-w-4xl mx-auto text-center" glowEffect>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Work Together?
          </h2>
          <p className="text-zinc-300 text-lg mb-8 max-w-2xl mx-auto">
            Let's create something amazing. Reach out to discuss how we can help bring your vision to life.
          </p>
          <Button size="lg" to="/contact">
            Get in Touch
          </Button>
        </GlassPanel>
      </Section>
    </>
  );
};