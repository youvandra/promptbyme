import React from 'react'

interface GlitchTextProps {
  text: string
  className?: string
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, className = '' }) => {
  return (
    <span className={`transition-all duration-75 ${className}`}>
      {text}
    </span>
  )
}