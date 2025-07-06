import React, { useState } from 'react'
import { X, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signIn, signUp } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        await signIn(email, password)
        onClose()
      } else {
        await signUp(email, password)
        setSuccess('Account created successfully!')
        setTimeout(() => {
          onClose()
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleModeSwitch = () => {
    setIsLogin(!isLogin)
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-f3f3f3 border-2 border-black rounded-[28px] p-8 w-full max-w-md shadow-neo-brutalism">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-black transition-colors p-1"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-black mb-2">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-gray-600 text-sm">
            {isLogin ? 'Sign in to your account' : 'Join the prompt community'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full bg-white border-2 border-black rounded-[28px] pl-10 pr-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200 shadow-neo-brutalism-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full bg-white border-2 border-black rounded-[28px] pl-10 pr-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200 shadow-neo-brutalism-sm"
            />
          </div>

          {error && (
            <div className="flex items-start gap-3 text-red-600 text-sm bg-red-100 border-2 border-black rounded-xl p-3 shadow-neo-brutalism-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 text-emerald-600 text-sm bg-emerald-100 border-2 border-black rounded-xl p-3 shadow-neo-brutalism-sm">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-highlight hover:bg-highlight disabled:bg-gray-300 disabled:text-gray-500 text-black font-bold py-3 rounded-[28px] border-2 border-black shadow-neo-brutalism transition-all duration-200 disabled:transform-none disabled:cursor-not-allowed neo-brutalism"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
              </div>
            ) : (
              <span>{isLogin ? 'Sign in' : 'Create account'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleModeSwitch}
            className="text-black font-bold text-sm transition-colors underline"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        {!isLogin && (
          <div className="mt-4 text-xs text-gray-600 text-center">
            <p>Having trouble? Try using a different email address.</p>
          </div>
        )}
      </div>
    </div>
  )
}