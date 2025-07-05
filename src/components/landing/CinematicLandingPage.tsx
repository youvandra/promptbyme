import React, { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from 'framer-motion'
import { 
  Play, 
  Users, 
  Share2, 
  Eye, 
  EyeOff, 
  Link, 
  Globe, 
  ArrowRight,
  Zap,
  GitBranch,
  CheckCircle,
  Clock,
  Plus,
  MousePointer2,
  Layers,
  Target,
  Sparkles,
  ChevronDown,
  MessageSquare,
  Braces,
  Workflow,
  Lightbulb
} from 'lucide-react'

interface CinematicLandingPageProps {
  onSignInClick: () => void
}

export const CinematicLandingPage: React.FC<CinematicLandingPageProps> = ({ onSignInClick }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Smooth spring-based scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 400,
    damping: 40,
    restDelta: 0.001
  })

  // Transform scroll progress into section steps with smooth interpolation
  const currentStep = useTransform(smoothProgress, [0, 1], [0, 6])
  const [activeStep, setActiveStep] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const unsubscribe = currentStep.onChange((latest) => {
      setActiveStep(Math.floor(latest))
      setScrollProgress(latest % 1) // Get fractional part for smooth transitions
    })
    return unsubscribe
  }, [currentStep])

  // Typewriter effect state
  const [typedText, setTypedText] = useState('')
  const fullPromptText = "Create a landing page for a SaaS product with modern design, responsive layout, and conversion-focused sections including hero, features, pricing, testimonials, and CTA..."

  // Typewriter effect for step 1
  useEffect(() => {
    if (activeStep >= 1) {
      let index = 0
      const timer = setInterval(() => {
        if (index <= fullPromptText.length) {
          setTypedText(fullPromptText.slice(0, index))
          index++
        } else {
          clearInterval(timer)
        }
      }, 25)
      return () => clearInterval(timer)
    } else {
      setTypedText('')
    }
  }, [activeStep])

  // Smooth scroll to next section
  const scrollToNext = () => {
    if (containerRef.current) {
      const nextPosition = window.innerHeight * (activeStep + 1)
      window.scrollTo({
        top: nextPosition,
        behavior: 'smooth'
      })
    }
  }

  // Header opacity based on scroll
  const headerOpacity = useTransform(smoothProgress, [0, 0.85], [0.9, 0])
  const headerY = useTransform(smoothProgress, [0, 0.1], [0, -10])

  // Step content configurations
  const stepConfigs = [
    {
      title: "Design before you prompt",
      subtitle: "Map your next build with structured, reusable prompts.",
      cta: "Enter Playground"
    },
    {
      title: "Start with a single prompt",
      subtitle: "Watch your ideas take shape as you type",
      content: "typing"
    },
    {
      title: "Share your work",
      subtitle: "Make your prompts discoverable by the community",
      content: "sharing"
    },
    {
      title: "Build structured flows",
      subtitle: "Connect prompts into powerful workflows",
      content: "flow"
    },
    {
      title: "Run your flow",
      subtitle: "Trigger the entire prompt pipeline",
      content: "kanban"
    },
    {
      title: "Collaborate with your team",
      subtitle: "Invite teammates and build together",
      content: "team"
    },
    {
      title: "See the bigger picture",
      subtitle: "Your complete project mapped out and ready to build",
      content: "final"
    }
  ]

  const currentConfig = stepConfigs[activeStep] || stepConfigs[0]

  // Neo Brutalism features
  const features = [
    {
      icon: <MessageSquare size={24} />,
      title: "Prompt Templates",
      description: "Start with proven templates for different AI models and use cases"
    },
    {
      icon: <Braces size={24} />,
      title: "Variable System",
      description: "Create dynamic prompts with reusable variables and parameters"
    },
    {
      icon: <Workflow size={24} />,
      title: "Flow Builder",
      description: "Chain prompts together into powerful multi-step workflows"
    },
    {
      icon: <Lightbulb size={24} />,
      title: "Version Control",
      description: "Track changes and improvements to your prompts over time"
    }
  ]

  return (
    <div ref={containerRef} className="relative" style={{ height: '700vh' }}>
      {/* Pinned container */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Enhanced animated background for ultrawide support */}
        <motion.div 
          className="absolute inset-0 bg-zinc-950"
          animate={{
            backgroundColor: activeStep >= 3 ? 
              "rgba(118,162,247,0.02)" :
              "rgba(255,106,61,0.02)"
          }}
          transition={{ duration: 2, ease: "easeInOut" }}
          style={{
            background: activeStep >= 3 ? 
              "radial-gradient(ellipse at 30% 70%, rgba(118,162,247,0.05), rgba(0,0,0,0) 70%)" :
              "radial-gradient(ellipse at 70% 30%, rgba(255,106,61,0.05), rgba(0,0,0,0) 70%)"
          }}
        >
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" style={{ 
              backgroundImage: 'linear-gradient(to right, #76a2f7 1px, transparent 1px), linear-gradient(to bottom, #76a2f7 1px, transparent 1px)',
              backgroundSize: '20px 20px' 
            }}></div>
          </div>
        </motion.div>

        {/* Header with logo and sign in - positioned inside first section */}
        <motion.div 
          className="absolute top-0 left-0 right-0 z-50 p-4 md:p-6 lg:p-8"
          style={{ 
            opacity: headerOpacity,
            y: headerY
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-2 md:gap-3 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl shadow-[6px_6px_0px_0px_rgba(118,162,247,1)]"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              whileHover={{ scale: 1.05 }}
            >
              <img 
                src="/Logo Promptby.me(1).png" 
                alt="promptby.me logo" 
                className="w-6 h-6 md:w-8 md:h-8 object-contain"
              />
              <h1 className="text-sm md:text-lg font-bold text-black font-heading">
                promptby.me
              </h1>
            </motion.div>
            
            {/* Sign In Button - with proper padding from edge */}
            <motion.button
              onClick={onSignInClick}
              className="bg-highlight text-black font-bold px-4 py-1.5 md:px-6 md:py-2 rounded-xl md:rounded-2xl shadow-[4px_4px_0px_0px_rgba(118,162,247,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(118,162,247,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-200 text-sm md:text-base"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            >
              Sign in
            </motion.button>
          </div>
        </motion.div>

        {/* Main content area - optimized for all screen sizes */}
        <div className="relative z-10 h-full flex items-center justify-center px-4 md:px-6 lg:px-12">
          <div className="max-w-7xl mx-auto w-full">
            
            {/* Header section - with smooth transitions */}
            <motion.div 
              className="text-center mb-8 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1 
                className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-4 md:mb-6 leading-tight px-2 font-heading"
                key={currentConfig.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {activeStep === 0 ? (
                  <>
                    Design before
                    <span className="block text-primary">
                      you prompt
                    </span>
                  </>
                ) : (
                  currentConfig.title
                )}
              </motion.h1>
              
              <motion.p 
                className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-zinc-300 leading-relaxed max-w-4xl mx-auto px-4"
                key={currentConfig.subtitle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              >
                {currentConfig.subtitle}
              </motion.p>
            </motion.div>

            {/* Dynamic content area */}
            <div className="relative min-h-[300px] md:min-h-[400px] flex items-center justify-center px-2">
              <AnimatePresence mode="wait">
                
                {/* Step 0: Hero CTA */}
                {activeStep === 0 && (
                  <motion.div
                    key="hero"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center w-full"
                  >
                    <div className="bg-white p-6 md:p-8 lg:p-12 rounded-2xl md:rounded-3xl shadow-[8px_8px_0px_0px_rgba(118,162,247,1)] max-w-2xl mx-auto">
                      <div className="space-y-6 md:space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                          {features.map((feature, index) => (
                            <div key={index} className="bg-gray-100 p-4 rounded-xl border-2 border-black">
                              <div className="bg-primary text-white p-2 rounded-lg w-fit mb-2">
                                {feature.icon}
                              </div>
                              <h3 className="text-black font-bold text-lg mb-1 font-heading">{feature.title}</h3>
                              <p className="text-gray-700 text-sm">{feature.description}</p>
                            </div>
                          ))}
                        </div>
                        
                        <motion.button 
                          onClick={scrollToNext}
                          className="group relative px-6 py-3 md:px-8 md:py-4 bg-secondary text-white font-bold text-base md:text-lg rounded-xl md:rounded-2xl shadow-[6px_6px_0px_0px_rgba(118,162,247,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(118,162,247,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all duration-200 w-full sm:w-auto"
                        >
                          <span className="relative flex items-center justify-center gap-2">
                            Enter Playground
                            <Play size={16} className="md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                          </span>
                        </motion.button>
                        
                        {/* Scroll indicator */}
                        <motion.div 
                          className="flex flex-col items-center gap-2 text-zinc-400"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, delay: 1 }}
                        >
                          <motion.button
                            onClick={scrollToNext}
                            className="text-xs md:text-sm hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                            whileHover={{ y: -2 }}
                          >
                            <span>Scroll to explore</span>
                            <motion.div
                              animate={{ y: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <ChevronDown size={14} className="md:w-4 md:h-4 group-hover:text-primary transition-colors duration-300" />
                            </motion.div>
                          </motion.button>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Prompt Typing */}
                {activeStep === 1 && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      scale: 1 + scrollProgress * 0.02
                    }}
                    exit={{ opacity: 0, y: -30, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full max-w-5xl"
                  >
                    <motion.div 
                      className="bg-white p-4 md:p-6 lg:p-8 rounded-xl md:rounded-2xl shadow-[8px_8px_0px_0px_rgba(118,162,247,1)]"
                      animate={{ 
                        y: Math.sin(Date.now() * 0.001) * 2,
                        rotateX: scrollProgress * 2
                      }}
                      transition={{ 
                        y: { duration: 3, repeat: Infinity },
                        ease: "easeInOut"
                      }}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                          <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full" />
                          <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded-full" />
                          <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full" />
                          <span className="text-gray-500 text-xs md:text-sm ml-2 md:ml-4 font-bold">New Prompt</span>
                        </div>
                        
                        <div className="bg-gray-100 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 min-h-[150px] md:min-h-[200px] relative border-2 border-black">
                          <div className="text-gray-800 text-sm md:text-base lg:text-lg leading-relaxed">
                            {typedText}
                            <motion.span
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="text-primary"
                            >
                              |
                            </motion.span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 md:mt-6 gap-3">
                          <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <motion.button 
                              className="bg-primary text-white font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-md md:rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-200 text-xs md:text-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Save Prompt
                            </motion.button>
                            <motion.button 
                              className="bg-secondary text-white font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-md md:rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-200 text-xs md:text-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Make Public
                            </motion.button>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2 text-gray-500 font-bold">
                            <EyeOff size={12} className="md:w-4 md:h-4" />
                            <span className="text-xs md:text-sm">Private</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Step 2: Sharing */}
                {activeStep === 2 && (
                  <motion.div
                    key="sharing"
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      scale: 1,
                      rotateX: scrollProgress * 3
                    }}
                    exit={{ opacity: 0, y: -30, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full max-w-4xl"
                  >
                    <div className="space-y-4 md:space-y-8">
                      {/* Visibility toggle */}
                      <motion.div 
                        className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-[6px_6px_0px_0px_rgba(118,162,247,1)]"
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-3">
                          <h3 className="text-base md:text-lg font-bold text-black font-heading">Visibility Settings</h3>
                          <div className="flex items-center gap-2 md:gap-4">
                            {[
                              { label: "Private", icon: <EyeOff size={14} />, active: false },
                              { label: "Public", icon: <Globe size={14} />, active: true }
                            ].map((option, index) => (
                              <motion.button
                                key={index}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className={`flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-md md:rounded-lg transition-all duration-200 text-xs md:text-sm font-bold border-2 border-black ${
                                  option.active 
                                    ? 'bg-primary text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {option.icon}
                                <span>{option.label}</span>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </motion.div>

                      {/* Public preview */}
                      <motion.div 
                        className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-[6px_6px_0px_0px_rgba(255,106,61,1)] border-2 border-black transition-all duration-300 group cursor-pointer"
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        whileHover={{ 
                          y: -5, 
                          shadow: "[3px_3px_0px_0px_rgba(255,106,61,1)]",
                          translateX: 3,
                          translateY: 8
                        }}
                      >
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3 md:mb-4">
                            <div className="flex items-center gap-2 md:gap-3">
                              <motion.div 
                                className="w-8 h-8 md:w-10 md:h-10 bg-secondary rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base"
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                              >
                                A
                              </motion.div>
                              <div>
                                <h4 className="text-black font-bold text-sm md:text-base font-heading">Alex Chen</h4>
                                <p className="text-gray-500 text-xs md:text-sm">2 hours ago</p>
                              </div>
                            </div>
                            <motion.div
                              whileHover={{ rotate: 15, scale: 1.1 }}
                            >
                              <Share2 size={16} className="md:w-5 md:h-5 text-gray-500 group-hover:text-secondary transition-colors duration-300" />
                            </motion.div>
                          </div>
                          
                          <h3 className="text-base md:text-lg font-bold text-black mb-2 font-heading">Complete SaaS Landing Page Flow</h3>
                          <p className="text-gray-700 text-xs md:text-sm mb-3 md:mb-4">A comprehensive prompt flow for building modern SaaS landing pages with conversion optimization...</p>
                          
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-500">
                            <motion.div 
                              className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg border border-black"
                              whileHover={{ scale: 1.1 }}
                            >
                              <Eye size={10} className="md:w-3 md:h-3" />
                              <span>1.2k views</span>
                            </motion.div>
                            <motion.div 
                              className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg border border-black"
                              whileHover={{ scale: 1.1 }}
                            >
                              <span>❤️ 89 likes</span>
                            </motion.div>
                            <motion.div 
                              className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg border border-black"
                              whileHover={{ scale: 1.1 }}
                            >
                              <GitBranch size={10} className="md:w-3 md:h-3" />
                              <span>23 forks</span>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Flow Structure */}
                {activeStep === 3 && (
                  <motion.div
                    key="flow"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      y: 0,
                      rotateY: scrollProgress * 3
                    }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full max-w-6xl"
                  >
                    <div className="relative perspective-1000">
                      {/* Animated connection lines - hidden on mobile for clarity */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" style={{ zIndex: 1 }}>
                        <defs>
                          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#76a2f7" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#ff6a3d" stopOpacity="0.6" />
                          </linearGradient>
                        </defs>
                        <motion.path
                          d="M 200 100 Q 300 50 400 100 Q 500 150 600 100"
                          stroke="url(#flowGradient)"
                          strokeWidth="4"
                          strokeDasharray="8 4"
                          fill="none"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, ease: "easeInOut" }}
                        />
                      </svg>

                      {/* Flow nodes */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 relative z-10">
                        {[
                          { title: "Landing Page", desc: "Hero, features, pricing", icon: <Zap size={20} className="md:w-6 md:h-6" />, color: "#76a2f7" },
                          { title: "Authentication", desc: "Login, signup, verification", icon: <Users size={20} className="md:w-6 md:h-6" />, color: "#ff6a3d" },
                          { title: "Database Schema", desc: "Tables, relations, indexes", icon: <GitBranch size={20} className="md:w-6 md:h-6" />, color: "#f5f7a1" }
                        ].map((node, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              rotateX: scrollProgress * 5
                            }}
                            transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                            className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group cursor-pointer"
                            style={{ backgroundColor: index === 0 ? '#76a2f7' : index === 1 ? '#ff6a3d' : '#f5f7a1' }}
                            whileHover={{ 
                              scale: 1.05,
                              z: 50
                            }}
                          >
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                                <motion.div
                                  className="p-2 rounded-lg bg-white"
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.6 }}
                                >
                                  {node.icon}
                                </motion.div>
                                <h3 className="text-base md:text-lg font-bold text-black font-heading">{node.title}</h3>
                              </div>
                              <p className="text-black font-medium text-xs md:text-sm mb-3 md:mb-4">{node.desc}</p>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold bg-white px-2 py-1 rounded-lg border border-black">3 prompts</span>
                                <motion.div 
                                  className="w-3 h-3 rounded-full bg-black"
                                  animate={{ scale: [1, 1.5, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Kanban Board */}
                {activeStep === 4 && (
                  <motion.div
                    key="kanban"
                    initial={{ opacity: 0, x: 50, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      scale: 1
                    }}
                    exit={{ opacity: 0, x: -50, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full max-w-6xl"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                      {[
                        {
                          title: "Content Production",
                          items: [
                            { name: "Content ideas", color: "primary" },
                            { name: "Content script", color: "primary" },
                            { name: "Generate Caption", color: "secondary" },
                          ],
                        },
                        {
                          title: "Audience Engagement",
                          items: [
                            { name: "CTA for audience reply", color: "highlight" },
                          ],
                        },
                        {
                          title: "Sponsored Endorsement Draft",
                          items: [
                            { name: "Brand brief", color: "secondary" },
                            { name: "Soft-selling story", color: "highlight" },
                          ],
                        },
                      ]
                      .map((column, columnIndex) => (
                        <motion.div 
                          key={columnIndex} 
                          className="space-y-3 md:space-y-4"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0,
                            x: scrollProgress * (columnIndex - 1) * 5
                          }}
                          transition={{ duration: 0.5, delay: columnIndex * 0.1, ease: "easeOut" }}
                        >
                          <div className="flex items-center gap-2 mb-3 md:mb-4">
                            <h3 className="text-base md:text-lg font-bold text-white font-heading">{column.title}</h3>
                            <motion.span 
                              className="text-xs font-bold bg-white text-black px-2 py-1 rounded-full border-2 border-black"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3, delay: columnIndex * 0.2 + 0.3 }}
                            >
                              {column.items.length}
                            </motion.span>
                          </div>
                          
                          <div className="space-y-2 md:space-y-3">
                            {column.items.map((item, itemIndex) => (
                              <motion.div
                                key={itemIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: columnIndex * 0.1 + itemIndex * 0.1 }}
                                className={`p-3 md:p-4 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 cursor-pointer group ${
                                  item.color === 'primary' ? 'bg-primary text-white' :
                                  item.color === 'secondary' ? 'bg-secondary text-white' :
                                  'bg-highlight text-black'
                                }`}
                                whileHover={{ scale: 1.02 }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs md:text-sm font-bold">{item.name}</span>
                                  <motion.div 
                                    className="w-2 h-2 rounded-full bg-black"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: itemIndex * 0.5 }}
                                  />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Team Collaboration */}
                {activeStep === 5 && (
                  <motion.div
                    key="team"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full max-w-5xl"
                  >
                    <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(118,162,247,1)]">
                      <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-3">
                          <h3 className="text-xl md:text-2xl font-bold text-black font-heading">Team Members</h3>
                          <motion.button 
                            className="bg-primary text-white font-bold px-3 py-2 md:px-4 md:py-2 rounded-md md:rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-200 flex items-center gap-2 text-sm md:text-base self-start sm:self-auto"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Plus size={14} className="md:w-4 md:h-4" />
                            Invite Member
                          </motion.button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                          {[
                            { name: "Alex Chen", role: "Product Designer", avatar: "A", status: "online", color: "primary" },
                            { name: "Sarah Kim", role: "Frontend Dev", avatar: "S", status: "online", color: "secondary" },
                            { name: "Mike Johnson", role: "Backend Dev", avatar: "M", status: "away", color: "highlight" }
                          ].map((member, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: index * 0.1 }}
                              className={`p-3 md:p-4 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group ${
                                member.color === 'primary' ? 'bg-primary' : 
                                member.color === 'secondary' ? 'bg-secondary' : 
                                'bg-highlight'
                              }`}
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="relative">
                                  <motion.div 
                                    className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center text-black font-bold text-sm md:text-base border-2 border-black"
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.6 }}
                                  >
                                    {member.avatar}
                                  </motion.div>
                                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-black ${
                                    member.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                                  }`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className={`font-bold text-sm md:text-base truncate ${member.color === 'highlight' ? 'text-black' : 'text-white'}`}>{member.name}</h4>
                                  <p className={`text-xs md:text-sm truncate ${member.color === 'highlight' ? 'text-gray-700' : 'text-white/80'}`}>{member.role}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 6: Final Overview */}
                {activeStep === 6 && (
                  <motion.div
                    key="final"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center w-full max-w-4xl"
                  >
                    <div className="bg-white p-6 md:p-8 lg:p-12 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(118,162,247,1)]">
                      <div className="relative z-10 space-y-6 md:space-y-8">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className="w-16 h-16 md:w-20 md:h-20 bg-highlight rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <CheckCircle size={32} className="md:w-10 md:h-10 text-black" />
                        </motion.div>
                        
                        <motion.h2 
                          className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-3 md:mb-4 font-heading"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                        >
                          Ready to Build
                        </motion.h2>
                        
                        <motion.p 
                          className="text-base md:text-lg lg:text-xl text-gray-700 mb-6 md:mb-8 px-2"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.6 }}
                        >
                          Your complete project is mapped out with structured prompts, ready for development.
                        </motion.p>
                        
                        <motion.div 
                          className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.8 }}
                        >
                          <motion.button 
                            onClick={onSignInClick}
                            className="bg-secondary text-white font-bold px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span className="relative flex items-center justify-center gap-2">
                              Start Building
                              <ArrowRight size={16} className="md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                            </span>
                          </motion.button>
                          
                          <motion.button 
                            className="bg-highlight text-black font-bold px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span className="relative flex items-center justify-center gap-2">
                              View Demo
                              <Play size={16} className="md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                            </span>
                          </motion.button>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center gap-1 md:gap-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <motion.div
                key={index}
                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-300 ${
                  index === activeStep ? 'bg-highlight w-4 md:w-8' : 'bg-zinc-600'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}