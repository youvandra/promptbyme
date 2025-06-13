import React, { useState, useRef, useEffect } from 'react'
import { Send, Lock, Unlock, Eye, EyeOff } from 'lucide-react'

interface TerminalInputProps {
  onSubmit: (title: string, content: string, access: 'public' | 'private') => void
  loading?: boolean
}

export const TerminalInput: React.FC<TerminalInputProps> = ({ onSubmit, loading = false }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [access, setAccess] = useState<'public' | 'private'>('private')
  const [showCursor, setShowCursor] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    
    onSubmit(title.trim(), content.trim(), access)
    setTitle('')
    setContent('')
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [content])

  return (
    <div className="w-full max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Prompt title (optional)"
            className="w-full bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg px-4 py-3 text-cyan-100 placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 font-mono"
          />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content Textarea */}
        <div className="relative group">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your AI prompt here... Supports **bold**, *italic*, and ```code blocks```"
            className="w-full min-h-[120px] bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg px-4 py-3 text-cyan-100 placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 font-mono resize-none"
            style={{ 
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)',
            }}
          />
          {showCursor && content === '' && (
            <div className="absolute top-3 left-4 w-0.5 h-6 bg-cyan-400 animate-pulse" />
          )}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Access Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAccess(access === 'private' ? 'public' : 'private')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 font-mono text-sm ${
                access === 'private'
                  ? 'bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30'
                  : 'bg-green-500/20 border-green-500/50 text-green-300 hover:bg-green-500/30'
              }`}
            >
              {access === 'private' ? (
                <>
                  <Lock size={16} />
                  <span>Private</span>
                </>
              ) : (
                <>
                  <Unlock size={16} />
                  <span>Public</span>
                </>
              )}
            </button>
            <span className="text-cyan-500/70 text-sm font-mono">
              {access === 'private' ? 'Only you can see this' : 'Anyone can view via link'}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!content.trim() || loading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-mono font-bold rounded-lg hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95"
            style={{
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
            }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Save Prompt</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}