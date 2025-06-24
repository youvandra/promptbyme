import React, { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div 
      className="fixed bottom-4 left-70 z-50"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: isVisible ? 0 : 50, opacity: isVisible ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-xl text-sm font-medium ${
        type === 'success' 
          ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-emerald-500/10'
          : 'bg-red-500/20 border border-red-500/30 text-red-400 shadow-red-500/10'
      }`}>
        {type === 'success' ? <Check size={16} /> : <X size={16} />}
        <span>{message}</span>
        <button 
          onClick={onClose}
          className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    </motion.div>
  )
}