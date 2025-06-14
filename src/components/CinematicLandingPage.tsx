import React, { useEffect, useState, useRef } from 'react'
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
  MousePointer2
} from 'lucide-react'

export const CinematicLandingPage: React.FC = () => {
  const [scrollY, setScrollY] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [currentSection, setCurrentSection] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const fullPromptText = "Create a landing page for a SaaS product with modern design, responsive layout, and conversion-focused sections..."
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      
      // Determine current section based on scroll position
      const sections = document.querySelectorAll('[data-section]')
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect()
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
          setCurrentSection(index)
        }
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Typewriter effect for prompt typing section
  useEffect(() => {
    if (currentSection >= 1) {
      let index = 0
      const timer = setInterval(() => {
        if (index <= fullPromptText.length) {
          setTypedText(fullPromptText.slice(0, index))
          index++
        } else {
          clearInterval(timer)
        }
      }, 30)
      return () => clearInterval(timer)
    }
  }, [currentSection])

  const getParallaxOffset = (speed: number) => scrollY * speed

  return (
    <div ref={containerRef} className="relative">
      {/* Hero Section */}
      <section 
        data-section="0"
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          transform: `translateY(${getParallaxOffset(0.1)}px)`,
        }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]" />
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at ${50 + Math.sin(scrollY * 0.001) * 10}% ${50 + Math.cos(scrollY * 0.001) * 10}%, rgba(139,92,246,0.1), transparent 70%)`,
            }}
          />
        </div>

        {/* Hero content with glass effect */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <div className="glass-panel bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl" />
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20" />
            
            <div className="relative z-10">
              <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Design before
                <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  you prompt
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-zinc-300 mb-8 leading-relaxed">
                Map your next build with structured, reusable prompts.
              </p>
              
              <button className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <span className="relative flex items-center gap-2">
                  Enter Playground
                  <Play size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-xl animate-pulse delay-1000" />
      </section>

      {/* Prompt Typing Section */}
      <section 
        data-section="1"
        className="min-h-screen flex items-center justify-center py-20 relative"
        style={{
          transform: `translateY(${getParallaxOffset(0.05)}px)`,
        }}
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Start with a single prompt
            </h2>
            <p className="text-xl text-zinc-400">
              Watch your ideas take shape as you type
            </p>
          </div>

          {/* Floating prompt card with glass effect */}
          <div className="relative">
            <div 
              className="glass-panel bg-zinc-900/40 backdrop-blur-2xl border border-zinc-700/50 rounded-2xl p-8 shadow-2xl transform hover:scale-[1.02] transition-all duration-500"
              style={{
                transform: `translateY(${Math.sin(scrollY * 0.002) * 10}px)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl" />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
              
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
                    <span className="animate-pulse">|</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-3">
                    <button className="glass-button px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-300 hover:bg-indigo-600/30 transition-all duration-200">
                      Save Prompt
                    </button>
                    <button className="glass-button px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 rounded-lg text-emerald-300 hover:bg-emerald-600/30 transition-all duration-200">
                      Make Public
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <EyeOff size={16} />
                    <span className="text-sm">Private</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prompt Flow Structure */}
      <section 
        data-section="2"
        className="min-h-screen flex items-center justify-center py-20 relative"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Build structured flows
            </h2>
            <p className="text-xl text-zinc-400">
              Connect prompts into powerful workflows
            </p>
          </div>

          {/* Flow visualization */}
          <div className="relative">
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <path
                d="M 200 100 Q 300 50 400 100 Q 500 150 600 100"
                stroke="url(#flowGradient)"
                strokeWidth="2"
                fill="none"
                className="animate-pulse"
              />
            </svg>

            {/* Flow nodes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {[
                { title: "Landing Page", desc: "Hero, features, pricing", icon: <Zap size={24} />, delay: 0 },
                { title: "Authentication", desc: "Login, signup, verification", icon: <Users size={24} />, delay: 200 },
                { title: "Database Schema", desc: "Tables, relations, indexes", icon: <GitBranch size={24} />, delay: 400 }
              ].map((node, index) => (
                <div
                  key={index}
                  className="glass-panel bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-500 group cursor-pointer"
                  style={{
                    animationDelay: `${node.delay}ms`,
                    transform: `translateY(${Math.sin((scrollY + index * 100) * 0.001) * 5}px)`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-indigo-500/30 transition-all duration-300" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                        {node.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-white">{node.title}</h3>
                    </div>
                    <p className="text-zinc-400 text-sm">{node.desc}</p>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-zinc-500">3 prompts</span>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Kanban Flow */}
      <section 
        data-section="3"
        className="min-h-screen flex items-center justify-center py-20 relative"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Track your progress
            </h2>
            <p className="text-xl text-zinc-400">
              Move prompts through your workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Backlog", items: ["API Design", "Error Handling"], color: "zinc" },
              { title: "In Progress", items: ["User Dashboard"], color: "indigo" },
              { title: "Done", items: ["Landing Page", "Auth Flow"], color: "emerald" }
            ].map((column, columnIndex) => (
              <div key={columnIndex} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-white">{column.title}</h3>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">
                    {column.items.length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {column.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`glass-panel bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/50 rounded-xl p-4 hover:border-${column.color}-500/50 transition-all duration-300 cursor-pointer group`}
                      style={{
                        transform: `translateY(${Math.sin((scrollY + itemIndex * 50) * 0.002) * 3}px)`,
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br from-${column.color}-500/5 to-${column.color}-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{item}</span>
                          {column.title === "In Progress" && (
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                          )}
                          {column.title === "Done" && (
                            <CheckCircle size={16} className="text-emerald-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Clock size={12} />
                          <span>2 hours ago</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Collaboration */}
      <section 
        data-section="4"
        className="min-h-screen flex items-center justify-center py-20 relative"
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Collaborate with your team
            </h2>
            <p className="text-xl text-zinc-400">
              Invite teammates and build together
            </p>
          </div>

          <div className="relative">
            {/* Invite button simulation */}
            <div className="glass-panel bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-8 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Project: E-commerce Platform</h3>
                  <p className="text-zinc-400">Building a complete online store with AI</p>
                </div>
                <button className="glass-button px-6 py-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-300 hover:bg-indigo-600/30 transition-all duration-200 flex items-center gap-2">
                  <Plus size={16} />
                  Invite Team
                </button>
              </div>
            </div>

            {/* Team avatars with glass effect */}
            <div className="flex items-center justify-center gap-4">
              {[1, 2, 3, 4].map((_, index) => (
                <div
                  key={index}
                  className="relative"
                  style={{
                    animationDelay: `${index * 200}ms`,
                    transform: `translateY(${Math.sin((scrollY + index * 100) * 0.003) * 5}px)`,
                  }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg glass-panel border border-white/20">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-zinc-900" />
                </div>
              ))}
              
              {/* Chat bubbles */}
              <div className="ml-8 space-y-2">
                <div className="glass-panel bg-indigo-600/20 border border-indigo-500/30 rounded-2xl rounded-bl-sm px-4 py-2 max-w-xs">
                  <p className="text-indigo-200 text-sm">Looking good! 👍</p>
                </div>
                <div className="glass-panel bg-purple-600/20 border border-purple-500/30 rounded-2xl rounded-bl-sm px-4 py-2 max-w-xs">
                  <p className="text-purple-200 text-sm">Added payment flow</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sharing Section */}
      <section 
        data-section="5"
        className="min-h-screen flex items-center justify-center py-20 relative"
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Share your work
            </h2>
            <p className="text-xl text-zinc-400">
              Make your prompts discoverable by the community
            </p>
          </div>

          <div className="space-y-8">
            {/* Visibility toggle */}
            <div className="glass-panel bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Visibility Settings</h3>
                <div className="flex items-center gap-4">
                  {[
                    { label: "Private", icon: <EyeOff size={16} />, active: false },
                    { label: "Link-only", icon: <Link size={16} />, active: true },
                    { label: "Public", icon: <Globe size={16} />, active: false }
                  ].map((option, index) => (
                    <button
                      key={index}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        option.active 
                          ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300' 
                          : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {option.icon}
                      <span className="text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Public preview */}
            <div className="glass-panel bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      A
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Alex Chen</h4>
                      <p className="text-zinc-500 text-sm">2 hours ago</p>
                    </div>
                  </div>
                  <Share2 size={20} className="text-zinc-400 group-hover:text-indigo-400 transition-colors duration-300" />
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-2">Complete SaaS Landing Page Flow</h3>
                <p className="text-zinc-400 text-sm mb-4">A comprehensive prompt flow for building modern SaaS landing pages with conversion optimization...</p>
                
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Eye size={12} />
                    <span>1.2k views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>❤️ 89 likes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GitBranch size={12} />
                    <span>23 forks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Map Snapshot */}
      <section 
        data-section="6"
        className="min-h-screen flex items-center justify-center py-20 relative"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              See the bigger picture
            </h2>
            <p className="text-xl text-zinc-400">
              Your complete project mapped out and ready to build
            </p>
          </div>

          {/* Zoomed out project view */}
          <div className="relative">
            <div className="glass-panel bg-zinc-900/20 backdrop-blur-3xl border border-zinc-700/30 rounded-3xl p-8 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl" />
              
              {/* Layered glass panels for depth */}
              <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-80">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div
                    key={index}
                    className="glass-panel bg-zinc-800/30 backdrop-blur-xl border border-zinc-600/30 rounded-xl p-3 h-20"
                    style={{
                      transform: `translateY(${Math.sin((scrollY + index * 50) * 0.001) * 2}px) scale(${0.8 + Math.sin(index) * 0.1})`,
                      opacity: 0.6 + Math.sin(index) * 0.2,
                    }}
                  >
                    <div className="w-full h-2 bg-gradient-to-r from-indigo-500/50 to-purple-500/50 rounded-full mb-2" />
                    <div className="w-3/4 h-1 bg-zinc-600/50 rounded-full mb-1" />
                    <div className="w-1/2 h-1 bg-zinc-600/50 rounded-full" />
                  </div>
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
                    <line
                      key={index}
                      x1={`${20 + index * 10}%`}
                      y1={`${30 + index * 5}%`}
                      x2={`${40 + index * 8}%`}
                      y2={`${60 + index * 3}%`}
                      stroke="url(#connectionGradient)"
                      strokeWidth="1"
                      className="animate-pulse"
                      style={{ animationDelay: `${index * 200}ms` }}
                    />
                  ))}
                </svg>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center mt-16">
              <button className="group relative px-12 py-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl text-white font-bold text-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                <span className="relative flex items-center gap-3">
                  Start Building Smarter
                  <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </button>
              
              <p className="text-zinc-500 text-sm mt-4">
                Join thousands of builders already using structured prompts
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}