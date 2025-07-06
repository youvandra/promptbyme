/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['IBM Plex Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      colors: {
        primary: '#76a2f7', // Background page
        secondary: '#ff6a3d', // Variable color
        highlight: '#f5f7a1', // Main button color
        zinc: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(118, 162, 247, 0.3)',
        'glow-lg': '0 0 40px rgba(118, 162, 247, 0.4)',
        'neo-brutalism': '6px 6px 0px 0px rgba(0,0,0,1)',
        'neo-brutalism-sm': '4px 4px 0px 0px rgba(0,0,0,1)',
        'neo-brutalism-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
        'neo-brutalism': '6px 6px 0px 0px rgba(0,0,0,1)',
        'neo-brutalism-sm': '4px 4px 0px 0px rgba(0,0,0,1)',
        'neo-brutalism-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
      },
      borderRadius: {
        'neo': '28px',
      },
    },
  },
  plugins: [],
}