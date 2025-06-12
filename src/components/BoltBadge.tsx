import React from 'react'

export const BoltBadge: React.FC = () => {
  return (
    <a
      href="https://bolt.new/"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 transform transition-all duration-300 hover:scale-110 active:scale-95"
    >
      <img
        src="/badge.png"
        alt="Powered by Bolt.new"
        className="w-16 h-16 md:w-20 md:h-20 drop-shadow-lg hover:drop-shadow-xl transition-all duration-300"
        style={{
          filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.3))',
        }}
      />
    </a>
  )
}