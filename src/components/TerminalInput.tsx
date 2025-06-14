import React, { useState, useRef, useEffect } from 'react'
import { Send, Lock, Unlock } from 'lucide-react'

interface TerminalInputProps {
  onSubmit: (title: string, content: string, access: 'public' | 'private') => void
  loading?: boolean
}

export const TerminalInput: React.FC<TerminalInputProps> = ({ onSubmit, loading = false }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [access, setAccess] = useState<'public' | 'private'>('private')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Prompt title (optional)"
            className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
          />
        </div>

        {/* Content Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start prompting... (Supports **bold**, *italic*, and ```code blocks```)"
            className="w-full min-h-[120px] bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Access Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAccess(access === 'private' ? 'public' : 'private')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 text-sm font-medium ${
                access === 'private'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
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
            <span className="text-zinc-500 text-sm">
              {access === 'private' ? 'Only you can see this' : 'Anyone can view via link'}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!content.trim() || loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none disabled:cursor-not-allowed btn-hover"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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