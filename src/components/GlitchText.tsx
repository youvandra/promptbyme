import React, { useState, useEffect } from 'react'

interface GlitchTextProps {
  text: string
  className?: string
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, className = '' }) => {
  const [glitchText, setGlitchText] = useState(text)

  useEffect(() => {
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    let timeoutId: NodeJS.Timeout

    const glitch = () => {
      const chars = text.split('')
      const glitchedChars = chars.map(char => {
        if (Math.random() < 0.1) {
          return glitchChars[Math.floor(Math.random() * glitchChars.length)]
        }
        return char
      })
      setGlitchText(glitchedChars.join(''))

      timeoutId = setTimeout(() => {
        setGlitchText(text)
      }, 50)
    }

    const intervalId = setInterval(glitch, 3000)

    return () => {
      clearInterval(intervalId)
      clearTimeout(timeoutId)
    }
  }, [text])

  return (
    <span className={`font-mono transition-all duration-75 ${className}`}>
      {glitchText}
    </span>
  )
}