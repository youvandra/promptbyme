import React, { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'

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
    <div className={`fixed bottom-4 left-4 z-50 transform transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl text-sm font-medium ${
        type === 'success' 
          ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
          : 'bg-red-500/20 border border-red-500/30 text-red-400'
      }`}>
        {type === 'success' ? <Check size={16} /> : <X size={16} />}
        <span>{message}</span>
      </div>
    </div>
  )
}