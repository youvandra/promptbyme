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
  const [mounted, setMounted] = useState(false)
  
  // Safe scroll hook with fallback
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Smooth spring-based scroll progress with safe fallback
  const smoothProgress = useSpring(scrollYProgress || 0, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Safe transform with fallback values
  const currentStep = useTransform(smoothProgress, [0, 1], [0, 6])
  const [activeStep, setActiveStep] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Mount guard
  useEffect(() => {
    setMounted(true)
  }, [])

  // Safe scroll progress tracking
  useEffect(() => {
    if (!mounted) return
    
    const unsubscribe = currentStep.on('change', (latest) => {
      if (typeof latest === 'number' && !isNaN(latest)) {
        setActiveStep(Math.floor(latest))
        setScrollProgress(latest % 1)
      }
    })
    return unsubscribe
  }, [currentStep, mounted])

  // Typewriter effect state
  const [typedText, setTypedText] = useState('')
  const fullPromptText = "Create a landing page for a SaaS product with modern design, responsive layout, and conversion-focused sections including hero, features, pricing, testimonials, and CTA..."

  // Safe typewriter effect
  useEffect(() => {
    if (!mounted || activeStep < 1) {
      setTypedText('')
      return
    }

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
  }, [activeStep, mounted])

  // Safe scroll to next section
  const scrollToNext = () => {
    if (containerRef.current && mounted) {
      const nextPosition = window.innerHeight * (activeStep + 1)
      window.scrollTo({
        top: nextPosition,
        behavior: 'smooth'
      })
    }
  }

  // Safe header opacity with fallback
  const headerOpacity = mounted ? useTransform(smoothProgress, [0, 0.15], [1, 0]) : 1

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
      title: "Build structured flows",
      subtitle: "Connect prompts into powerful workflows",
      content: "flow"
    },
    {
      title: "Track your progress",
      subtitle: "Move prompts through your workflow",
      content: "kanban"
    },
    {
      title: "Collaborate with your team",
      subtitle: "Invite teammates and build together",
      content: "team"
    },
    {
      title: "Share your work",
      subtitle: "Make your prompts discoverable by the community",
      content: "sharing"
    },
    {
      title: "See the bigger picture",
      subtitle: "Your complete project mapped out and ready to build",
      content: "final"
    }
  ]

  const currentConfig = stepConfigs[activeStep] || stepConfigs[0]

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative" style={{ height: '700vh' }}>
      {/* Pinned container */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Enhanced animated background for ultrawide support */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950"
          animate={{
            background: activeStep >= 3 ? 
              "radial-gradient(ellipse at 30% 70%, rgba(139,92,246,0.15), transparent 70%)" :
              "radial-gradient(ellipse at 70% 30%, rgba(99,102,241,0.15), transparent 70%)"
          }}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
          {/* Ultrawide background elements */}
          <motion.div 
            className="absolute inset-0"
            animate={{
              background: `
                radial-gradient(circle at ${50 + Math.sin(activeStep) * 20}% ${50 + Math.cos(activeStep) * 20}%, rgba(139,92,246,0.1), transparent 70%),
                linear-gradient(135deg, rgba(99,102,241,0.05) 0%, transparent 50%, rgba(139,92,246,0.05) 100%)
              `
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Abstract shapes for ultrawide screens */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-96 h-96 rounded-full opacity-5"
                style={{
                  background: `radial-gradient(circle, ${i % 2 === 0 ? 'rgba(99,102,241,0.3)' : 'rgba(139,92,246,0.3)'}, transparent 70%)`,
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
          className="absolute top-0 left-0 right-0 z-50 p-6 lg:p-8"
          style={{ opacity: headerOpacity }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-3 glass-panel bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 0.9, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              whileHover={{ opacity: 1, scale: 1.05 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="text-white" size={16} />
              </div>
              <h1 className="text-lg font-semibold text-white">
                promptby.me
              </h1>
            </motion.div>
            
            {/* Sign In Button - with proper padding from edge */}
            <motion.button
              onClick={onSignInClick}
              className="glass-button bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 text-white font-medium px-6 py-2 rounded-2xl transition-all duration-300 hover:bg-white/10 mr-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 0.9, x: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              whileHover={{ opacity: 1, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign in
            </motion.button>
          </div>
        </motion.div>

        {/* Main content area - optimized for ultrawide */}
        <div className="relative z-10 h-full flex items-center justify-center px-6 lg:px-12">
          <div className="max-w-7xl mx-auto w-full">
            
            {/* Header section - with smooth transitions */}
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1 
                className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight"
                key={currentConfig.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {activeStep === 0 ? (
                  <>
                    Design before
                    <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      you prompt
                    </span>
                  </>
                ) : (
                  currentConfig.title
                )}
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl lg:text-3xl text-zinc-300 leading-relaxed max-w-4xl mx-auto"
                key={currentConfig.subtitle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              >
                {currentConfig.subtitle}
              </motion.p>
            </motion.div>

            {/* Dynamic content area */}
            <div className="relative min-h-[400px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                
                {/* Step 0: Hero CTA */}
                {activeStep === 0 && (
                  <motion.div
                    key="hero"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center"
                  >
                    <div className="glass-panel bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl max-w-2xl mx-auto">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl" />
                      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20" />
                      
                      <div className="relative z-10 space-y-8">
                        <motion.button 
                          onClick={scrollToNext}
                          className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                          <span className="relative flex items-center gap-2">
                            Enter Playground
                            <Play size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
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
                            className="text-sm hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                            whileHover={{ y: -2 }}
                          >
                            <span>Scroll to explore</span>
                            <motion.div
                              animate={{ y: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <ChevronDown size={16} className="group-hover:text-indigo-400 transition-colors duration-300" />
                            </motion.div>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Prompt Typing */}
                {activeStep === 1 && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      scale: 1 + scrollProgress * 0.05
                    }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-5xl"
                  >
                    <motion.div 
                      className="glass-panel bg-zinc-900/40 backdrop-blur-2xl border border-zinc-700/50 rounded-2xl p-8 shadow-2xl"
                      animate={{ 
                        y: [0, -10, 0],
                        rotateX: [0, 2, 0]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-3 h-3 bg-red-500 rounded-full" />
                          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          <span className="text-zinc-500 text-sm ml-4">New Prompt</span>
                        </div>
                        
                        <div className="bg-zinc-800/50 rounded-xl p-6 min-h-[200px] relative">
                          <div className="text-zinc-300 text-lg leading-relaxed">
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
                        
                        <div className="flex items-center justify-between mt-6">
                          <div className="flex items-center gap-3">
                            <motion.button 
                              className="glass-button px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-300 hover:bg-indigo-600/30 transition-all duration-200"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Save Prompt
                            </motion.button>
                            <motion.button 
                              className="glass-button px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 rounded-lg text-emerald-300 hover:bg-emerald-600/30 transition-all duration-200"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Make Public
                            </motion.button>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-500">
                            <EyeOff size={16} />
                            <span className="text-sm">Private</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Step 2: Flow Structure */}
                {activeStep === 2 && (
                  <motion.div
                    key="flow"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      rotateY: scrollProgress * 5
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-6xl"
                  >
                    <div className="relative perspective-1000">
                      {/* Animated connection lines */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                        <defs>
                          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0.6" />
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                        {[
                          { title: "Landing Page", desc: "Hero, features, pricing", icon: <Zap size={24} />, color: "indigo" },
                          { title: "Authentication", desc: "Login, signup, verification", icon: <Users size={24} />, color: "purple" },
                          { title: "Database Schema", desc: "Tables, relations, indexes", icon: <GitBranch size={24} />, color: "pink" }
                        ].map((node, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              rotateX: scrollProgress * 10 - 5
                            }}
                            transition={{ duration: 0.6, delay: index * 0.2, ease: "easeOut" }}
                            className="glass-panel bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-500 group cursor-pointer preserve-3d"
                            whileHover={{ 
                              scale: 1.05,
                              rotateY: 5,
                              z: 50
                            }}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br from-${node.color}-500/5 to-${node.color}-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                            
                            <div className="relative z-10">
                              <div className="flex items-center gap-3 mb-4">
                                <motion.div 
                                  className={`p-2 bg-${node.color}-500/20 rounded-lg text-${node.color}-400`}
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.6 }}
                                >
                                  {node.icon}
                                </motion.div>
                                <h3 className="text-lg font-semibold text-white">{node.title}</h3>
                              </div>
                              <p className="text-zinc-400 text-sm">{node.desc}</p>
                              
                              <div className="mt-4 flex items-center justify-between">
                                <span className="text-xs text-zinc-500">3 prompts</span>
                                <motion.div 
                                  className="w-2 h-2 bg-emerald-400 rounded-full"
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

                {/* Step 3: Kanban Board */}
                {activeStep === 3 && (
                  <motion.div
                    key="kanban"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      scale: 1 + scrollProgress * 0.02
                    }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-6xl"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { title: "Backlog", items: ["API Design", "Error Handling"], color: "zinc" },
                        { title: "In Progress", items: ["User Dashboard"], color: "indigo" },
                        { title: "Done", items: ["Landing Page", "Auth Flow"], color: "emerald" }
                      ].map((column, columnIndex) => (
                        <motion.div 
                          key={columnIndex} 
                          className="space-y-4"
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0,
                            x: scrollProgress * (columnIndex - 1) * 10
                          }}
                          transition={{ duration: 0.6, delay: columnIndex * 0.2, ease: "easeOut" }}
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-lg font-semibold text-white">{column.title}</h3>
                            <motion.span 
                              className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3, delay: columnIndex * 0.2 + 0.3 }}
                            >
                              {column.items.length}
                            </motion.span>
                          </div>
                          
                          <div className="space-y-3">
                            {column.items.map((item, itemIndex) => (
                              <motion.div
                                key={itemIndex}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: columnIndex * 0.2 + itemIndex * 0.1, ease: "easeOut" }}
                                className="glass-panel bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/50 rounded-xl p-4 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer group"
                                whileHover={{ scale: 1.02, y: -2 }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                              >
                                <div className="relative z-10">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-white font-medium">{item}</span>
                                    {column.title === "In Progress" && (
                                      <motion.div 
                                        className="w-2 h-2 bg-indigo-400 rounded-full"
                                        animate={{ scale: [1, 1.5, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                      />
                                    )}
                                    {column.title === "Done" && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.3, delay: 0.5 }}
                                      >
                                        <CheckCircle size={16} className="text-emerald-400" />
                                      </motion.div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <Clock size={12} />
                                    <span>2 hours ago</span>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Team Collaboration */}
                {activeStep === 4 && (
                  <motion.div
                    key="team"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      y: scrollProgress * -20
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-4xl"
                  >
                    <div className="space-y-8">
                      {/* Project header */}
                      <motion.div 
                        className="glass-panel bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-8"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-2">Project: E-commerce Platform</h3>
                            <p className="text-zinc-400">Building a complete online store with AI</p>
                          </div>
                          <motion.button 
                            className="glass-button px-6 py-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-300 hover:bg-indigo-600/30 transition-all duration-200 flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Plus size={16} />
                            Invite Team
                          </motion.button>
                        </div>
                      </motion.div>

                      {/* Team avatars and chat */}
                      <div className="flex items-center justify-center gap-8">
                        <div className="flex items-center gap-4">
                          {[1, 2, 3, 4].map((_, index) => (
                            <motion.div
                              key={index}
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ 
                                scale: 1, 
                                rotate: 0,
                                y: Math.sin(scrollProgress * Math.PI + index) * 5
                              }}
                              transition={{ 
                                duration: 0.6, 
                                delay: index * 0.1,
                                type: "spring",
                                stiffness: 200
                              }}
                              className="relative"
                            >
                              <motion.div 
                                className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg glass-panel border border-white/20"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                              >
                                {String.fromCharCode(65 + index)}
                              </motion.div>
                              <motion.div 
                                className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-zinc-900"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 + 0.3 }}
                              />
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* Chat bubbles */}
                        <div className="space-y-2">
                          <motion.div 
                            className="glass-panel bg-indigo-600/20 border border-indigo-500/30 rounded-2xl rounded-bl-sm px-4 py-2 max-w-xs"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
                          >
                            <p className="text-indigo-200 text-sm">Looking good! 👍</p>
                          </motion.div>
                          <motion.div 
                            className="glass-panel bg-purple-600/20 border border-purple-500/30 rounded-2xl rounded-bl-sm px-4 py-2 max-w-xs"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 1.2, ease: "easeOut" }}
                          >
                            <p className="text-purple-200 text-sm">Added payment flow</p>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Sharing */}
                {activeStep === 5 && (
                  <motion.div
                    key="sharing"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      rotateX: scrollProgress * 5
                    }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-4xl"
                  >
                    <div className="space-y-8">
                      {/* Visibility toggle */}
                      <motion.div 
                        className="glass-panel bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white">Visibility Settings</h3>
                          <div className="flex items-center gap-4">
                            {[
                              { label: "Private", icon: <EyeOff size={16} />, active: false },
                              { label: "Link-only", icon: <Link size={16} />, active: true },
                              { label: "Public", icon: <Globe size={16} />, active: false }
                            ].map((option, index) => (
                              <motion.button
                                key={index}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                                  option.active 
                                    ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300' 
                                    : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {option.icon}
                                <span className="text-sm">{option.label}</span>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </motion.div>

                      {/* Public preview */}
                      <motion.div 
                        className="glass-panel bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 group cursor-pointer"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                        whileHover={{ scale: 1.02, y: -5 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <motion.div 
                                className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold"
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                              >
                                A
                              </motion.div>
                              <div>
                                <h4 className="text-white font-medium">Alex Chen</h4>
                                <p className="text-zinc-500 text-sm">2 hours ago</p>
                              </div>
                            </div>
                            <motion.div
                              whileHover={{ rotate: 15, scale: 1.1 }}
                            >
                              <Share2 size={20} className="text-zinc-400 group-hover:text-indigo-400 transition-colors duration-300" />
                            </motion.div>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-white mb-2">Complete SaaS Landing Page Flow</h3>
                          <p className="text-zinc-400 text-sm mb-4">A comprehensive prompt flow for building modern SaaS landing pages with conversion optimization...</p>
                          
                          <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <motion.div 
                              className="flex items-center gap-1"
                              whileHover={{ scale: 1.1 }}
                            >
                              <Eye size={12} />
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
                              <GitBranch size={12} />
                              <span>23 forks</span>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* Step 6: Final Map */}
                {activeStep === 6 && (
                  <motion.div
                    key="final"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      rotateY: scrollProgress * 10
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-6xl"
                  >
                    <div className="space-y-16">
                      {/* Project overview */}
                      <motion.div 
                        className="glass-panel bg-zinc-900/20 backdrop-blur-3xl border border-zinc-700/30 rounded-3xl p-8 overflow-hidden"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl" />
                        
                        {/* Layered glass panels for depth */}
                        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-80">
                          {Array.from({ length: 12 }).map((_, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                              animate={{ 
                                opacity: 0.6 + Math.sin(index) * 0.2, 
                                scale: 0.8 + Math.sin(index) * 0.1, 
                                rotate: 0,
                                y: Math.sin(scrollProgress * Math.PI + index) * 5
                              }}
                              transition={{ duration: 0.6, delay: index * 0.05, ease: "easeOut" }}
                              className="glass-panel bg-zinc-800/30 backdrop-blur-xl border border-zinc-600/30 rounded-xl p-3 h-20"
                              whileHover={{ scale: 1.05, opacity: 1 }}
                            >
                              <motion.div 
                                className="w-full h-2 bg-gradient-to-r from-indigo-500/50 to-purple-500/50 rounded-full mb-2"
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                              />
                              <div className="w-3/4 h-1 bg-zinc-600/50 rounded-full mb-1" />
                              <div className="w-1/2 h-1 bg-zinc-600/50 rounded-full" />
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* Connection lines overlay */}
                        <div className="absolute inset-0 opacity-30">
                          <svg className="w-full h-full">
                            <defs>
                              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0.3" />
                              </linearGradient>
                            </defs>
                            {Array.from({ length: 8 }).map((_, index) => (
                              <motion.line
                                key={index}
                                x1={`${20 + index * 10}%`}
                                y1={`${30 + index * 5}%`}
                                x2={`${40 + index * 8}%`}
                                y2={`${60 + index * 3}%`}
                                stroke="url(#connectionGradient)"
                                strokeWidth="1"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2, delay: index * 0.2 }}
                              />
                            ))}
                          </svg>
                        </div>
                      </motion.div>

                      {/* Final CTA */}
                      <motion.div 
                        className="text-center"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                      >
                        <motion.button 
                          onClick={onSignInClick}
                          className="group relative px-12 py-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl text-white font-bold text-xl transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/25"
                          whileHover={{ 
                            scale: 1.05,
                            boxShadow: "0 20px 40px rgba(139, 92, 246, 0.4)"
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                          <span className="relative flex items-center gap-3">
                            Start Building Smarter
                            <motion.div
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <ArrowRight size={24} />
                            </motion.div>
                          </span>
                        </motion.button>
                        
                        <motion.p 
                          className="text-zinc-500 text-sm mt-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.6, delay: 0.8 }}
                        >
                          Join thousands of builders already using structured prompts
                        </motion.p>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Progress indicator */}
            <motion.div 
              className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <div className="flex items-center gap-2 glass-panel bg-zinc-900/50 backdrop-blur-xl border border-zinc-700/50 rounded-full px-4 py-2">
                {Array.from({ length: 7 }).map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      index === activeStep ? 'bg-indigo-400' : 'bg-zinc-600'
                    }`}
                    animate={{
                      scale: index === activeStep ? 1.5 : 1,
                      opacity: index === activeStep ? 1 : 0.5
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  )
}