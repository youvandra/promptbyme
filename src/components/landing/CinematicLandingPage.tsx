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
  ChevronDown
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

  return (
    <div ref={containerRef} className="relative" style={{ height: '700vh' }}>
      {/* Pinned container */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Enhanced animated background for ultrawide support */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950"
          animate={{
            background: activeStep >= 3 ? 
              "radial-gradient(ellipse at 30% 70%, rgba(118,162,247,0.15), transparent 70%)" :
              "radial-gradient(ellipse at 70% 30%, rgba(255,106,61,0.15), transparent 70%)"
          }}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
          {/* Ultrawide background elements */}
          <motion.div 
            className="absolute inset-0"
            animate={{
              background: `
                radial-gradient(circle at ${50 + Math.sin(activeStep) * 20}% ${50 + Math.cos(activeStep) * 20}%, rgba(118,162,247,0.1), transparent 70%),
                linear-gradient(135deg, rgba(118,162,247,0.05) 0%, transparent 50%, rgba(255,106,61,0.05) 100%)
              `
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Abstract shapes for ultrawide screens */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-48 h-48 md:w-96 md:h-96 rounded-full opacity-5"
                style={{
                  background: `radial-gradient(circle, ${i % 2 === 0 ? 'rgba(118,162,247,0.3)' : 'rgba(255,106,61,0.3)'}, transparent 70%)`,
                  left: `${-10 + i * 25}%`,
                  top: `${10 + i * 15}%`,
                }}
                animate={{
                  x: [0, 50, 0],
                  y: [0, -30, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
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
              className="flex items-center gap-2 md:gap-3 glass-panel bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl px-3 py-1.5 md:px-4 md:py-2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              whileHover={{ opacity: 1, scale: 1.05 }}
            >
              <img 
                src="/Logo Promptby.me(1).png" 
                alt="promptby.me logo" 
                className="w-6 h-6 md:w-8 md:h-8 object-contain"
              />
              <h1 className="text-sm md:text-lg font-semibold text-white">
                promptby.me
              </h1>
            </motion.div>
            
            {/* Sign In Button - with proper padding from edge */}
            <motion.button
              onClick={onSignInClick}
              className="glass-button bg-gray-800/20 backdrop-blur-xl border border-gray-700/30 hover:border-primary/30 text-white font-medium px-4 py-1.5 md:px-6 md:py-2 rounded-xl md:rounded-2xl transition-all duration-300 hover:bg-primary/10 text-sm md:text-base"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              whileHover={{ opacity: 1, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
                className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-4 md:mb-6 leading-tight px-2"
                key={currentConfig.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {activeStep === 0 ? (
                  <>
                    Design before
                    <span className="block bg-gradient-to-r from-primary via-secondary to-highlight bg-clip-text text-transparent">
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
                    <div className="glass-panel bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12 shadow-2xl max-w-2xl mx-auto">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl md:rounded-3xl" />
                      <div className="absolute inset-0 rounded-2xl md:rounded-3xl ring-1 ring-inset ring-white/20" />
                      
                      <div className="relative z-10 space-y-6 md:space-y-8">
                        <motion.button 
                          onClick={scrollToNext}
                          className="group relative px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-primary to-secondary rounded-xl md:rounded-2xl text-white font-semibold text-base md:text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/25 w-full sm:w-auto"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
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
                              <ChevronDown size={14} className="md:w-4 md:h-4 group-hover:text-indigo-400 transition-colors duration-300" />
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
                      className="glass-panel bg-gray-900/30 backdrop-blur-2xl border border-gray-800/30 rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 shadow-2xl"
                      animate={{ 
                        y: Math.sin(Date.now() * 0.001) * 2,
                        rotateX: scrollProgress * 2
                      }}
                      transition={{ 
                        y: { duration: 3, repeat: Infinity },
                        ease: "easeInOut"
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl md:rounded-2xl" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                          <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full" />
                          <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded-full" />
                          <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full" />
                          <span className="text-zinc-500 text-xs md:text-sm ml-2 md:ml-4">New Prompt</span>
                        </div>
                        
                        <div className="bg-zinc-800/50 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 min-h-[150px] md:min-h-[200px] relative">
                          <div className="text-zinc-300 text-sm md:text-base lg:text-lg leading-relaxed">
                            {typedText}
                            <motion.span
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="text-indigo-400"
                            >
                              |
                            </motion.span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 md:mt-6 gap-3">
                          <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <motion.button 
                              className="glass-button px-3 py-1.5 md:px-4 md:py-2 bg-primary/20 border border-primary/30 rounded-md md:rounded-lg text-primary hover:bg-primary/30 transition-all duration-200 text-xs md:text-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Save Prompt
                            </motion.button>
                            <motion.button 
                              className="glass-button px-3 py-1.5 md:px-4 md:py-2 bg-secondary/20 border border-secondary/30 rounded-md md:rounded-lg text-secondary hover:bg-secondary/30 transition-all duration-200 text-xs md:text-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Make Public
                            </motion.button>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2 text-zinc-500">
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
                        className="glass-panel bg-gray-900/30 backdrop-blur-xl border border-gray-800/30 rounded-xl md:rounded-2xl p-4 md:p-6"
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-3">
                          <h3 className="text-base md:text-lg font-semibold text-white">Visibility Settings</h3>
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
                                className={`flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-md md:rounded-lg transition-all duration-200 text-xs md:text-sm ${
                                  option.active 
                                    ? 'bg-primary/30 border border-primary/50 text-primary' 
                                    : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white'
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
                        className="glass-panel bg-gray-900/30 backdrop-blur-xl border border-gray-800/30 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-primary/50 transition-all duration-300 group cursor-pointer"
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        whileHover={{ scale: 1.02, y: -5 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3 md:mb-4">
                            <div className="flex items-center gap-2 md:gap-3">
                              <motion.div 
                                className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base"
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                              >
                                A
                              </motion.div>
                              <div>
                                <h4 className="text-white font-medium text-sm md:text-base">Alex Chen</h4>
                                <p className="text-zinc-500 text-xs md:text-sm">2 hours ago</p>
                              </div>
                            </div>
                            <motion.div
                              whileHover={{ rotate: 15, scale: 1.1 }}
                            >
                              <Share2 size={16} className="md:w-5 md:h-5 text-zinc-400 group-hover:text-primary transition-colors duration-300" />
                            </motion.div>
                          </div>
                          
                          <h3 className="text-base md:text-lg font-semibold text-white mb-2">Complete SaaS Landing Page Flow</h3>
                          <p className="text-zinc-400 text-xs md:text-sm mb-3 md:mb-4">A comprehensive prompt flow for building modern SaaS landing pages with conversion optimization...</p>
                          
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-zinc-500">
                            <motion.div 
                              className="flex items-center gap-1"
                              whileHover={{ scale: 1.1 }}
                            >
                              <Eye size={10} className="md:w-3 md:h-3" />
                              <span>1.2k views</span>
                            </motion.div>
                            <motion.div 
                              className="flex items-center gap-1"
                              whileHover={{ scale: 1.1 }}
                            >
                              <span>❤️ 89 likes</span>
                            </motion.div>
                            <motion.div 
                              className="flex items-center gap-1"
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
                          strokeWidth="2"
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
                            className="glass-panel bg-gray-900/30 backdrop-blur-xl border border-gray-800/30 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-primary/50 transition-all duration-500 group cursor-pointer preserve-3d"
                            whileHover={{ 
                              scale: 1.05,
                              rotateY: 5,
                              z: 50
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ 
                              background: `linear-gradient(to bottom right, ${node.color}10, ${node.color}10)` 
                            }} />
                            
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                                <motion.div
                                  className="p-2 rounded-lg"
                                  style={{ 
                                    backgroundColor: `${node.color}20`,
                                    color: node.color
                                  }}
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.6 }}
                                >
                                  {node.icon}
                                </motion.div>
                                <h3 className="text-base md:text-lg font-semibold text-white">{node.title}</h3>
                              </div>
                              <p className="text-zinc-400 text-xs md:text-sm mb-3 md:mb-4">{node.desc}</p>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-500">3 prompts</span>
                                <motion.div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: node.color }}
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
                            { name: "Content ideas", color: "emerald" },
                            { name: "Content script", color: "emerald" },
                            { name: "Generate Caption", color: "indigo" },
                          ],
                        },
                        {
                          title: "Audience Engagement",
                          items: [
                            { name: "CTA for audience reply", color: "zinc" },
                          ],
                        },
                        {
                          title: "Sponsored Endorsement Draft",
                          items: [
                            { name: "Brand brief", color: "indigo" },
                            { name: "Soft-selling story", color: "zinc" },
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
                            <h3 className="text-base md:text-lg font-semibold text-white">{column.title}</h3>
                            <motion.span 
                              className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full"
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
                                className="glass-panel bg-gray-900/30 backdrop-blur-xl border border-gray-800/30 rounded-lg md:rounded-xl p-3 md:p-4 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                                whileHover={{ scale: 1.02, y: -2 }}
                              >
                                <div className="flex items-center justify-between">
                                <span className="text-white text-xs md:text-sm font-medium">{item.name}</span>
                                <motion.div 
                                  className={`w-2 h-2 rounded-full ${
                                    item.color === 'emerald' ? 'bg-primary' :
                                    item.color === 'indigo' ? 'bg-secondary' :
                                    'bg-highlight'
                                  }`}
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
                    <div className="glass-panel bg-gray-900/30 backdrop-blur-xl border border-gray-800/30 rounded-2xl p-4 md:p-6 lg:p-8">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl md:rounded-2xl" />
                      
                      <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-3">
                          <h3 className="text-xl md:text-2xl font-bold text-white">Team Members</h3>
                          <motion.button 
                            className="glass-button px-3 py-2 md:px-4 md:py-2 bg-primary/20 border border-primary/30 rounded-md md:rounded-lg text-primary hover:bg-primary/30 transition-all duration-200 flex items-center gap-2 text-sm md:text-base self-start sm:self-auto"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Plus size={14} className="md:w-4 md:h-4" />
                            Invite Member
                          </motion.button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                          {[
                            { name: "Alex Chen", role: "Product Designer", avatar: "A", status: "online" },
                            { name: "Sarah Kim", role: "Frontend Dev", avatar: "S", status: "online" },
                            { name: "Mike Johnson", role: "Backend Dev", avatar: "M", status: "away" }
                          ].map((member, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: index * 0.1 }}
                              className="glass-panel bg-zinc-800/30 backdrop-blur-xl border border-zinc-700/30 rounded-lg md:rounded-xl p-3 md:p-4 hover:border-indigo-500/50 transition-all duration-300 group"
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="relative">
                                  <motion.div 
                                    className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base"
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.6 }}
                                  >
                                    {member.avatar}
                                  </motion.div>
                                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-gray-800 ${
                                    member.status === 'online' ? 'bg-primary' : 'bg-highlight'
                                  }`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-white font-medium text-sm md:text-base truncate">{member.name}</h4>
                                  <p className="text-zinc-400 text-xs md:text-sm truncate">{member.role}</p>
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
                    <div className="glass-panel bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12 shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl md:rounded-3xl" />
                      <div className="absolute inset-0 rounded-2xl md:rounded-3xl ring-1 ring-inset ring-white/20" />
                      
                      <div className="relative z-10 space-y-6 md:space-y-8">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-secondary rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6"
                        >
                          <CheckCircle size={32} className="md:w-10 md:h-10 text-white" />
                        </motion.div>
                        
                        <motion.h2 
                          className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                        >
                          Ready to Build
                        </motion.h2>
                        
                        <motion.p 
                          className="text-base md:text-lg lg:text-xl text-zinc-300 mb-6 md:mb-8 px-2"
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
                            className="group relative px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-primary to-secondary rounded-xl md:rounded-2xl text-white font-semibold text-base md:text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/25"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                            <span className="relative flex items-center justify-center gap-2">
                              Start Building
                              <ArrowRight size={16} className="md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                            </span>
                          </motion.button>
                          
                          <motion.button 
                            className="group relative px-6 py-3 md:px-8 md:py-4 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl md:rounded-2xl text-white font-semibold text-base md:text-lg transition-all duration-300 hover:bg-white/10"
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
                  index === activeStep ? 'bg-primary w-4 md:w-8' : 'bg-zinc-600'
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